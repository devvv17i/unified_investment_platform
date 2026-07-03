# from flask import Flask, render_template
# import yfinance as yf
# import pandas as pd

# app = Flask(__name__)

# # Sample list of user's stock holdings
# user_holdings = ['AAPL', 'MSFT', 'GOOGL']  # Replace with actual holdings

# def fetch_financial_metrics(ticker_symbol):
#     """
#     Fetches financial metrics for a given ticker symbol using yfinance.
#     """
#     ticker = yf.Ticker(ticker_symbol)
#     info = ticker.info

#     metrics = {
#         'Ticker': ticker_symbol,
#         'Company Name': info.get('longName'),
#         'Sector': info.get('sector'),
#         'Industry': info.get('industry'),
#         'Market Cap': info.get('marketCap'),
#         'P/E Ratio': info.get('trailingPE'),
#         'P/B Ratio': info.get('priceToBook'),
#         'Dividend Yield': info.get('dividendYield'),
#         'Return on Equity (ROE)': info.get('returnOnEquity'),
#         'Debt to Equity Ratio': info.get('debtToEquity'),
#         'Current Price': info.get('currentPrice'),
#         '52-Week High': info.get('fiftyTwoWeekHigh'),
#         '52-Week Low': info.get('fiftyTwoWeekLow'),
#         'Beta': info.get('beta'),
#         'EPS (TTM)': info.get('trailingEps'),
#         'Book Value': info.get('bookValue'),
#         'Operating Margin': info.get('operatingMargins'),
#         'Profit Margin': info.get('profitMargins'),
#         'Revenue': info.get('totalRevenue'),
#         'Gross Profit': info.get('grossProfits'),
#         'Free Cash Flow': info.get('freeCashflow'),
#         'Return on Assets (ROA)': info.get('returnOnAssets'),
#         'EBITDA': info.get('ebitda'),
#         'Quick Ratio': info.get('quickRatio'),
#         'Current Ratio': info.get('currentRatio'),
#         'Total Debt': info.get('totalDebt'),
#         'Total Cash': info.get('totalCash'),
#         'Shares Outstanding': info.get('sharesOutstanding'),
#         'Float Shares': info.get('floatShares'),
#         'Held by Insiders': info.get('heldPercentInsiders'),
#         'Held by Institutions': info.get('heldPercentInstitutions'),
#         'Short Ratio': info.get('shortRatio'),
#         'Short Percentage of Float': info.get('shortPercentOfFloat'),
#         'Analyst Recommendation Mean': info.get('recommendationMean'),
#         'Analyst Recommendation Key': info.get('recommendationKey'),
#         'Target Mean Price': info.get('targetMeanPrice'),
#         'Target High Price': info.get('targetHighPrice'),
#         'Target Low Price': info.get('targetLowPrice'),
#         'Number of Analysts': info.get('numberOfAnalystOpinions'),
#         'Earnings Growth': info.get('earningsGrowth'),
#         'Revenue Growth': info.get('revenueGrowth'),
#         'Gross Margins': info.get('grossMargins'),
#         'EBITDA Margins': info.get('ebitdaMargins'),
#         'Operating Margins': info.get('operatingMargins'),
#         'Financial Currency': info.get('financialCurrency')
#     }
#     return metrics

# @app.route('/')
# def index():
#     """
#     Fetches financial metrics for all user holdings and renders them in an HTML template.
#     """
#     holdings_data = []
#     for ticker in user_holdings:
#         metrics = fetch_financial_metrics(ticker)
#         holdings_data.append(metrics)

#     df = pd.DataFrame(holdings_data)
#     return render_template('index.html', tables=[df.to_html(classes='data', header="true")])

# if __name__ == '__main__':
#     app.run(debug=True)
import pandas as pd
import yfinance as yf
from SmartApi import SmartConnect
import pyotp
from flask import Flask, request, jsonify
#app = Flask(__name__)
# User Credentials
API_KEY = 'jAAvUq0N'
CLIENT_ID = 'D53720220'
PASSWORD = '8853'
TOTP_SECRET = 'JPM46SLIQRRQMUB6CE2NLFD6YQ'

# Initialize SmartConnect
smart_api = SmartConnect(api_key=API_KEY)

# Generate TOTP
totp = pyotp.TOTP(TOTP_SECRET).now()

# Login
login_response = smart_api.generateSession(CLIENT_ID, PASSWORD, totp)
if login_response['status']:
    print("Login Successful")
else:
    print("Login Failed:", login_response['message'])
    exit()

# Fetch Holdings
holdings = smart_api.holding()
holdings_df = pd.DataFrame(holdings['data'])
user_stocks = holdings_df['tradingsymbol'].tolist()
print(user_stocks)

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')

# Sample list of user's stock holdings
user_holdings = ['BPCL.NS', 'MSFT', 'ROUTE.NS']  # Replace with actual holdings

