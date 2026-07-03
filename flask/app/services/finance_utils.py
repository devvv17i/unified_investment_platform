import yfinance as yf

def convert_to_yfinance_symbol(angel_symbol):
    base_symbol = angel_symbol.replace("-EQ", "")
    us_stocks = {"MSFT": "MSFT", "AAPL": "AAPL", "GOOGL": "GOOGL", "AMZN": "AMZN"}
    if base_symbol in us_stocks:
        return us_stocks[base_symbol]
    return f"{base_symbol}.NS"

def fetch_financial_metrics(angel_symbol, holding_data):
    ticker_symbol = convert_to_yfinance_symbol(angel_symbol)
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info

    quantity = int(holding_data.get('quantity', 0))
    avg_price = float(holding_data.get('averageprice', 0))
    current_price = info.get('currentPrice') or float(holding_data.get('ltp', 0))

    invested_value = avg_price * quantity
    current_value = current_price * quantity
    pnl_amount = current_value - invested_value
    pnl_percentage = (pnl_amount / invested_value) * 100 if invested_value > 0 else 0

    metrics = {
        'Ticker': ticker_symbol,
        'Company Name': info.get('longName'),
        'Sector': info.get('sector'),
        'Industry': info.get('industry'),
        'Market Cap': info.get('marketCap'),
        'P/E Ratio': info.get('trailingPE'),
        'Current Price': current_price,
        'Holding Quantity': quantity,
        'Average Price': avg_price,
        'Invested Value': invested_value,
        'Current Value': current_value,
        'PnL': pnl_amount,
        'PnL Percentage': pnl_percentage,
        'Potential Upside': ((info.get('targetMeanPrice', current_price) / current_price) - 1) * 100 if current_price > 0 else 0
    }
    return metrics
