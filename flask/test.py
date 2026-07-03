import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
# Enable CORS for requests from the frontend development server (adjust origin in production)
# Corrected line for Vite default port
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Helper function to convert numpy types for JSON serialization
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

@app.route('/api/stock/<ticker_symbol>', methods=['GET'])
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


if __name__ == '__main__':
    # Use 0.0.0.0 to be accessible on the network if needed
    app.run(debug=True, host='0.0.0.0', port=5001) # Use a different port than frontend