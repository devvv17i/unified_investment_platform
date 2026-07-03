import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import StockMetricsDashboard from "./components/Metrics";
import Homepage from "./components/Homepage";
import AppDetails from "./components/AppDetails";
import SearchStocks from "./components/SearchStocks";
import ZerodhaPortfolio from "./components/ZerodhaPortfolio";
import StockComparison from "./components/StockComparison";
import StockComparisonChart from "./components/StockComparisonChart";
import AdvancedPaperTradingApp from "./components/PaperTrading";
import Navbar from "./components/Navbar";
import News from "./components/News";
import Upstox_Holdings from "./components/Upstox_Holdings";
import BuySell from "./components/BuySell";
import InvestorBehaviorDashboard from "./components/Behaviour";
import StockAnalysisPage from "./components/StockAnalysis";
import FinanceQuestionPopupWithStyles from "./components/QuestionPopup";
import Chatbot from "./components/Chatbot";
import Recommendations from "./components/Recommendations";
import Motilal from "./components/motilal";
// Sample data for fallback purposes
const sampleStockData = {
  Ticker: "AAPL",
  "Company Name": "Apple Inc.",
  Sector: "Technology",
  Industry: "Consumer Electronics",
  "Market Cap": 2800000000000,
  "P/E Ratio": 28.5,
  "P/B Ratio": 35.2,
  "Dividend Yield": 0.005,
  "Return on Equity (ROE)": 0.145,
  "Debt to Equity Ratio": 1.5,
  "Current Price": 185.92,
  "52-Week High": 199.62,
  "52-Week Low": 143.9,
  Beta: 1.28,
  "EPS (TTM)": 6.14,
  "Operating Margin": 0.301,
  "Profit Margin": 0.255,
  Revenue: 383801000000,
  "Revenue Growth": 0.065,
  "Earnings Growth": 0.075,
  "Analyst Recommendation Mean": 2.1,
  "Analyst Recommendation Key": "buy",
  "Target Mean Price": 210.5,
  "Number of Analysts": 35,
};

// Simple Home component

// Portfolio Summary Component
// Updated PortfolioSummary Component
const PortfolioSummary = ({ stocksData }) => {
  // Calculate portfolio metrics
  const totalCurrentValue = stocksData.reduce((sum, stock) => {
    return sum + (stock["Current Value"] || 0);
  }, 0);

  const totalInvestedValue = stocksData.reduce((sum, stock) => {
    return sum + (stock["Invested Value"] || 0);
  }, 0);

  const totalPnL = stocksData.reduce((sum, stock) => {
    return sum + (stock["PnL"] || 0);
  }, 0);

  // Calculate overall P&L percentage
  const overallPnLPercentage =
    totalInvestedValue > 0 ? (totalPnL / totalInvestedValue) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Portfolio Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm text-gray-500">Total Holdings</p>
          <p className="text-xl font-semibold">{stocksData.length}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm text-gray-500">Invested Value</p>
          <p className="text-xl font-semibold">
            ₹
            {totalInvestedValue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-xl font-semibold">
            ₹
            {totalCurrentValue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div
          className={`p-4 rounded ${totalPnL >= 0 ? "bg-green-50" : "bg-red-50"}`}
        >
          <p className="text-sm text-gray-500">Total P&L</p>
          <div>
            <p
              className={`text-xl font-semibold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalPnL >= 0 ? "+" : ""}₹
              {totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p
              className={`text-sm ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalPnL >= 0 ? "+" : ""}
              {overallPnLPercentage.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard page that fetches data from the backend
const Dashboard = () => {
  const [stocksData, setStocksData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        // Fetch data from the Flask backend
        const response = await fetch("/api/stocks");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setStocksData(data);
          localStorage.setItem("stocksData", JSON.stringify(data));
        } else {
          console.warn("No stock data received, using sample data");
          setStocksData([sampleStockData]);
        }
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError(err.message);
        // Fallback to sample data on error
        setStocksData([sampleStockData]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="p-4">
        <Link
          to="/appdetails"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-2xl font-bold mb-4">
          Portfolio Analysis
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
            <p className="font-medium">Error loading data: {error}</p>
            <p>Displaying sample data instead</p>
          </div>
        ) : (
          <>
            {stocksData.length > 1 && (
              <PortfolioSummary stocksData={stocksData} />
            )}

            {stocksData.map((stockData, index) => (
              <div
                key={stockData.Ticker || index}
                className="mb-6 bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {stockData["Company Name"] || "Unknown Company"}
                    <span className="text-gray-500 ml-2 text-sm">
                      ({stockData.Ticker})
                    </span>
                  </h2>

                  {stockData["Holding Quantity"] && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Holding</p>
                      <p className="font-medium">
                        {stockData["Holding Quantity"]} shares
                      </p>
                    </div>
                  )}
                </div>

                {/* Investment and P&L Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Invested</p>
                    <p className="font-medium">
                      ₹
                      {stockData["Invested Value"]?.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      }) || "0"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: ₹
                      {stockData["Average Price"]?.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      }) || "0"}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Current</p>
                    <p className="font-medium">
                      ₹
                      {stockData["Current Value"]?.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      }) || "0"}
                    </p>
                    <p className="text-xs text-gray-500">
                      LTP: ₹
                      {stockData["Current Price"]?.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      }) || "0"}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-md ${Number(stockData["PnL"]) >= 0 ? "bg-green-50" : "bg-red-50"}`}
                  >
                    <p className="text-sm text-gray-500">Profit/Loss</p>
                    <p
                      className={
                        Number(stockData["PnL"]) >= 0
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {Number(stockData["PnL"]) >= 0 ? "+" : ""}₹
                      {Number(stockData["PnL"]).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p
                      className={
                        Number(stockData["PnL Percentage"]) >= 0
                          ? "text-green-600 text-xs"
                          : "text-red-600 text-xs"
                      }
                    >
                      {Number(stockData["PnL Percentage"]) >= 0 ? "+" : ""}
                      {Number(stockData["PnL Percentage"]).toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Potential Section */}
                {stockData["Potential Upside"] > 0 && (
                  <div className="mb-4 p-3 rounded-md bg-blue-50">
                    <div className="flex justify-between">
                      <span className="text-sm">Potential Upside</span>
                      <span className="text-blue-600 font-medium">
                        +{stockData["Potential Upside"].toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Based on analyst target price: ₹
                      {stockData["Target Mean Price"]?.toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      ) || "N/A"}
                    </div>
                  </div>
                )}

                <StockMetricsDashboard stockData={stockData} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <FinanceQuestionPopupWithStyles />
        <Chatbot />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appdetails" element={<AppDetails />} />
          <Route path="/search" element={<SearchStocks />} />
          <Route path="/zerodha" element={<ZerodhaPortfolio />} />
          <Route path="/compare" element={<StockComparison />} />
          <Route path="/comparisonchart" element={<StockComparisonChart />} />
          <Route path="/papertrading" element={<AdvancedPaperTradingApp />} />
          <Route path="/news" element={<News />} />
          <Route path="/upstox_holdings" element={<Upstox_Holdings />} />
          <Route path="/buysell" element={<BuySell />} />
          <Route path="/motilal" element={<Motilal />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route
            path="/investor_behavior"
            element={<InvestorBehaviorDashboard />}
          />
          <Route path="/stockanalysis" element={<StockAnalysisPage />} />

        </Routes>
      </div>
    </Router>
  );
};

export default App;