def fetch_financial_metrics(ticker_symbol):
    """
    Fetches financial metrics for a given ticker symbol using yfinance.
    """
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info

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
        'Current Price': info.get('currentPrice'),
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
        'Financial Currency': info.get('financialCurrency')
    }
    return metrics

@app.route('/')
def index():
    """
    Serves the React frontend
    """
    return app.send_static_file('index.html')

@app.route('/api/stocks')
def get_stocks():
    """
    API endpoint that returns stock metrics data as JSON
    """
    holdings_data = []
    try:
        for ticker in user_holdings:
            metrics = fetch_financial_metrics(ticker)
            holdings_data.append(metrics)
        return jsonify(holdings_data)
    except Exception as e:
        # Log the error
        print(f"Error fetching stock data: {str(e)}")
        # Return an empty array, the frontend will use sample data
        return jsonify([])

# Catch-all route to handle React Router paths
@app.route('/<path:path>')
def catch_all(path):
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(debug=True)

# from flask import Flask, jsonify, render_template
# import yfinance as yf
# import pandas as pd
# from SmartApi import SmartConnect
# import pyotp
# import time
# import logging
# import re

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')

# # User Credentials
# API_KEY = 'jAAvUq0N'
# CLIENT_ID = 'D53720220'
# PASSWORD = '8853'
# TOTP_SECRET = 'JPM46SLIQRRQMUB6CE2NLFD6YQ'

# def initialize_angel_api():
#     """Initialize and log in to Angel One SmartAPI"""
#     try:
#         smart_api = SmartConnect(api_key=API_KEY)
#         totp = pyotp.TOTP(TOTP_SECRET).now()
#         login_response = smart_api.generateSession(CLIENT_ID, PASSWORD, totp)
        
#         if login_response['status']:
#             logger.info("Login Successful to Angel One API")
#             return smart_api
#         else:
#             logger.error(f"Login Failed: {login_response['message']}")
#             return None
#     except Exception as e:
#         logger.error(f"Error in Angel One API initialization: {str(e)}")
#         return None

# def map_angel_to_yfinance_symbol(symbol, exchange):
#     """
#     Map Angel One symbol format to YFinance format
#     """
#     # Remove any special characters that might cause issues
#     clean_symbol = re.sub(r'[^A-Za-z0-9]', '', symbol)
    
#     # For NSE symbols, add .NS suffix
#     if exchange == 'NSE':
#         return f"{clean_symbol}.NS"
#     # For BSE symbols, add .BO suffix
#     elif exchange == 'BSE':
#         return f"{clean_symbol}.BO"
#     else:
#         # Try to make an educated guess based on symbol format
#         if '-' in symbol or 'EQ' in symbol:
#             base_symbol = symbol.split('-')[0].replace('EQ', '')
#             return f"{base_symbol}.NS"  # Default to NSE
#         return symbol  # Return as is if we can't determine

# def fetch_financial_metrics(ticker_symbol):
#     """
#     Fetches financial metrics for a given ticker symbol using yfinance.
#     """
#     try:
#         logger.info(f"Fetching data for symbol: {ticker_symbol}")
#         ticker = yf.Ticker(ticker_symbol)
#         info = ticker.info
        
#         # Debug: print available keys in the info dictionary
#         logger.info(f"Available keys for {ticker_symbol}: {list(info.keys())}")
        
#         metrics = {
#             'Ticker': ticker_symbol,
#             'Company Name': info.get('longName', 'N/A'),
#             'Sector': info.get('sector', 'N/A'),
#             'Industry': info.get('industry', 'N/A'),
#             'Market Cap': info.get('marketCap', 'N/A'),
#             'P/E Ratio': info.get('trailingPE', 'N/A'),
#             'P/B Ratio': info.get('priceToBook', 'N/A'),
#             'Dividend Yield': info.get('dividendYield', 'N/A'),
#             'Return on Equity (ROE)': info.get('returnOnEquity', 'N/A'),
#             'Debt to Equity Ratio': info.get('debtToEquity', 'N/A'),
#             'Current Price': info.get('currentPrice', info.get('regularMarketPrice', 'N/A')),
#             '52-Week High': info.get('fiftyTwoWeekHigh', 'N/A'),
#             '52-Week Low': info.get('fiftyTwoWeekLow', 'N/A'),
#             'Beta': info.get('beta', 'N/A'),
#             'EPS (TTM)': info.get('trailingEps', 'N/A'),
#             'Operating Margin': info.get('operatingMargins', 'N/A'),
#             'Profit Margin': info.get('profitMargins', 'N/A'),
#             'Revenue': info.get('totalRevenue', 'N/A'),
#             'Revenue Growth': info.get('revenueGrowth', 'N/A'),
#             'Earnings Growth': info.get('earningsGrowth', 'N/A'),
#             'Analyst Recommendation Mean': info.get('recommendationMean', 'N/A'),
#             'Analyst Recommendation Key': info.get('recommendationKey', 'N/A'),
#             'Target Mean Price': info.get('targetMeanPrice', 'N/A'),
#             'Number of Analysts': info.get('numberOfAnalystOpinions', 'N/A'),
#         }
#         return metrics
#     except Exception as e:
#         logger.error(f"Error fetching data for {ticker_symbol}: {str(e)}")
#         return {
#             'Ticker': ticker_symbol,
#             'Error': str(e),
#             'Company Name': 'Data Unavailable'
#         }

