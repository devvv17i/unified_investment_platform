import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,

} from "recharts";
import { motion } from "framer-motion";
import {
  Briefcase,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  BarChart2,
} from "lucide-react";
import Navbar from "./Navbar";
import Rating from "@mui/material/Rating";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A569BD",
  "#5DADE2",
  "#48C9B0",
  "#F4D03F",
  "#EB984E",
  "#EC7063",
];

const InvestorBehaviorDashboard = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userStocks, setUserStocks] = useState([]);

    useEffect(() => {
       const us = localStorage.getItem('stocksData');
       if (us) {
         try {
           const parsedStocks = JSON.parse(us);
           const tickers = parsedStocks.map(stock => stock.Ticker);
           setUserStocks(tickers);
         } catch (error) {
           console.error('Error parsing stocksData from localStorage:', error);
         }
       }
     }, []);
    // Sample performance data for visualization

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/investor-behavior"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch analysis");
        }
        const data = await response.json();
        console.log(data);
        setAnalysis(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);


  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const stockTagColors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-800',
    'bg-cyan-100 text-cyan-800',
  ];



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-lg">Analyzing your investment style...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <AlertCircle className="text-red-500 mr-2" size={24} />
          <h2 className="text-lg font-semibold">Unable to analyze portfolio</h2>
        </div>
        <p>
          We couldn't analyze your investment behavior at this time. Please try
          again later.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  // Prepare data for sector chart
  const sectorData = Object.entries(analysis.sector_allocation || {})
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare data for market cap chart
  const marketCapData = [
    {
      name: "Large Cap 🏢",
      value: analysis.market_cap_distribution?.large_cap || 0,
    },
    {
      name: "Mid Cap 🏠",
      value: analysis.market_cap_distribution?.mid_cap || 0,
    },
    {
      name: "Small Cap 🏡",
      value: analysis.market_cap_distribution?.small_cap || 0,
    },
  ];

  // Prepare metrics data for bar chart
  const metricsData = [
    {
      name: "Growth Stocks 📈",
      value: analysis.metrics?.growth_orientation || 0,
    },
    {
      name: "Value Stocks 💎",
      value: analysis.metrics?.value_orientation || 0,
    },
    { name: "Dividend Focus 💵", value: analysis.metrics?.dividend_focus || 0 },
    {
      name: "High Risk Stocks ⚠️",
      value: analysis.metrics?.high_beta_percentage || 0,
    },
  ];

  const strengths = [];
  if (
    analysis.sector_allocation &&
    Object.keys(analysis.sector_allocation).length > 4
  ) {
    strengths.push(
      <li key="sector-diversification" className="flex items-center">
        <span className="mr-2">✅</span>
        <span>Good sector diversification</span>
      </li>
    );
  }
  if (
    analysis.market_cap_distribution &&
    analysis.market_cap_distribution.large_cap > 20 &&
    analysis.market_cap_distribution.mid_cap > 20 &&
    analysis.market_cap_distribution.small_cap > 20
  ) {
    strengths.push(
      <li key="market-cap-balance" className="flex items-center">
        <span className="mr-2">✅</span>
        <span>Balanced across market caps</span>
      </li>
    );
  }
  if (analysis.metrics && analysis.metrics.dividend_focus > 30) {
    strengths.push(
      <li key="dividend-focus" className="flex items-center">
        <span className="mr-2">✅</span>
        <span>Strong dividend focus</span>
      </li>
    );
  }
  if (analysis.metrics && analysis.metrics.portfolio_beta < 1) {
    strengths.push(
      <li key="low-volatility" className="flex items-center">
        <span className="mr-2">✅</span>
        <span>Lower volatility than the market</span>
      </li>
    );
  }

  const areasToConsider = [];
  if (
    analysis.sector_allocation &&
    Object.keys(analysis.sector_allocation).length < 4
  ) {
    areasToConsider.push(
      <li key="limited-diversification" className="flex items-center">
        <span className="mr-2">⚠️</span>
        <span>Limited sector diversification</span>
      </li>
    );
  }
  if (
    analysis.market_cap_distribution &&
    analysis.market_cap_distribution.small_cap > 50
  ) {
    areasToConsider.push(
      <li key="small-cap-tilt" className="flex items-center">
        <span className="mr-2">⚠️</span>
        <span>Heavy tilt toward small caps</span>
      </li>
    );
  }
  if (analysis.metrics && analysis.metrics.portfolio_beta > 1.3) {
    areasToConsider.push(
      <li key="high-risk-beta" className="flex items-center">
        <span className="mr-2">⚠️</span>
        <span>Higher portfolio risk than market</span>
      </li>
    );
  }
  if (analysis.metrics && analysis.metrics.high_beta_percentage > 40) {
    areasToConsider.push(
      <li key="high-beta-allocation" className="flex items-center">
        <span className="mr-2">⚠️</span>
        <span>Large allocation to high-volatility stocks</span>
      </li>
    );
  }

  return (
     <div>
     <Navbar />
    <div className="bg-white mt-8 rounded-lg shadow p-4 max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <BarChart2 className="text-blue-500 mr-2" size={24} />
        <h2 className="text-3xl mb-2 text-center font-bold">Your Investment Style Analysis</h2>
      </div>

        {/* Investor Style Card */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            {analysis.risk_profile === "Aggressive" && (
              <TrendingUp className="text-red-500 mr-2" size={24} />
            )}
            {analysis.risk_profile === "Moderate" && (
              <BarChart2 className="text-blue-500 mr-2" size={24} />
            )}
            {analysis.risk_profile === "Conservative" && (
              <Shield className="text-green-500 mr-2" size={24} />
            )}
            <h3 className="text-lg font-semibold">
              You're a {analysis.risk_profile} {analysis.investor_style}
              {analysis.investor_style === "Growth Investor" && " 🚀"}
              {analysis.investor_style === "Value Investor" && " 💎"}
              {analysis.investor_style === "Income Investor" && " 💵"}
              {analysis.investor_style === "Balanced Investor" && " ⚖️"}
            </h3>
          </div>
          <div className="mt-2">
            <Rating
              name="risk-rating"
              value={
                analysis.risk_profile === "Conservative"
                  ? 2
                  : analysis.risk_profile === "Moderate"
                    ? 3
                    : analysis.risk_profile === "Aggressive"
                      ? 4
                      : 0
              }
              readOnly
            />
            <span className="ml-2">{analysis.risk_profile} Investor</span>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-6">
          <div className="whitespace-pre-line">{analysis.summary}</div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Sector Allocation */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🏢 Sector Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {sectorData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Cap Distribution */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              📊 Market Cap Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketCapData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  >
                    <Cell fill="#0088FE" />
                    <Cell fill="#00C49F" />
                    <Cell fill="#FFBB28" />
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Investment Style Metrics */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">
            🧠 Your Investment Style Metrics
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  label={{
                    value: "Percentage of Portfolio",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="value" fill="#8884d8">
                  {metricsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Score Meter */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">🌡️ Your Risk Meter</h3>
          <div className="relative h-8 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full overflow-hidden">
            <div
              className="absolute top-0 w-6 h-8 border-4 border-white rounded-full transform -translate-x-1/2"
              style={{
                left: `${Math.min(Math.max((analysis.metrics?.portfolio_beta || 1) * 50, 10), 90)}%`,
                backgroundColor: "rgba(0,0,0,0.7)",
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-sm font-medium">Low Risk</span>
            <span className="text-sm font-medium">Moderate</span>
            <span className="text-sm font-medium">High Risk</span>
          </div>
          <div className="mt-2 text-center">
            <p className="font-medium">
              Your portfolio beta is{" "}
              {(analysis.metrics?.portfolio_beta || 0).toFixed(2)}
              {analysis.metrics?.portfolio_beta > 1
                ? " (higher volatility than market)"
                : " (lower volatility than market)"}
            </p>
          </div>
        </div>

        {/* Strengths and Areas to Consider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <h3 className="text-lg font-semibold">💪 Your Strengths</h3>
            </div>
            <ul className="space-y-2">{strengths}</ul>
            {strengths.length === 0 && (
              <p className="text-gray-600 text-sm">
                No specific strengths identified based on the current criteria.
              </p>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="text-yellow-500 mr-2" size={20} />
              <h3 className="text-lg font-semibold">🚩 Areas to Consider</h3>
            </div>
            <ul className="space-y-2">{areasToConsider}</ul>
            {areasToConsider.length === 0 && (
              <p className="text-gray-600 text-sm">
                No specific areas for consideration identified based on the
                current criteria.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorBehaviorDashboard;
