
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import random
from flask_cors import CORS  # Import the CORS extension


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes



import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import datetime
import yfinance as yf
import joblib
from sklearn.preprocessing import MinMaxScaler
import json
from tqdm import tqdm
import os
from typing import List, Dict, Any, Union, Tuple

# Define the BiLSTM model (same as in your training code)
class BiLSTMModel(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=1):
        super(BiLSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # BiLSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True
        )
        
        # Fully connected layer
        self.fc = nn.Linear(hidden_size * 2, output_size)  # *2 because bidirectional
    
    def forward(self, x):
        # Initialize hidden state and cell state
        batch_size = x.size(0)
        h0 = torch.zeros(self.num_layers * 2, batch_size, self.hidden_size).to(x.device)  # *2 because bidirectional
        c0 = torch.zeros(self.num_layers * 2, batch_size, self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Get output from last time step
        out = self.fc(out[:, -1, :])
        
        return out

def predict_future(model, last_sequence, steps, scaler_diff, current_price):
    """Predict future values using trained model and GBM."""
    model.eval()
    
    # Initialize arrays for differences and actual prices
    future_prices = []
    future_prices.append(current_price)
    
    # Create a copy of the last sequence for prediction
    current_sequence = last_sequence.clone()
    
    # Parameters for Geometric Brownian Motion
    # Using default parameters if historical data isn't available
    daily_mu = 0.0002  # Default daily drift
    daily_sigma = 0.02  # Default daily volatility
    
    device = next(model.parameters()).device
    
    for _ in range(steps):
        with torch.no_grad():
            # Get model prediction for next difference
            current_sequence_tensor = current_sequence.unsqueeze(0).to(device)
            pred_diff_scaled = model(current_sequence_tensor)
            
            # Inverse transform to get actual difference
            pred_diff = scaler_diff.inverse_transform(pred_diff_scaled.cpu().numpy())[0][0]
            
            # Use GBM to add stochastic component to the predicted difference
            dt = 1  # One day
            drift = (daily_mu - 0.5 * daily_sigma**2) * dt
            diffusion = daily_sigma * np.sqrt(dt) * np.random.normal(0, 1)
            
            # Combine model prediction with GBM
            stochastic_factor = np.exp(drift + diffusion)
            adjustment = current_price * (stochastic_factor - 1)
            
            # Blend model prediction with GBM
            blend_weight = 0.7  # Higher weight to model prediction
            blended_diff = (blend_weight * pred_diff) + ((1 - blend_weight) * adjustment)
            
            # Calculate next price
            next_price = current_price + blended_diff
            
            # Ensure price doesn't go negative
            next_price = max(0.01, next_price)
            
            # Store results
            future_prices.append(next_price)
            
            # Update current price
            current_price = next_price
            
            # Update sequence for next prediction (with the scaled difference)
            new_diff_scaled = torch.tensor([[pred_diff_scaled.item()]], dtype=torch.float32)
            current_sequence = torch.cat([current_sequence[1:], new_diff_scaled], dim=0)
    
    future_prices = np.array(future_prices[1:]).reshape(-1, 1)  # Remove the initial price
    
    return future_prices

def fetch_and_prepare_data(ticker_symbol: str, seq_length: int) -> Tuple[np.ndarray, float, pd.DatetimeIndex]:
    """Fetch ticker data and prepare it for prediction."""
    # Fetch data using yfinance
    ticker = yf.Ticker(ticker_symbol)
    df = ticker.history(period="max",interval='1d')
    
    # Make sure the data has a Close column
    if 'Close' not in df.columns:
        raise ValueError(f"No 'Close' price data available for {ticker_symbol}")
    
    # Extract closing prices
    close_prices = df['Close'].values.astype(float).reshape(-1, 1)
    
    # Create differenced data
    diff_close_prices = np.diff(close_prices, axis=0)
    
    # Get the last price (for starting predictions)
    last_price = close_prices[-1][0]
    
    # Get the dates
    dates = df.index
    
    # If we don't have enough data for the sequence length, pad with zeros
    if len(diff_close_prices) < seq_length:
        padding = np.zeros((seq_length - len(diff_close_prices), 1))
        diff_close_prices = np.vstack([padding, diff_close_prices])
    
    return diff_close_prices, last_price, dates, df

def predict_stock_prices(
    ticker_symbols: List[str], 
    model_path: str, 
    scaler_path: str, 
    metadata_path: str
) -> Dict[str, Any]:
    """
    Predict stock prices for multiple ticker symbols for -15 to +15 years.
    
    Args:
        ticker_symbols: List of ticker symbols to predict
        model_path: Path to the trained BiLSTM model
        scaler_path: Path to the saved scaler for differences
        metadata_path: Path to the saved model metadata
    
    Returns:
        Dictionary with ticker symbols as keys and arrays of dates and prices as values
    """
    # Set random seeds for reproducibility
    torch.manual_seed(42)
    np.random.seed(42)
    
    # Load the model, scaler, and metadata
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Load model metadata
    model_metadata = joblib.load(metadata_path)
    seq_length = model_metadata['seq_length']
    
    # Initialize and load the model
    model = BiLSTMModel().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    
    # Load the scaler
    scaler_diff = joblib.load(scaler_path)
    
    # Trading days per year (approximately)
    trading_days_per_year = 252
    
    # Prepare the result dictionary
    result = {}
    
    # Process each ticker symbol
    for symbol in tqdm(ticker_symbols, desc="Processing tickers"):
        try:
            # Fetch and prepare data
            diff_close_prices, last_price, historical_dates, df = fetch_and_prepare_data(symbol, seq_length)
            
            # Scale the differenced data
            diff_scaled = scaler_diff.transform(diff_close_prices[-seq_length:])
            
            # Convert to tensor
            last_diff_sequence = torch.tensor(diff_scaled, dtype=torch.float32)
            
            # Calculate the number of days to predict (15 years)
            future_days = trading_days_per_year * 15
            
            # Predict future prices
            future_prices = predict_future(model, last_diff_sequence, future_days, scaler_diff, last_price)
            
            # Create future dates
            last_date = historical_dates[-1]
            future_dates = [last_date + datetime.timedelta(days=i+1) for i in range(future_days)]
            
            # Format dates to strings for JSON serialization
            future_dates_str = [date.strftime('%Y-%m-%d') for date in future_dates]
            
            # Get historical dates for past 15 years or as many as available
            past_days = min(len(historical_dates), trading_days_per_year * 15)
            historical_subset = historical_dates[-past_days:]
            historical_prices = df['Close'].values[-past_days:]
            
            # Format historical dates to strings
            historical_dates_str = [date.strftime('%Y-%m-%d') for date in historical_subset]
            
            # Combine historical and future data
            all_dates = historical_dates_str + future_dates_str
            all_prices = np.concatenate([historical_prices, future_prices.flatten()])
            
            # Store in result dictionary
            result[symbol] = [
                {"date": date, "value": float(value)} for date, value in zip(all_dates, all_prices)
            ]

            
        except Exception as e:
            print(f"Error processing {symbol}: {str(e)}")
            result[symbol] = {"error": str(e)}
    
    return result

def batch_predict_to_json(
    ticker_symbols: List[str], 
    model_path: str, 
    scaler_path: str, 
    metadata_path: str, 
    output_path: str = "stock_predictions.json"
) -> str:
    """
    Batch predict stock prices and save to JSON file.
    
    Args:
        ticker_symbols: List of ticker symbols
        model_path: Path to the trained model
        scaler_path: Path to the saved scaler
        metadata_path: Path to the saved metadata
        output_path: Path to save the output JSON
        
    Returns:
        Path to the saved JSON file
    """
    # Get predictions
    predictions = predict_stock_prices(ticker_symbols, model_path, scaler_path, metadata_path)
    
    return predictions

# Example usage
def get_stock_predictions(tickers):
    # Example ticker list
    # tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
    
    # Paths to saved model files
    model_path = "bilstm_stock_model.pth"
    scaler_path = "scaler_diff.pkl"
    metadata_path = "model_metadata.pkl"
    
    # Run batch prediction
    print('ok')
    output_file = batch_predict_to_json(tickers, model_path, scaler_path, metadata_path)
    return output_file


# Generate list of dates from -15 to +15 years around today
def get_exact_date_range():
    today = datetime.today().date()
    start_date = today - relativedelta(years=15)
    end_date = today + relativedelta(years=15)

    date_list = []
    current_date = start_date
    while current_date <= end_date:
        date_list.append(current_date)
        current_date += timedelta(days=1)

    return date_list

# Generate 2D date-value pairs
def generate_random_time_series():
    date_list = get_exact_date_range()
    return [
        {
            "date": str(date),
            "value": round(random.uniform(100, 500), 2)
        }
        for date in date_list
    ]

@app.route('/api/get-time-series', methods=['POST'])
def get_time_series():
    data = request.get_json()
    tickers = data.get('tickers', [])

    result = get_stock_predictions(tickers)
    # print(result)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
