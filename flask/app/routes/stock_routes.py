from flask import Blueprint, jsonify
from app.services.finance_utils import fetch_financial_metrics
from app.services.smart_api_client import smart_api
import yfinance as yf
import traceback
from flask import request
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import random
import numpy as np
import joblib
import torch
import torch.nn as nn
from typing import List, Tuple, Dict, Any
from flask import Blueprint
import pandas as pd
import tqdm
from flask import jsonify
from flask import request
import logging

logging.basicConfig(level=logging.INFO)


stock_bp = Blueprint('stocks', __name__, url_prefix='/api')



# Define a mapping function to convert from Angel Broking format to yfinance format
def convert_to_yfinance_symbol(angel_symbol):
    # Remove the -EQ suffix
    base_symbol = angel_symbol.replace("-EQ", "")
    
    # Dictionary of US/international stocks that need special handling
    us_stocks = {
        "MSFT": "MSFT",  # Microsoft
        "AAPL": "AAPL",  # Apple
        "GOOGL": "GOOGL",  # Google
        "AMZN": "AMZN",  # Amazon
        # Add more as needed
    }
    
    # Check if it's a US stock
    if base_symbol in us_stocks:
        return us_stocks[base_symbol]
    
    # For Indian stocks, append .NS (for NSE)
    return f"{base_symbol}.NS"



def fetch_financial_metrics(angel_symbol, holding_data):
    """
    Fetches financial metrics for a given ticker symbol using yfinance.
    Includes holding-specific data like quantity, invested value, and P&L.
    
    Parameters:
    angel_symbol (str): The original symbol from Angel Broking
    holding_data (dict): Data about this specific holding from Angel Broking API
    """
    # Convert to yfinance symbol
    ticker_symbol = convert_to_yfinance_symbol(angel_symbol)
    
    # Fetch data from yfinance
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info
    
    # Get holding-specific data
    quantity = int(holding_data.get('quantity', 0))
    avg_price = float(holding_data.get('averageprice', 0))
    current_price = info.get('currentPrice', 0)
    if current_price is None:  # Handle None values
        current_price = float(holding_data.get('ltp', 0))  # Use last traded price from Angel if yfinance returns None
    
    # Calculate invested value
    invested_value = avg_price * quantity
    
    # Calculate current value
    current_value = current_price * quantity
    
    # Calculate P&L in amount and percentage
    pnl_amount = current_value - invested_value
    pnl_percentage = (pnl_amount / invested_value) * 100 if invested_value > 0 else 0
    
    metrics = {
        'Ticker': ticker_symbol,
        'Company Name': info.get('longName'),
        'Sector': info.get('sector'),
        'Industry': info.get('industry'),
        'Market Cap': info.get('marketCap'),
        'P/E Ratio': info.get('trailingPE'),
        'P/B Ratio': info.get('priceToBook'),
        'Dividend Yield': info.get('dividendYield'),
        'Return on Equity (ROE)': info.get('returnOnEquity'),
        'Debt to Equity Ratio': info.get('debtToEquity'),
        'Current Price': current_price,
        '52-Week High': info.get('fiftyTwoWeekHigh'),
        '52-Week Low': info.get('fiftyTwoWeekLow'),
        'Beta': info.get('beta'),
        'EPS (TTM)': info.get('trailingEps'),
        'Book Value': info.get('bookValue'),
        'Operating Margin': info.get('operatingMargins'),
        'Profit Margin': info.get('profitMargins'),
        'Revenue': info.get('totalRevenue'),
        'Gross Profit': info.get('grossProfits'),
        'Free Cash Flow': info.get('freeCashflow'),
        'Return on Assets (ROA)': info.get('returnOnAssets'),
        'EBITDA': info.get('ebitda'),
        'Quick Ratio': info.get('quickRatio'),
        'Current Ratio': info.get('currentRatio'),
        'Total Debt': info.get('totalDebt'),
        'Total Cash': info.get('totalCash'),
        'Shares Outstanding': info.get('sharesOutstanding'),
        'Float Shares': info.get('floatShares'),
        'Held by Insiders': info.get('heldPercentInsiders'),
        'Held by Institutions': info.get('heldPercentInstitutions'),
        'Short Ratio': info.get('shortRatio'),
        'Short Percentage of Float': info.get('shortPercentOfFloat'),
        'Analyst Recommendation Mean': info.get('recommendationMean'),
        'Analyst Recommendation Key': info.get('recommendationKey'),
        'Target Mean Price': info.get('targetMeanPrice'),
        'Target High Price': info.get('targetHighPrice'),
        'Target Low Price': info.get('targetLowPrice'),
        'Number of Analysts': info.get('numberOfAnalystOpinions'),
        'Earnings Growth': info.get('earningsGrowth'),
        'Revenue Growth': info.get('revenueGrowth'),
        'Gross Margins': info.get('grossMargins'),
        'EBITDA Margins': info.get('ebitdaMargins'),
        'Operating Margins': info.get('operatingMargins'),
        'Financial Currency': info.get('financialCurrency'),
        # Add the portfolio-specific fields needed by the frontend
        'Holding Quantity': quantity,
        'Average Price': avg_price,
        'Invested Value': invested_value,
        'Current Value': current_value,
        'PnL': pnl_amount,
        'PnL Percentage': pnl_percentage,
        # Calculate potential upside
        'Potential Upside': ((info.get('targetMeanPrice', current_price) / current_price) - 1) * 100 if current_price > 0 else 0
    }
    return metrics