# @app.route('/')
# def index():
#     """
#     Serves the React frontend
#     """
#     return app.send_static_file('index.html')

# @app.route('/api/angelone/holdings', methods=['GET'])
# def get_angelone_holdings():
#     """
#     API endpoint that returns raw Angel One holdings data
#     """
#     try:
#         smart_api = initialize_angel_api()
#         if not smart_api:
#             return jsonify({'error': 'Failed to initialize Angel One API'}), 500
            
#         holdings = smart_api.holding()
#         return jsonify(holdings.get('data', []))
#     except Exception as e:
#         logger.error(f"Error fetching Angel One holdings: {str(e)}")
#         return jsonify({'error': str(e)}), 500

# @app.route('/api/stocks', methods=['GET'])
# def get_stocks():
#     """
#     API endpoint that returns stock metrics data enriched with yfinance data
#     """
#     try:
#         # Initialize Angel One API
#         smart_api = initialize_angel_api()
#         if not smart_api:
#             logger.error("Failed to initialize Angel One API")
#             return jsonify({'error': 'Failed to initialize Angel One API'}), 500
            
#         # Get holdings
#         holdings = smart_api.holding()
#         if not holdings or 'data' not in holdings:
#             logger.warning("No holdings data returned from Angel One API")
#             return jsonify([])
            
#         holdings_df = pd.DataFrame(holdings['data'])
        
#         if holdings_df.empty:
#             logger.warning("Empty holdings dataframe")
#             return jsonify([])
            
#         logger.info(f"Holdings columns: {holdings_df.columns.tolist()}")
#         logger.info(f"First holding: {holdings_df.iloc[0].to_dict() if len(holdings_df) > 0 else 'No holdings'}")
        
#         # Extract trading symbols and exchanges
#         holdings_data = []
        
#         for _, row in holdings_df.iterrows():
#             symbol = row.get('tradingsymbol', '')
#             exchange = row.get('exchange', '')
            
#             # Map to YFinance symbol
#             yf_symbol = map_angel_to_yfinance_symbol(symbol, exchange)
#             logger.info(f"Mapped {symbol} ({exchange}) to YFinance symbol: {yf_symbol}")
            
#             # Fetch financial data
#             metrics = fetch_financial_metrics(yf_symbol)
            
#             # Add holding details from Angel One
#             metrics['Original Symbol'] = symbol
#             metrics['Exchange'] = exchange
#             metrics['Holding Quantity'] = row.get('quantity', 0)
#             metrics['Average Price'] = row.get('averageprice', 0)
#             metrics['Last Traded Price'] = row.get('ltp', 0)
#             metrics['Close Price'] = row.get('close', 0)
#             metrics['PnL'] = row.get('pnl', 0)
            
#             holdings_data.append(metrics)
        
#         # If no data was found, log error and return empty array
#         if not holdings_data:
#             logger.warning("No holdings data was processed")
#             return jsonify([])
        
#         logger.info(f"Returning {len(holdings_data)} holdings")
#         return jsonify(holdings_data)
    
#     except Exception as e:
#         logger.error(f"Error in get_stocks: {str(e)}")
#         return jsonify([])

# # Debug endpoint to test symbol mapping
# @app.route('/api/test_symbols', methods=['GET'])
# def test_symbols():
#     try:
#         # Test a few common Indian stock formats
#         test_cases = [
#             {'symbol': 'RELIANCE-EQ', 'exchange': 'NSE'},
#             {'symbol': 'HDFCBANK', 'exchange': 'NSE'},
#             {'symbol': 'TCS', 'exchange': 'BSE'},
#             {'symbol': 'ITC-EQ', 'exchange': ''},
#         ]
        
#         results = []
#         for case in test_cases:
#             yf_symbol = map_angel_to_yfinance_symbol(case['symbol'], case['exchange'])
#             ticker = yf.Ticker(yf_symbol)
#             info = ticker.info
            
#             results.append({
#                 'original': case['symbol'],
#                 'exchange': case['exchange'],
#                 'yf_symbol': yf_symbol,
#                 'data_found': len(info) > 0,
#                 'company_name': info.get('longName', 'N/A'),
#                 'keys_found': list(info.keys()) if len(info) < 20 else f"{len(info)} keys found"
#             })
            
#         return jsonify(results)
#     except Exception as e:
#         return jsonify({'error': str(e)})

# # Catch-all route to handle React Router paths
# @app.route('/<path:path>')
# def catch_all(path):
#     return app.send_static_file('index.html')

# if __name__ == '__main__':
#     app.run(debug=True)