from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/compare-stocks', methods=['POST'])
def compare_stocks():
    try:
        # Get tickers from the request
        data = request.get_json()
        ticker1 = data.get('ticker1', '').upper()
        ticker2 = data.get('ticker2', '').upper()
        
        if not ticker1 or not ticker2:
            return jsonify({"error": "Please provide both ticker symbols"}), 400
        
        # Fetch data from yfinance
        stock1_data = get_stock_data(ticker1)
        stock2_data = get_stock_data(ticker2)
        
        # Compare the stocks
        comparison_result = {
            "ticker1": ticker1,
            "ticker2": ticker2,
            "stock1": stock1_data,
            "stock2": stock2_data,
            "analysis": generate_analysis(ticker1, ticker2, stock1_data, stock2_data)
        }
        
        return jsonify(comparison_result)
    
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def get_stock_data(ticker):
    """
    Fetch comprehensive stock data from yfinance
    """
    try:
        # Create Ticker object
        stock = yf.Ticker(ticker)
        
        # Get basic info
        info = stock.info
        
        # Get historical price data
        hist = stock.history(period="1y")
        
        # Calculate additional metrics
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        previous_close = info.get('previousClose', 0)
        daily_change = ((current_price - previous_close) / previous_close * 100) if previous_close else 0
        
        # Extract key financial ratios
        pe_ratio = info.get('trailingPE', info.get('forwardPE', 0))
        pb_ratio = info.get('priceToBook', 0)
        ps_ratio = info.get('priceToSalesTrailing12Months', 0)
        dividend_yield = info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0
        
        # Get balance sheet data
        try:
            balance_sheet = stock.balance_sheet
            
            # Calculate current ratio if balance sheet data is available
            if not balance_sheet.empty and 'Total Current Assets' in balance_sheet.index and 'Total Current Liabilities' in balance_sheet.index:
                current_assets = balance_sheet.loc['Total Current Assets'].iloc[0]
                current_liabilities = balance_sheet.loc['Total Current Liabilities'].iloc[0]
                current_ratio = float(current_assets / current_liabilities) if current_liabilities else 0
            else:
                current_ratio = 0
                
            # Calculate debt-to-equity ratio
            if not balance_sheet.empty and 'Total Debt' in balance_sheet.index and 'Total Stockholder Equity' in balance_sheet.index:
                total_debt = balance_sheet.loc['Total Debt'].iloc[0] if 'Total Debt' in balance_sheet.index else 0
                total_equity = balance_sheet.loc['Total Stockholder Equity'].iloc[0]
                debt_to_equity = float(total_debt / total_equity) if total_equity else 0
            else:
                debt_to_equity = 0
        except:
            current_ratio = 0
            debt_to_equity = 0
        
        # Get income statement data
        try:
            income_stmt = stock.income_stmt
            
            # Calculate profit margin
            if not income_stmt.empty and 'Net Income' in income_stmt.index and 'Total Revenue' in income_stmt.index:
                net_income = income_stmt.loc['Net Income'].iloc[0]
                revenue = income_stmt.loc['Total Revenue'].iloc[0]
                profit_margin = float(net_income / revenue * 100) if revenue else 0
            else:
                profit_margin = info.get('profitMargins', 0) * 100 if info.get('profitMargins') else 0
                
            # Calculate ROE
            if not income_stmt.empty and not balance_sheet.empty and 'Net Income' in income_stmt.index and 'Total Stockholder Equity' in balance_sheet.index:
                net_income = income_stmt.loc['Net Income'].iloc[0]
                equity = balance_sheet.loc['Total Stockholder Equity'].iloc[0]
                roe = float(net_income / equity * 100) if equity else 0
            else:
                roe = info.get('returnOnEquity', 0) * 100 if info.get('returnOnEquity') else 0
        except:
            profit_margin = info.get('profitMargins', 0) * 100 if info.get('profitMargins') else 0
            roe = info.get('returnOnEquity', 0) * 100 if info.get('returnOnEquity') else 0
        
        # Create result dictionary
        result = {
            "ticker": ticker,
            "company_name": info.get('shortName', ticker),
            "sector": info.get('sector', 'N/A'),
            "industry": info.get('industry', 'N/A'),
            "market_cap": info.get('marketCap', 0),
            "market_cap_fmt": format_market_cap(info.get('marketCap', 0)),
            "current_price": current_price,
            "daily_change": daily_change,
            "fifty_two_week_high": info.get('fiftyTwoWeekHigh', 0),
            "fifty_two_week_low": info.get('fiftyTwoWeekLow', 0),
            
            # Financial ratios
            "pe_ratio": pe_ratio,
            "pb_ratio": pb_ratio,
            "ps_ratio": ps_ratio,
            "dividend_yield": dividend_yield,
            "peg_ratio": info.get('pegRatio', 0),
            "current_ratio": current_ratio,
            "debt_to_equity": debt_to_equity,
            "profit_margin": profit_margin,
            "return_on_equity": roe,
            
            # Growth metrics
            "revenue_growth": info.get('revenueGrowth', 0) * 100 if info.get('revenueGrowth') else 0,
            "earnings_growth": info.get('earningsGrowth', 0) * 100 if info.get('earningsGrowth') else 0,
            "earnings_quarterly_growth": info.get('earningsQuarterlyGrowth', 0) * 100 if info.get('earningsQuarterlyGrowth') else 0,
            
            # Analyst opinions
            "analyst_rating": info.get('recommendationKey', 'N/A'),
            "target_price": info.get('targetMeanPrice', 0),
            "target_upside": ((info.get('targetMeanPrice', 0) / current_price) - 1) * 100 if current_price else 0,
            "analyst_count": info.get('numberOfAnalystOpinions', 0),
            
            # Additional data
            "beta": info.get('beta', 0),
            "trailing_eps": info.get('trailingEps', 0),
            "forward_eps": info.get('forwardEps', 0),
            "shares_outstanding": info.get('sharesOutstanding', 0),
            "short_ratio": info.get('shortRatio', 0)
        }
        
        return result
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        print(traceback.format_exc())
        return {
            "ticker": ticker,
            "error": str(e),
            "company_name": ticker,
            "sector": "N/A",
            "industry": "N/A"
        }