@stock_bp.route('/stocks', methods=['GET'])
def get_stocks():
    holdings_data = []
    try:
        # Get detailed holdings data from the API
        holdings_response = smart_api.holding()
        if holdings_response['status']:
            # Process each holding
            for holding in holdings_response['data']:
                angel_symbol = holding['tradingsymbol']
                metrics = fetch_financial_metrics(angel_symbol, holding)
                holdings_data.append(metrics)
        else:
            print(f"Error fetching holdings: {holdings_response['message']}")
            
        return jsonify(holdings_data)
    except Exception as e:
        # Log the error
        print(f"Error fetching stock data: {str(e)}")
        # Return an empty array, the frontend will use sample data
        return jsonify([])

    




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

@stock_bp.route('/get-time-series', methods=['POST'])
def get_time_series():
    data = request.get_json()
    tickers = data.get('tickers', [])

    result = get_stock_predictions(tickers)
    # print(result)
    return jsonify(result)



def analyze_investor_behavior(holdings_data):
    """
    Analyzes investor behavior based on their stock holdings.
    Returns a summary of sector allocation, market cap distribution, risk profile, and other insights.
    
    Parameters:
    holdings_data (list): List of dictionaries containing stock metrics and holding information
    """
    if not holdings_data:
        return {
            "summary": "No holdings data available to analyze investor behavior."
        }
    
    # Calculate total portfolio value
    total_invested = sum(holding.get('Invested Value', 0) for holding in holdings_data)
    total_current_value = sum(holding.get('Current Value', 0) for holding in holdings_data)
    
    # Analyze sector distribution
    sectors = {}
    for holding in holdings_data:
        sector = holding.get('Sector', 'Unknown')
        if sector not in sectors:
            sectors[sector] = 0
        sectors[sector] += holding.get('Current Value', 0)
    
    # Calculate sector percentages
    sector_percentages = {sector: (value / total_current_value * 100) for sector, value in sectors.items() if total_current_value > 0}
    
    # Identify dominant sectors (>15%)
    dominant_sectors = {sector: pct for sector, pct in sector_percentages.items() if pct > 15}
    
    # Analyze market cap distribution
    large_cap = 0
    mid_cap = 0
    small_cap = 0
    
    for holding in holdings_data:
        market_cap = holding.get('Market Cap', 0)
        current_value = holding.get('Current Value', 0)
        
        # Define market cap categories (adjust thresholds as needed)
        if market_cap > 200000000000:  # 20,000 crores for large cap
            large_cap += current_value
        elif market_cap > 50000000000:  # 5,000 crores for mid cap
            mid_cap += current_value
        else:
            small_cap += current_value
    
    # Calculate market cap percentages
    if total_current_value > 0:
        large_cap_pct = (large_cap / total_current_value) * 100
        mid_cap_pct = (mid_cap / total_current_value) * 100
        small_cap_pct = (small_cap / total_current_value) * 100
    else:
        large_cap_pct = mid_cap_pct = small_cap_pct = 0
    
    # Analyze stock concentration
    num_stocks = len(holdings_data)
    avg_investment = total_invested / num_stocks if num_stocks > 0 else 0
    
    # Find highest value holding
    highest_holding = max(holdings_data, key=lambda x: x.get('Current Value', 0)) if holdings_data else {}
    highest_holding_pct = (highest_holding.get('Current Value', 0) / total_current_value * 100) if total_current_value > 0 else 0
    
    # Analyze risk profile
    high_beta_stocks = [holding for holding in holdings_data if holding.get('Beta', 0) and holding.get('Beta', 0) > 1.2]
    high_beta_value = sum(holding.get('Current Value', 0) for holding in high_beta_stocks)
    high_beta_pct = (high_beta_value / total_current_value * 100) if total_current_value > 0 else 0
    
    # Calculate portfolio beta (weighted average)
    weighted_beta = 0
    for holding in holdings_data:
        if holding.get('Beta') and holding.get('Current Value'):
            weighted_beta += holding.get('Beta', 0) * (holding.get('Current Value', 0) / total_current_value) if total_current_value > 0 else 0
    
    # Calculate dividend focus
    dividend_stocks = [holding for holding in holdings_data if holding.get('Dividend Yield', 0) and holding.get('Dividend Yield', 0) > 0.02]  # >2% yield
    dividend_value = sum(holding.get('Current Value', 0) for holding in dividend_stocks)
    dividend_pct = (dividend_value / total_current_value * 100) if total_current_value > 0 else 0
    
    # Calculate growth vs value orientation
    growth_stocks = [h for h in holdings_data if h.get('P/E Ratio', 0) and h.get('P/E Ratio', 0) > 25]
    value_stocks = [h for h in holdings_data if h.get('P/E Ratio', 0) and h.get('P/E Ratio', 0) < 15 and h.get('P/E Ratio', 0) > 0]
    
    growth_value = sum(h.get('Current Value', 0) for h in growth_stocks)
    value_stock_value = sum(h.get('Current Value', 0) for h in value_stocks)
    
    growth_pct = (growth_value / total_current_value * 100) if total_current_value > 0 else 0
    value_pct = (value_stock_value / total_current_value * 100) if total_current_value > 0 else 0
    
    # Overall profit/loss
    overall_pnl = total_current_value - total_invested
    overall_pnl_pct = (overall_pnl / total_invested * 100) if total_invested > 0 else 0
    
    # Determine investor style and risk profile
    investor_style = ""
    risk_profile = ""
    
    # Determine style based on metrics
    if growth_pct > 50:
        investor_style = "Growth Investor"
    elif value_pct > 50:
        investor_style = "Value Investor"
    elif dividend_pct > 40:
        investor_style = "Income Investor"
    else:
        investor_style = "Balanced Investor"
    
    # Determine risk profile
    if small_cap_pct > 40 or high_beta_pct > 50:
        risk_profile = "Aggressive"
    elif large_cap_pct > 60 and high_beta_pct < 30:
        risk_profile = "Conservative"
    else:
        risk_profile = "Moderate"
    
    # Create the behavior analysis summary with emojis
    summary = f"""
🔍 Portfolio Overview:

🏦 You've invested in {num_stocks} stocks across {len(sectors)} different sectors.
💰 Your top sector is {max(sector_percentages.items(), key=lambda x: x[1])[0]} at {max(sector_percentages.items(), key=lambda x: x[1])[1]:.1f}% of your portfolio.

📊 Market Cap Breakdown:
• 🏢 Large Caps: {large_cap_pct:.1f}%
• 🏠 Mid Caps: {mid_cap_pct:.1f}%
• 🏡 Small Caps: {small_cap_pct:.1f}%

🧠 Your Investing Style:
• 🔮 You seem to be a {investor_style} with a {risk_profile} risk appetite.
• {"🚀 You're taking some risks! " if risk_profile == "Aggressive" else "🛡️ You prefer safer investments. " if risk_profile == "Conservative" else "⚖️ You balance risk and safety. "}
• {"📈 You favor high-growth companies. " if growth_pct > 40 else "💎 You seek undervalued companies. " if value_pct > 40 else ""}
• {"💵 You have a strong focus on dividend income. " if dividend_pct > 30 else ""}

⚠️ Risk Analysis:
• 📉 {high_beta_pct:.1f}% of your portfolio is in high-volatility stocks.
• 🌡️ Your portfolio's overall risk level (beta) is {weighted_beta:.2f} {" - higher than market" if weighted_beta > 1 else " - lower than market" if weighted_beta < 1 else "- same as market"}.

🔎 Diversification:
• {"👍 Well diversified across sectors" if len(dominant_sectors) >= 3 else "⚠️ Somewhat concentrated in a few sectors"}
• {"⚠️ Your biggest holding makes up {highest_holding_pct:.1f}% of your portfolio." if highest_holding_pct > 20 else ""}

💪 Strengths:
• {"✅ Good sector diversification" if len(sectors) > 4 else ""}
• {"✅ Balanced across market caps" if all(x > 20 for x in [large_cap_pct, mid_cap_pct, small_cap_pct]) else ""}
• {"✅ Strong dividend focus" if dividend_pct > 30 else ""}

🚩 Areas to Consider:
• {"⚠️ High concentration in top holdings" if highest_holding_pct > 25 else ""}
• {"⚠️ Limited sector diversification" if len(sectors) < 4 else ""}
• {"⚠️ Heavy tilt toward small caps" if small_cap_pct > 50 else ""}
• {"⚠️ High overall portfolio risk" if weighted_beta > 1.3 else ""}
"""
    
    # Return the analysis results
    return {
        "summary": summary,
        "sector_allocation": sector_percentages,
        "market_cap_distribution": {
            "large_cap": large_cap_pct,
            "mid_cap": mid_cap_pct,
            "small_cap": small_cap_pct
        },
        "investor_style": investor_style,
        "risk_profile": risk_profile,
        "metrics": {
            "portfolio_beta": weighted_beta,
            "high_beta_percentage": high_beta_pct,
            "dividend_focus": dividend_pct,
            "growth_orientation": growth_pct,
            "value_orientation": value_pct,
            "overall_pnl_percentage": overall_pnl_pct
        }
    }

