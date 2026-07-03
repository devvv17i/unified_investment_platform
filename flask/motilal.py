# app.py
from flask import Flask, request, jsonify, send_from_directory
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='client/build', static_url_path='')
CORS(app)  # Enable CORS for all routes

# API routes
@app.route('/api/mf-holdings', methods=['POST'])
def get_mf_holdings():
    try:
        # Get credentials from request body
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Step 1: Authenticate with Motilal Oswal API
        auth_response = requests.post(
            'https://api.motilaloswal.com/auth/token',
            json={
                'client_id': os.environ.get('MOTILAL_CLIENT_ID'),
                'client_secret': os.environ.get('MOTILAL_CLIENT_SECRET'),
                'grant_type': 'password',
                'username': username,
                'password': password
            }
        )
        
        # Check if authentication was successful
        if auth_response.status_code != 200:
            return jsonify({
                'error': 'Authentication failed',
                'details': auth_response.json()
            }), auth_response.status_code
        
        # Extract access token
        access_token = auth_response.json().get('access_token')
        
        # Step 2: Fetch mutual fund holdings using the token
        holdings_response = requests.get(
            'https://api.motilaloswal.com/mf/holdings',
            headers={
                'Authorization': f'Bearer {access_token}'
            }
        )
        
        # Check if holdings request was successful
        if holdings_response.status_code != 200:
            return jsonify({
                'error': 'Failed to fetch holdings',
                'details': holdings_response.json()
            }), holdings_response.status_code
        
        # Return the holdings data
        return jsonify(holdings_response.json())
    
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'API request failed',
            'details': str(e)
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'details': str(e)
        }), 500

# Serve React app for any other routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)