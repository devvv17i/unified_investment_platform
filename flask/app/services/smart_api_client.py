import os
from SmartApi import SmartConnect
import pyotp
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

api_key = os.getenv("API_KEY")
client_id = os.getenv("CLIENT_ID")
password = os.getenv("PASSWORD")
totp_secret = os.getenv("TOTP_SECRET")

smart_api = SmartConnect(api_key=api_key)
totp = pyotp.TOTP(totp_secret).now()
login_response = smart_api.generateSession(client_id, password, totp)



if login_response['status']:
    print("SmartAPI Login Successful")
else:
    print("SmartAPI Login Failed:", login_response['message'])
    exit()
# Fetch Holdings
holdings = smart_api.holding()
holdings_df = pd.DataFrame(holdings['data'])
user_stocks = holdings_df['tradingsymbol'].tolist()
print("Angel Broking symbols:", user_stocks)
