import pandas as pd
import yfinance as yf
from SmartApi import SmartConnect
import pyotp
from flask import Flask, request, jsonify
app = Flask(__name__)
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


@app.route('/api/angelone/holdings', methods=['GET'])
def get_angelone_holdings():
    try:
        holdings = smart_api.holding()
        return jsonify(holdings.get('data', []))  # Ensure array format
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# # Define Nifty 50 Tickers
# nifty50_tickers = [
#     'RELIANCE.NS',
    
# ]

# # Function to fetch P/E ratio
# def get_pe_ratio(ticker):
#     stock = yf.Ticker(ticker)
#     pe_ratio = stock.info.get('trailingPE')
#     return pe_ratio

# # Fetch P/E ratios for user's stocks
# user_pe_ratios = {}
# for ticker in user_stocks:
#     pe_ratio = get_pe_ratio(ticker + '.NS')
#     if pe_ratio is not None:
#         user_pe_ratios[ticker] = pe_ratio

# # Fetch P/E ratios for Nifty 50 stocks
# nifty_pe_ratios = {}
# for ticker in nifty50_tickers:
#     pe_ratio = get_pe_ratio(ticker)
#     if pe_ratio is not None:
#         nifty_pe_ratios[ticker] = pe_ratio

# Identify Nifty 50 stocks with lower P/E ratios than user's holdings
# recommendations = []
# for user_ticker, user_pe in user_pe_ratios.items():
#     for nifty_ticker, nifty_pe in nifty_pe_ratios.items():
#         if nifty_pe < user_pe:
#             recommendations.append((user_ticker, nifty_ticker, user_pe, nifty_pe))

# # Sort recommendations by the difference in P/E ratios
# recommendations.sort(key=lambda x: x[2] - x[3])

# # Select top 3 recommendations
# top_recommendations = recommendations[:3]

# Display recommendations
# for user_stock, recommended_stock, user_pe, recommended_pe in top_recommendations:
#     print(f"Consider replacing {user_stock} (P/E: {user_pe}) with {recommended_stock} (P/E: {recommended_pe})")

@app.route('/place_order', methods=['POST'])
def place_order():
    data = request.json
    order_params = {
        'variety': data['variety'],
        'tradingsymbol': data['tradingsymbol'],
        'symboltoken': data['symboltoken'],
        'transactiontype': data['transactiontype'],
        'exchange': data['exchange'],
        'ordertype': data['ordertype'],
        'producttype': data['producttype'],
        'duration': data['duration'],
        'price': data['price'],
        'squareoff': data.get('squareoff', '0'),
        'stoploss': data.get('stoploss', '0'),
        'quantity': data['quantity']
    }
    try:
        order_id = client.placeOrder(order_params)
        return jsonify({'status': 'success', 'order_id': order_id})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# Endpoint to modify an order
@app.route('/modify_order', methods=['POST'])
def modify_order():
    data = request.json
    order_params = {
        'orderid': data['orderid'],
        'variety': data['variety'],
        'tradingsymbol': data['tradingsymbol'],
        'symboltoken': data['symboltoken'],
        'transactiontype': data['transactiontype'],
        'exchange': data['exchange'],
        'ordertype': data['ordertype'],
        'producttype': data['producttype'],
        'duration': data['duration'],
        'price': data['price'],
        'quantity': data['quantity']
    }
    try:
        response = client.modifyOrder(order_params)
        return jsonify({'status': 'success', 'response': response})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# Endpoint to cancel an order
@app.route('/cancel_order', methods=['POST'])
def cancel_order():
    data = request.json
    order_id = data['orderid']
    variety = data['variety']
    try:
        response = client.cancelOrder(order_id, variety)
        return jsonify({'status': 'success', 'response': response})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

#the backend code for them they automatically get displayed in frontend 
    

# Logout
logout_response = smart_api.terminateSession(CLIENT_ID)
print("Logout Response:", logout_response)
if __name__ == '__main__':
    app.run(debug=True)