import yfinance as yf
import pandas as pd

# Define the ticker symbol
ticker_symbol = "AAPL"  # Example: Apple Inc.

# Define the start and end date (format: YYYY-MM-DD)
start_date = "2024-01-01"
end_date = "2024-03-01"

# Fetch historical market data within the date range
ticker = yf.Ticker(ticker_symbol)
hist = ticker.history(start=start_date, end=end_date)

# Save data to CSV
csv_filename = f"{ticker_symbol}_{start_date}_to_{end_date}.csv"
hist.to_csv(csv_filename)

print(f"CSV file saved as: {csv_filename}")
