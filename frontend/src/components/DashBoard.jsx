import { useEffect, useState } from "react";
import axios from "axios";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import HoldingsTable from "./components/HoldingsTable.tsx";

import Navbar from "./Navbar.jsx";

const Dashboard = () => {
  const [holdings, setHoldings] = useState({
    angelOne: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const fetchAllHoldings = async () => {
      try {
        const response = await axios.get("/api/angelone/holdings");

        // First check if response exists and has data
        if (!response || !response.data) {
          throw new Error("No data received from API");
        }

        // Then validate the data format
        if (typeof response.data !== "object") {
          throw new Error("Invalid response format from API");
        }

        // Ensure the data is an array, if not, use empty array
        const holdingsData = Array.isArray(response.data) ? response.data : [];

        setHoldings({
          angelOne: holdingsData,
        });
        setIsLoading(false);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("API Error:", err);
        setError(err.message || "Failed to fetch holdings data");
        setHoldings({ angelOne: [] });
        setIsLoading(false);
      }
    };
    fetchAllHoldings();
  }, []);

  const totalValue = calculateTotalValue(holdings);
  const totalHoldings = Object.values(holdings).flat().length;
  const dayChange = 2.5; // Example value, replace with actual calculation

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium">Loading holdings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <span className="text-red-700">Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Stats Bar */}
      <Navbar />
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Portfolio Dashboard
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Portfolio Value</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{totalValue.toLocaleString()}
                </p>
              </div>
              <PieChart className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Day's Change</p>
                <div className="flex items-center gap-2 mt-1">
                  {dayChange >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <p
                    className={`text-2xl font-bold ${dayChange >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {dayChange}%
                  </p>
                </div>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Holdings</p>
                <p className="text-2xl font-bold mt-1">{totalHoldings}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">#</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Market Status</p>
                <p className="text-2xl font-bold mt-1">Open</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Holdings Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              Angel One Holdings
            </h2>
          </div>
          <div className="p-6">
            <HoldingsTable data={holdings.angelOne} />
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateTotalValue = (holdings) => {
  return Object.values(holdings)
    .flat()
    .reduce((acc, holding) => acc + holding.quantity * holding.currentPrice, 0);
};

export default Dashboard;