@stock_bp.route('/investor-behavior')
def get_investor_behavior():
    """
    API endpoint that returns an analysis of investor behavior based on holdings
    """
    try:
        # Get detailed holdings data from the API
        holdings_response = smart_api.holding()
        holdings_data = []
        
        if holdings_response['status']:
            # Process each holding
            for holding in holdings_response['data']:
                angel_symbol = holding['tradingsymbol']
                metrics = fetch_financial_metrics(angel_symbol, holding)
                holdings_data.append(metrics)
            
        
            # Analyze investor behavior
            behavior_analysis = analyze_investor_behavior(holdings_data)
            return jsonify(behavior_analysis)
        else:
            print(f"Error fetching holdings: {holdings_response['message']}")
            return jsonify({"error": "Unable to fetch holdings data"})
    except Exception as e:
        # Log the error
        print(f"Error analyzing investor behavior: {str(e)}")
        return jsonify({"error": "Error analyzing investor behavior", "message": str(e)})
    

def convert_numpy_types(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat() # Return as ISO string
    elif isinstance(obj, (np.datetime64, np.timedelta64)):
        # Handle numpy datetime/timedelta if necessary, converting to ISO string or seconds
         return str(obj)
    elif pd.isna(obj):
        return None # Convert Pandas NaN/NaT to None (JSON null)
    return obj

# Helper function to safely get info data
def get_safe_info(ticker_info, key, default=None):
     val = ticker_info.get(key, default)
     # Further clean specific problematic values if needed
     if isinstance(val, (float, np.floating)) and (np.isnan(val) or np.isinf(val)):
         return default
     if pd.isna(val):
         return default
     return convert_numpy_types(val)

@stock_bp.route('/stock/<ticker_symbol>', methods=['GET'])
def get_stock_data(ticker_symbol):
    """
    Fetches historical data and fundamental info for a given stock ticker.
    Accepts 'interval' and 'period' query parameters.
    """


    if not ticker_symbol:
        return jsonify({"error": "Ticker symbol is required"}), 400

    interval = request.args.get('interval', '1d') # Default to daily
    period = request.args.get('period', 'max')     # Default to max

    # Validate inputs (basic example)
    allowed_intervals = ['1d', '1h', '5m', '15m', '30m', '90m'] # Add more as needed by yfinance/frontend
    allowed_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']

    if interval not in allowed_intervals:
        return jsonify({"error": f"Invalid interval. Allowed: {', '.join(allowed_intervals)}"}), 400
    if period not in allowed_periods:
         return jsonify({"error": f"Invalid period. Allowed: {', '.join(allowed_periods)}"}), 400

    # --- Important yfinance constraints ---
    # Hourly data typically limited to last 730 days (2y)
    # Minute data typically limited to last 7 days (for >1d period) or 60 days (intraday)
    if interval != '1d' and period == 'max':
        logging.warning(f"Max period requested for non-daily interval ({interval}). Defaulting period to '2y'.")
        period = '2y' # Adjust max period for hourly/minute data if needed
    if interval != '1d' and period == '10y':
        logging.warning(f"10y period requested for non-daily interval ({interval}). Defaulting period to '2y'.")
        period = '2y'
    if interval != '1d' and period == '5y':
         logging.warning(f"5y period requested for non-daily interval ({interval}). Defaulting period to '2y'.")
         period = '2y'


    logging.info(f"Fetching data for {ticker_symbol}, Interval: {interval}, Period: {period}")

    try:
        ticker = yf.Ticker(ticker_symbol)

        # 1. Get Historical Data
        # Use repair=True to attempt fixing some data issues
        history_df = ticker.history(period=period, interval=interval, repair=True)

        if history_df.empty:
             # Check if ticker exists but has no data for this period/interval
             try:
                 # Attempt to get basic info to see if ticker is valid at all
                 _ = ticker.info.get('symbol')
                 logging.warning(f"No historical data found for {ticker_symbol} with period={period}, interval={interval}")
                 return jsonify({
                     "error": f"No historical data found for {ticker_symbol} for the selected period/interval.",
                     "info": None, # Provide info if possible, even if history fails? Maybe not.
                     "history": []
                     }), 404 # Or 200 with empty data? 404 seems reasonable if primary data missing.
             except Exception as info_err:
                  logging.error(f"Ticker {ticker_symbol} seems invalid or yfinance error: {info_err}")
                  return jsonify({"error": f"Invalid ticker symbol or data not available: {ticker_symbol}"}), 404


        # Prepare history data for JSON and charting
        history_df = history_df.reset_index() # Make Datetime index a column

        # Ensure correct column names (lowercase for consistency)
        history_df.columns = [col.lower().replace(' ', '_').replace('datetime', 'date') for col in history_df.columns]

        # Convert date to ISO format string (better for cross-language compatibility)
        # Make sure the column name is 'date' after lowercasing
        date_col_name = 'date' # Adjust if your lowercasing changes 'Datetime' or 'Date' differently
        if date_col_name not in history_df.columns:
             # Try common alternatives if renaming failed unexpectedly
             potential_date_cols = ['timestamp', 'index']
             for col in potential_date_cols:
                 if col in history_df.columns:
                     date_col_name = col
                     break
             else:
                 return jsonify({"error": "Could not find date column in historical data."}), 500


        history_df[date_col_name] = history_df[date_col_name].apply(lambda d: d.isoformat())

        # Select and rename columns for the chart
        history_df = history_df[[date_col_name, 'open', 'high', 'low', 'close', 'volume']]
        # Replace potential NaN/Infinity values with None before conversion
        history_df.replace([np.inf, -np.inf], np.nan, inplace=True)
        history_data = history_df.where(pd.notnull(history_df), None).to_dict('records') # Convert NaN to None


        # 2. Get Fundamental Info
        ticker_info = ticker.info

        # Select and clean relevant fundamental data
        # Choose metrics you want to display - consult yfinance docs/ticker.info output
        fundamentals = {
            'symbol': get_safe_info(ticker_info, 'symbol'),
            'longName': get_safe_info(ticker_info, 'longName'),
            'sector': get_safe_info(ticker_info, 'sector'),
            'industry': get_safe_info(ticker_info, 'industry'),
            'country': get_safe_info(ticker_info, 'country'),
            'website': get_safe_info(ticker_info, 'website'),
            'longBusinessSummary': get_safe_info(ticker_info, 'longBusinessSummary'),
            'marketCap': get_safe_info(ticker_info, 'marketCap'),
            'trailingPE': get_safe_info(ticker_info, 'trailingPE'),
            'forwardPE': get_safe_info(ticker_info, 'forwardPE'),
            'dividendYield': get_safe_info(ticker_info, 'dividendYield'),
            'payoutRatio': get_safe_info(ticker_info, 'payoutRatio'),
            'beta': get_safe_info(ticker_info, 'beta'),
            'priceToBook': get_safe_info(ticker_info, 'priceToBook'),
            'enterpriseValue': get_safe_info(ticker_info, 'enterpriseValue'),
            'enterpriseToRevenue': get_safe_info(ticker_info, 'enterpriseToRevenue'),
            'enterpriseToEbitda': get_safe_info(ticker_info, 'enterpriseToEbitda'),
            'profitMargins': get_safe_info(ticker_info, 'profitMargins'),
            'grossMargins': get_safe_info(ticker_info, 'grossMargins'),
            'operatingMargins': get_safe_info(ticker_info, 'operatingMargins'),
            'revenueGrowth': get_safe_info(ticker_info, 'revenueGrowth'),
            'earningsGrowth': get_safe_info(ticker_info, 'earningsGrowth'), # Often quarterly, check key 'earningsQuarterlyGrowth' if needed
            'totalRevenue': get_safe_info(ticker_info, 'totalRevenue'),
            'revenuePerShare': get_safe_info(ticker_info, 'revenuePerShare'),
            'returnOnAssets': get_safe_info(ticker_info, 'returnOnAssets'),
            'returnOnEquity': get_safe_info(ticker_info, 'returnOnEquity'),
            'totalCash': get_safe_info(ticker_info, 'totalCash'),
            'totalDebt': get_safe_info(ticker_info, 'totalDebt'),
            'totalCashPerShare': get_safe_info(ticker_info, 'totalCashPerShare'),
            'bookValue': get_safe_info(ticker_info, 'bookValue'), # Per share
            'fiftyTwoWeekHigh': get_safe_info(ticker_info, 'fiftyTwoWeekHigh'),
            'fiftyTwoWeekLow': get_safe_info(ticker_info, 'fiftyTwoWeekLow'),
            'averageVolume': get_safe_info(ticker_info, 'averageVolume'),
            'currentPrice': get_safe_info(ticker_info, 'currentPrice') or get_safe_info(ticker_info, 'previousClose'), # Add current/previous close
             # Add more fields as desired... consult ticker.info keys for your test tickers
        }


        logging.info(f"Successfully fetched data for {ticker_symbol}")
        return jsonify({
            "info": fundamentals,
            "history": history_data
        })

    except Exception as e:
        logging.error(f"Error fetching data for {ticker_symbol}: {e}", exc_info=True)
        # Check if it's likely an invalid ticker error from yfinance (needs inspection of specific exceptions)
        # For now, return a generic server error.
        return jsonify({"error": f"Failed to fetch data for {ticker_symbol}. Check ticker or try again later."}), 500



@stock_bp.route('/compare-stocks', methods=['POST'])
def compare_stocks():
    try:
        # Get tickers from the request
        data = request.get_json()
        ticker1 = data.get('ticker1', '').upper()
        ticker2 = data.get('ticker2', '').upper()
        
        if not ticker1 or not ticker2:
            return jsonify({"error": "Please provide both ticker symbols"}), 400
        
        # Fetch data from yfinance
        stock1_data = get_stock_data(ticker1)
        stock2_data = get_stock_data(ticker2)
        
        # Compare the stocks
        comparison_result = {
            "ticker1": ticker1,
            "ticker2": ticker2,
            "stock1": stock1_data,
            "stock2": stock2_data,
            "analysis": generate_analysis(ticker1, ticker2, stock1_data, stock2_data)
        }
        
        return jsonify(comparison_result)
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def get_stock_data(ticker):
    """
    Fetch comprehensive stock data from yfinance
    """
    try:
        # Create Ticker object
        stock = yf.Ticker(ticker)
        
        # Get basic info
        info = stock.info
        
        # Get historical price data
        hist = stock.history(period="1y")
        
        # Calculate additional metrics
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        previous_close = info.get('previousClose', 0)
        daily_change = ((current_price - previous_close) / previous_close * 100) if previous_close else 0
        
        # Extract key financial ratios
        pe_ratio = info.get('trailingPE', info.get('forwardPE', 0))
        pb_ratio = info.get('priceToBook', 0)
        ps_ratio = info.get('priceToSalesTrailing12Months', 0)
        dividend_yield = info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0
        
        # Get balance sheet data
        try:
            balance_sheet = stock.balance_sheet
            
            # Calculate current ratio if balance sheet data is available
            if not balance_sheet.empty and 'Total Current Assets' in balance_sheet.index and 'Total Current Liabilities' in balance_sheet.index:
                current_assets = balance_sheet.loc['Total Current Assets'].iloc[0]
                current_liabilities = balance_sheet.loc['Total Current Liabilities'].iloc[0]
                current_ratio = float(current_assets / current_liabilities) if current_liabilities else 0
            else:
                current_ratio = 0
                
            # Calculate debt-to-equity ratio
            if not balance_sheet.empty and 'Total Debt' in balance_sheet.index and 'Total Stockholder Equity' in balance_sheet.index:
                total_debt = balance_sheet.loc['Total Debt'].iloc[0] if 'Total Debt' in balance_sheet.index else 0
                total_equity = balance_sheet.loc['Total Stockholder Equity'].iloc[0]
                debt_to_equity = float(total_debt / total_equity) if total_equity else 0
            else:
                debt_to_equity = 0
        except:
            current_ratio = 0
            debt_to_equity = 0
        
        # Get income statement data
        try:
            income_stmt = stock.income_stmt
            
            # Calculate profit margin
            if not income_stmt.empty and 'Net Income' in income_stmt.index and 'Total Revenue' in income_stmt.index:
                net_income = income_stmt.loc['Net Income'].iloc[0]
                revenue = income_stmt.loc['Total Revenue'].iloc[0]
                profit_margin = float(net_income / revenue * 100) if revenue else 0
            else:
                profit_margin = info.get('profitMargins', 0) * 100 if info.get('profitMargins') else 0
                
            # Calculate ROE
            if not income_stmt.empty and not balance_sheet.empty and 'Net Income' in income_stmt.index and 'Total Stockholder Equity' in balance_sheet.index:
                net_income = income_stmt.loc['Net Income'].iloc[0]
                equity = balance_sheet.loc['Total Stockholder Equity'].iloc[0]
                roe = float(net_income / equity * 100) if equity else 0
            else:
                roe = info.get('returnOnEquity', 0) * 100 if info.get('returnOnEquity') else 0
        except:
            profit_margin = info.get('profitMargins', 0) * 100 if info.get('profitMargins') else 0
            roe = info.get('returnOnEquity', 0) * 100 if info.get('returnOnEquity') else 0
        
        # Create result dictionary
        result = {
            "ticker": ticker,
            "company_name": info.get('shortName', ticker),
            "sector": info.get('sector', 'N/A'),
            "industry": info.get('industry', 'N/A'),
            "market_cap": info.get('marketCap', 0),
            "market_cap_fmt": format_market_cap(info.get('marketCap', 0)),
            "current_price": current_price,
            "daily_change": daily_change,
            "fifty_two_week_high": info.get('fiftyTwoWeekHigh', 0),
            "fifty_two_week_low": info.get('fiftyTwoWeekLow', 0),
            
            # Financial ratios
            "pe_ratio": pe_ratio,
            "pb_ratio": pb_ratio,
            "ps_ratio": ps_ratio,
            "dividend_yield": dividend_yield,
            "peg_ratio": info.get('pegRatio', 0),
            "current_ratio": current_ratio,
            "debt_to_equity": debt_to_equity,
            "profit_margin": profit_margin,
            "return_on_equity": roe,
            
            # Growth metrics
            "revenue_growth": info.get('revenueGrowth', 0) * 100 if info.get('revenueGrowth') else 0,
            "earnings_growth": info.get('earningsGrowth', 0) * 100 if info.get('earningsGrowth') else 0,
            "earnings_quarterly_growth": info.get('earningsQuarterlyGrowth', 0) * 100 if info.get('earningsQuarterlyGrowth') else 0,
            
            # Analyst opinions
            "analyst_rating": info.get('recommendationKey', 'N/A'),
            "target_price": info.get('targetMeanPrice', 0),
            "target_upside": ((info.get('targetMeanPrice', 0) / current_price) - 1) * 100 if current_price else 0,
            "analyst_count": info.get('numberOfAnalystOpinions', 0),
            
            # Additional data
            "beta": info.get('beta', 0),
            "trailing_eps": info.get('trailingEps', 0),
            "forward_eps": info.get('forwardEps', 0),
            "shares_outstanding": info.get('sharesOutstanding', 0),
            "short_ratio": info.get('shortRatio', 0)
        }
        
        return result
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        print(traceback.format_exc())
        return {
            "ticker": ticker,
            "error": str(e),
            "company_name": ticker,
            "sector": "N/A",
            "industry": "N/A"
        }

def generate_analysis(ticker1, ticker2, stock1_data, stock2_data):
    """
    Generate a detailed comparison analysis between two stocks
    """
    analysis = {}
    
    # Value comparison
    analysis["value_comparison"] = {
        "pe_winner": ticker1 if stock1_data.get("pe_ratio", 0) < stock2_data.get("pe_ratio", 0) and stock1_data.get("pe_ratio", 0) > 0 else ticker2,
        "pb_winner": ticker1 if stock1_data.get("pb_ratio", 0) < stock2_data.get("pb_ratio", 0) and stock1_data.get("pb_ratio", 0) > 0 else ticker2,
        "ps_winner": ticker1 if stock1_data.get("ps_ratio", 0) < stock2_data.get("ps_ratio", 0) and stock1_data.get("ps_ratio", 0) > 0 else ticker2,
        "peg_winner": ticker1 if stock1_data.get("peg_ratio", 0) < stock2_data.get("peg_ratio", 0) and stock1_data.get("peg_ratio", 0) > 0 else ticker2,
    }
    
    # Growth comparison
    analysis["growth_comparison"] = {
        "revenue_growth_winner": ticker1 if stock1_data.get("revenue_growth", 0) > stock2_data.get("revenue_growth", 0) else ticker2,
        "earnings_growth_winner": ticker1 if stock1_data.get("earnings_growth", 0) > stock2_data.get("earnings_growth", 0) else ticker2,
        "roe_winner": ticker1 if stock1_data.get("return_on_equity", 0) > stock2_data.get("return_on_equity", 0) else ticker2,
    }
    
    # Financial health comparison
    analysis["financial_health_comparison"] = {
        "current_ratio_winner": ticker1 if stock1_data.get("current_ratio", 0) > stock2_data.get("current_ratio", 0) else ticker2,
        "debt_to_equity_winner": ticker1 if stock1_data.get("debt_to_equity", 0) < stock2_data.get("debt_to_equity", 0) and stock1_data.get("debt_to_equity", 0) > 0 else ticker2,
        "profit_margin_winner": ticker1 if stock1_data.get("profit_margin", 0) > stock2_data.get("profit_margin", 0) else ticker2,
    }
    
    # Dividend comparison
    analysis["dividend_comparison"] = {
        "dividend_winner": ticker1 if stock1_data.get("dividend_yield", 0) > stock2_data.get("dividend_yield", 0) else ticker2,
    }
    
    # Market sentiment comparison
    analysis["market_sentiment"] = {
        "analyst_rating_winner": determine_better_rating(stock1_data.get("analyst_rating", "N/A"), stock2_data.get("analyst_rating", "N/A"), ticker1, ticker2),
        "target_upside_winner": ticker1 if stock1_data.get("target_upside", 0) > stock2_data.get("target_upside", 0) else ticker2,
    }
    
    # Overall score
    stock1_score = 0
    stock2_score = 0
    
    # Count wins in each category
    for category in analysis.values():
        for winner in category.values():
            if winner == ticker1:
                stock1_score += 1
            elif winner == ticker2:
                stock2_score += 1
    
    analysis["overall_winner"] = ticker1 if stock1_score > stock2_score else ticker2
    analysis["score"] = {
        ticker1: stock1_score,
        ticker2: stock2_score
    }
    
    return analysis

def determine_better_rating(rating1, rating2, ticker1, ticker2):
    """
    Determine which stock has a better analyst rating
    """
    rating_rank = {
        "strongBuy": 5,
        "buy": 4,
        "hold": 3,
        "underperform": 2,
        "sell": 1,
        "N/A": 0
    }
    
    rank1 = rating_rank.get(rating1, 0)
    rank2 = rating_rank.get(rating2, 0)
    
    return ticker1 if rank1 > rank2 else ticker2

def format_market_cap(market_cap):
    """
    Format market cap in billions or millions
    """
    if market_cap >= 1e12:
        return f"${market_cap / 1e12:.2f}T"
    elif market_cap >= 1e9:
        return f"${market_cap / 1e9:.2f}B"
    elif market_cap >= 1e6:
        return f"${market_cap / 1e6:.2f}M"
    else:
        return f"${market_cap:,.0f}"