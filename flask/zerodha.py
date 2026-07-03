from flask import Flask, redirect, request, jsonify
from kiteconnect import KiteConnect
from flask_cors import CORS
import os
from datetime import datetime, timedelta

# A simple storage solution (for production, use a proper database)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

TOKEN_STORAGE = {
    "access_token": None,
    "expiry": None
}
# Replace these with your actual API key and API secret from Zerodha
API_KEY = "j43d9xjrzdhhy1eu"
API_SECRET = "rovatoaws1vsyr59s08gad47zhlpy3iv"

# Initialize KiteConnect instance
kite = KiteConnect(api_key=API_KEY)

@app.route('/login')
def login():
    """
    Redirects the user to the Zerodha login page.
    """
    # Generate login URL and redirect user to Zerodha login page
    login_url = kite.login_url()
    return redirect(login_url)

@app.route('/callback')
def callback():
    """
    Callback endpoint for Kite Connect.
    """
    request_token = request.args.get("request_token")
    if not request_token:
        return jsonify({"error": "Missing request token"}), 400

    try:
        # Generate session using the request token and your API secret
        session_data = kite.generate_session(request_token, api_secret=API_SECRET)
        
        # Store the access token
        TOKEN_STORAGE["access_token"] = session_data["access_token"]
        TOKEN_STORAGE["expiry"] = datetime.now() + timedelta(days=1)  # Tokens are generally valid for a day
        
        # Set the access token for the current session
        kite.set_access_token(session_data["access_token"])
        
        # Redirect to your frontend application
        return redirect("http://localhost:5173")  # Adjust this URL to your frontend
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/holdings')
def holdings():
    """
    Returns the user's real holdings data.
    """
    try:
        # Check if we have a valid access token
        if not TOKEN_STORAGE["access_token"] or (TOKEN_STORAGE["expiry"] and datetime.now() > TOKEN_STORAGE["expiry"]):
            return jsonify({"error": "Not authenticated. Please login first."}), 401
        
        # Set the access token for this request
        kite.set_access_token(TOKEN_STORAGE["access_token"])
        
        # Get actual holdings data
        holdings_data = kite.holdings()
        return jsonify(holdings_data)
    except Exception as e:
        error_msg = str(e)
        if "token" in error_msg.lower() or "authoriz" in error_msg.lower() or "authent" in error_msg.lower():
            # Token expired or invalid
            TOKEN_STORAGE["access_token"] = None
            return jsonify({"error": "Session expired. Please login again."}), 401
        return jsonify({"error": error_msg}), 500
if __name__ == '__main__':
    # Run the Flask app. In production, consider using a production server.
    app.run(debug=True)