def generate_analysis(ticker1, ticker2, stock1_data, stock2_data):
    """
    Generate a detailed comparison analysis between two stocks
    """
    analysis = {}
    
    # Value comparison
    analysis["value_comparison"] = {
        "pe_winner": ticker1 if stock1_data.get("pe_ratio", 0) < stock2_data.get("pe_ratio", 0) and stock1_data.get("pe_ratio", 0) > 0 else ticker2,
        "pb_winner": ticker1 if stock1_data.get("pb_ratio", 0) < stock2_data.get("pb_ratio", 0) and stock1_data.get("pb_ratio", 0) > 0 else ticker2,
        "ps_winner": ticker1 if stock1_data.get("ps_ratio", 0) < stock2_data.get("ps_ratio", 0) and stock1_data.get("ps_ratio", 0) > 0 else ticker2,
        "peg_winner": ticker1 if stock1_data.get("peg_ratio", 0) < stock2_data.get("peg_ratio", 0) and stock1_data.get("peg_ratio", 0) > 0 else ticker2,
    }
    
    # Growth comparison
    analysis["growth_comparison"] = {
        "revenue_growth_winner": ticker1 if stock1_data.get("revenue_growth", 0) > stock2_data.get("revenue_growth", 0) else ticker2,
        "earnings_growth_winner": ticker1 if stock1_data.get("earnings_growth", 0) > stock2_data.get("earnings_growth", 0) else ticker2,
        "roe_winner": ticker1 if stock1_data.get("return_on_equity", 0) > stock2_data.get("return_on_equity", 0) else ticker2,
    }
    
    # Financial health comparison
    analysis["financial_health_comparison"] = {
        "current_ratio_winner": ticker1 if stock1_data.get("current_ratio", 0) > stock2_data.get("current_ratio", 0) else ticker2,
        "debt_to_equity_winner": ticker1 if stock1_data.get("debt_to_equity", 0) < stock2_data.get("debt_to_equity", 0) and stock1_data.get("debt_to_equity", 0) > 0 else ticker2,
        "profit_margin_winner": ticker1 if stock1_data.get("profit_margin", 0) > stock2_data.get("profit_margin", 0) else ticker2,
    }
    
    # Dividend comparison
    analysis["dividend_comparison"] = {
        "dividend_winner": ticker1 if stock1_data.get("dividend_yield", 0) > stock2_data.get("dividend_yield", 0) else ticker2,
    }
    
    # Market sentiment comparison
    analysis["market_sentiment"] = {
        "analyst_rating_winner": determine_better_rating(stock1_data.get("analyst_rating", "N/A"), stock2_data.get("analyst_rating", "N/A"), ticker1, ticker2),
        "target_upside_winner": ticker1 if stock1_data.get("target_upside", 0) > stock2_data.get("target_upside", 0) else ticker2,
    }
    
    # Overall score
    stock1_score = 0
    stock2_score = 0
    
    # Count wins in each category
    for category in analysis.values():
        for winner in category.values():
            if winner == ticker1:
                stock1_score += 1
            elif winner == ticker2:
                stock2_score += 1
    
    analysis["overall_winner"] = ticker1 if stock1_score > stock2_score else ticker2
    analysis["score"] = {
        ticker1: stock1_score,
        ticker2: stock2_score
    }

    return analysis

def determine_better_rating(rating1, rating2, ticker1, ticker2):
    """
    Determine which stock has a better analyst rating
    """
    rating_rank = {
        "strongBuy": 5,
        "buy": 4,
        "hold": 3,
        "underperform": 2,
        "sell": 1,
        "N/A": 0
    }
    
    rank1 = rating_rank.get(rating1, 0)
    rank2 = rating_rank.get(rating2, 0)
    
    return ticker1 if rank1 > rank2 else ticker2

def format_market_cap(market_cap):
    """
    Format market cap in billions or millions
    """
    if market_cap >= 1e12:
        return f"${market_cap / 1e12:.2f}T"
    elif market_cap >= 1e9:
        return f"${market_cap / 1e9:.2f}B"
    elif market_cap >= 1e6:
        return f"${market_cap / 1e6:.2f}M"
    else:
        return f"${market_cap:,.0f}"

if __name__ == '__main__':
    app.run(debug=True, port=5000)