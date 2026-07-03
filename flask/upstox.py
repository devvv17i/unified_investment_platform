from flask import Flask, redirect, request, session, url_for, jsonify
import requests
import os
import urllib.parse
from dotenv import load_dotenv
from flask_cors import CORS
from flask import Flask, request, jsonify

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
app.secret_key = os.getenv("FLASK_SECRET_KEY")


# Upstox API credentials
# CLIENT_ID = os.getenv("UPSTOX_API_KEY")
# CLIENT_SECRET = os.getenv("UPSTOX_API_SECRET")
REDIRECT_URI = "https://foil-battle-pony.glitch.me/auth/callback"

# Upstox endpoints
AUTH_BASE_URL = "https://api.upstox.com/v2/login/authorization/dialog"
TOKEN_URL = "https://api.upstox.com/v2/login/authorization/token"
HOLDINGS_URL = "https://api.upstox.com/v2/portfolio/long-term-holdings"

@app.route('/')
def index():
    return 'Welcome to the Upstox OAuth Demo. <a href="/login">Login with Upstox</a>'

@app.route('/login', methods=['POST'])
def login():
     request_data = request.get_json()

     CLIENT_ID = request_data.get("client_id")
     REDIRECT_URI="https://foil-battle-pony.glitch.me/auth/callback"

     params = {
          "client_id": CLIENT_ID,
          "redirect_uri": REDIRECT_URI,
          "response_type": "code",
          "state": "random_state_123"  # Optional: for CSRF protection
     }
     auth_url = f"{AUTH_BASE_URL}?{urllib.parse.urlencode(params)}"
     return jsonify({"auth_url": auth_url})

@app.route('/callback', methods=['POST'])
def callback():
#     error = request.args.get('error')
#     if error:
#         return f"Error: {error}"


     request_data = request.get_json()
     CLIENT_ID = request_data.get("client_id")
     CLIENT_SECRET = request_data.get("client_secret")
     authorization_code = request_data.get("code")
     REDIRECT_URI="https://foil-battle-pony.glitch.me/auth/callback"
     print("HELLO")

    # Exchange authorization code for access token
     payload = {
          "code": authorization_code,
          "client_id": CLIENT_ID,
          "client_secret": CLIENT_SECRET,
          "redirect_uri": REDIRECT_URI,
          "grant_type": "authorization_code"
     }
     session['auth_code'] = authorization_code
     headers = {"Content-Type": "application/x-www-form-urlencoded"}
     response = requests.post(TOKEN_URL, data=payload, headers=headers)

     if response.status_code == 200:
          token_data = response.json()
          session['access_token'] = token_data.get('access_token')
          
          print("Access Token:", session['access_token'])
          return jsonify({"message": "Login successful", "access_token": session['access_token']})
     else:
          return f"Failed to obtain access token: {response.text}"

@app.route('/holdings')
def holdings():
    access_token = session.get('access_token')
    if not access_token:
        return redirect(url_for('login'))

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    response = requests.get(HOLDINGS_URL, headers=headers)

    if response.status_code == 200:
        holdings_data = response.json().get('data', [])
        return jsonify(holdings_data)
    else:
        return f"Failed to fetch holdings: {response.text}"

if __name__ == '__main__':
    app.run(debug=True)
