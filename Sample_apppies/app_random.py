from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import random

app = Flask(__name__)

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

@app.route('/get-time-series', methods=['POST'])
def get_time_series():
    data = request.get_json()
    tickers = data.get('tickers', [])

    result = {ticker: generate_random_time_series() for ticker in tickers}
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
