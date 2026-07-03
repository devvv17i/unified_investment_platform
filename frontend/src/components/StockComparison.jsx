import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Navbar from "./Navbar";

const StockComparison = () => {
  const [ticker1, setTicker1] = useState("AAPL");
  const [ticker2, setTicker2] = useState("MSFT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchComparisonData = async () => {
    if (!ticker1 || !ticker2) {
      setError("Please enter both ticker symbols");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/compare-stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker1, ticker2 }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching comparison data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format numbers for better display
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return "N/A";
    return Number(num).toFixed(decimals);
  };

  // Get color for winner highlighting
  const getWinnerColor = (item, ticker) => {
    if (!comparisonData?.analysis) return "";

    const category = Object.keys(comparisonData.analysis).find(
      (cat) =>
        comparisonData.analysis[cat] &&
        Object.keys(comparisonData.analysis[cat]).includes(item)
    );

    if (!category) return "";

    return comparisonData.analysis[category][item] === ticker
      ? "text-green-600 font-bold"
      : "";
  };

  // Format percentage values
  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Determine color for a percentage value
  const getPercentColor = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "";
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  // Generate bar chart data for financial ratios
  const getFinancialRatiosChartData = () => {
    if (!comparisonData) return [];

    const { stock1, stock2 } = comparisonData;
    const ratios = [
      {
        name: "P/E Ratio",
        stock1: stock1.pe_ratio,
        stock2: stock2.pe_ratio,
        higher_is_better: false,
      },
      {
        name: "P/B Ratio",
        stock1: stock1.pb_ratio,
        stock2: stock2.pb_ratio,
        higher_is_better: false,
      },
      {
        name: "P/S Ratio",
        stock1: stock1.ps_ratio,
        stock2: stock2.ps_ratio,
        higher_is_better: false,
      },
      {
        name: "PEG Ratio",
        stock1: stock1.peg_ratio,
        stock2: stock2.peg_ratio,
        higher_is_better: false,
      },
      {
        name: "Current Ratio",
        stock1: stock1.current_ratio,
        stock2: stock2.current_ratio,
        higher_is_better: true,
      },
      {
        name: "Debt/Equity",
        stock1: stock1.debt_to_equity,
        stock2: stock2.debt_to_equity,
        higher_is_better: false,
      },
    ];

    return ratios;
  };

  // Generate bar chart data for growth metrics
  const getGrowthMetricsChartData = () => {
    if (!comparisonData) return [];

    const { stock1, stock2 } = comparisonData;
    const metrics = [
      {
        name: "Revenue Growth",
        stock1: stock1.revenue_growth,
        stock2: stock2.revenue_growth,
      },
      {
        name: "Earnings Growth",
        stock1: stock1.earnings_growth,
        stock2: stock2.earnings_growth,
      },
      {
        name: "Profit Margin",
        stock1: stock1.profit_margin,
        stock2: stock2.profit_margin,
      },
      {
        name: "ROE",
        stock1: stock1.return_on_equity,
        stock2: stock2.return_on_equity,
      },
      {
        name: "Dividend Yield",
        stock1: stock1.dividend_yield,
        stock2: stock2.dividend_yield,
      },
    ];

    return metrics;
  };

  // Generate rating score chart data
  const getRatingScoreData = () => {
    if (!comparisonData || !comparisonData.analysis) return [];

    const { analysis } = comparisonData;
    const { score } = analysis;

    return [
      { name: comparisonData.ticker1, value: score[comparisonData.ticker1] },
      { name: comparisonData.ticker2, value: score[comparisonData.ticker2] },
    ];
  };

  const COLORS = ["#0088FE", "#FF8042"];

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading stock comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Stock Fundamental Comparison
      </h1>

      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="ticker1" className="block mb-1 font-medium">
              First Stock:
            </label>
            <input
              id="ticker1"
              type="text"
              value={ticker1}
              onChange={(e) => setTicker1(e.target.value.toUpperCase())}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. AAPL"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="ticker2" className="block mb-1 font-medium">
              Second Stock:
            </label>
            <input
              id="ticker2"
              type="text"
              onChange={(e) => setTicker2(e.target.value.toUpperCase())}
              value={ticker2}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. MSFT"
            />
          </div>

          <button
            onClick={fetchComparisonData}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={isLoading}
          >
            Compare Stocks
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            <p>{error}</p>
          </div>
        )}
      </div>

      {comparisonData && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 p-4 border-b">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold text-blue-600">
                  {comparisonData.stock1.company_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {comparisonData.stock1.sector} |{" "}
                  {comparisonData.stock1.industry}
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">vs</h3>
              </div>
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold text-orange-600">
                  {comparisonData.stock2.company_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {comparisonData.stock2.sector} |{" "}
                  {comparisonData.stock2.industry}
                </p>
              </div>
            </div>
          </div>

          {/* Winner Banner */}
          {comparisonData.analysis && (
            <div
              className={`p-3 text-center text-white font-bold ${
                comparisonData.analysis.overall_winner ===
                comparisonData.ticker1
                  ? "bg-blue-600"
                  : "bg-orange-600"
              }`}
            >
              <span>
                Overall Winner:{" "}
                {comparisonData.analysis.overall_winner ===
                comparisonData.ticker1
                  ? comparisonData.stock1.company_name
                  : comparisonData.stock2.company_name}{" "}
                (
                {
                  comparisonData.analysis.score[
                    comparisonData.analysis.overall_winner
                  ]
                }{" "}
                points)
              </span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="border-b">
            <nav className="flex">
              <button
                className={`px-4 py-3 font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`px-4 py-3 font-medium ${
                  activeTab === "financial"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("financial")}
              >
                Financial Ratios
              </button>
              <button
                className={`px-4 py-3 font-medium ${
                  activeTab === "growth"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("growth")}
              >
                Growth & Performance
              </button>
              <button
                className={`px-4 py-3 font-medium ${
                  activeTab === "analysis"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("analysis")}
              >
                Analysis
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Key Metrics */}
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Key Metrics Comparison
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="font-medium">Metric</div>
                      <div className="text-center font-medium text-blue-600">
                        {comparisonData.ticker1}
                      </div>
                      <div className="text-center font-medium text-orange-600">
                        {comparisonData.ticker2}
                      </div>

                      <div>Current Price</div>
                      <div className="text-center">
                        ${formatNumber(comparisonData.stock1.current_price)}
                      </div>
                      <div className="text-center">
                        ${formatNumber(comparisonData.stock2.current_price)}
                      </div>

                      <div>Market Cap</div>
                      <div className="text-center">
                        {comparisonData.stock1.market_cap_fmt}
                      </div>
                      <div className="text-center">
                        {comparisonData.stock2.market_cap_fmt}
                      </div>

                      <div>Daily Change</div>
                      <div
                        className={`text-center ${getPercentColor(comparisonData.stock1.daily_change)}`}
                      >
                        {formatPercent(comparisonData.stock1.daily_change)}
                      </div>
                      <div
                        className={`text-center ${getPercentColor(comparisonData.stock2.daily_change)}`}
                      >
                        {formatPercent(comparisonData.stock2.daily_change)}
                      </div>

                      <div>P/E Ratio</div>
                      <div
                        className={`text-center ${getWinnerColor("pe_winner", comparisonData.ticker1)}`}
                      >
                        {formatNumber(comparisonData.stock1.pe_ratio)}
                      </div>
                      <div
                        className={`text-center ${getWinnerColor("pe_winner", comparisonData.ticker2)}`}
                      >
                        {formatNumber(comparisonData.stock2.pe_ratio)}
                      </div>

                      <div>Dividend Yield</div>
                      <div
                        className={`text-center ${getWinnerColor("dividend_winner", comparisonData.ticker1)}`}
                      >
                        {formatPercent(comparisonData.stock1.dividend_yield)}
                      </div>
                      <div
                        className={`text-center ${getWinnerColor("dividend_winner", comparisonData.ticker2)}`}
                      >
                        {formatPercent(comparisonData.stock2.dividend_yield)}
                      </div>

                      <div>Profit Margin</div>
                      <div
                        className={`text-center ${getWinnerColor("profit_margin_winner", comparisonData.ticker1)}`}
                      >
                        {formatPercent(comparisonData.stock1.profit_margin)}
                      </div>
                      <div
                        className={`text-center ${getWinnerColor("profit_margin_winner", comparisonData.ticker2)}`}
                      >
                        {formatPercent(comparisonData.stock2.profit_margin)}
                      </div>

                      <div>Return on Equity</div>
                      <div
                        className={`text-center ${getWinnerColor("roe_winner", comparisonData.ticker1)}`}
                      >
                        {formatPercent(comparisonData.stock1.return_on_equity)}
                      </div>
                      <div
                        className={`text-center ${getWinnerColor("roe_winner", comparisonData.ticker2)}`}
                      >
                        {formatPercent(comparisonData.stock2.return_on_equity)}
                      </div>
                    </div>
                  </div>

                  {/* Analysis Summary */}
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Category Winners
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="font-medium">Valuation</div>
                      <div
                        className={`font-medium ${
                          comparisonData.analysis.value_comparison.pe_winner ===
                          comparisonData.ticker1
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      >
                        {comparisonData.analysis.value_comparison.pe_winner ===
                        comparisonData.ticker1
                          ? comparisonData.stock1.company_name
                          : comparisonData.stock2.company_name}
                      </div>

                      <div className="font-medium">Growth</div>
                      <div
                        className={`font-medium ${
                          comparisonData.analysis.growth_comparison
                            .revenue_growth_winner === comparisonData.ticker1
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      >
                        {comparisonData.analysis.growth_comparison
                          .revenue_growth_winner === comparisonData.ticker1
                          ? comparisonData.stock1.company_name
                          : comparisonData.stock2.company_name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Ratios Tab */}
            {activeTab === "financial" && (
              <div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getFinancialRatiosChartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        formatNumber(value),
                        name === "stock1"
                          ? comparisonData.ticker1
                          : comparisonData.ticker2,
                      ]}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "stock1"
                          ? comparisonData.ticker1
                          : comparisonData.ticker2
                      }
                    />
                    <Bar dataKey="stock1" fill="#0088FE" />
                    <Bar dataKey="stock2" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-sm text-gray-600 mt-2">
                  Note: Lower values are generally better for most ratios except
                  Current Ratio
                </div>
              </div>
            )}

            {/* Growth & Performance Tab */}
            {activeTab === "growth" && (
              <div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getGrowthMetricsChartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        formatPercent(value),
                        name === "stock1"
                          ? comparisonData.ticker1
                          : comparisonData.ticker2,
                      ]}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "stock1"
                          ? comparisonData.ticker1
                          : comparisonData.ticker2
                      }
                    />
                    <Bar dataKey="stock1" fill="#0088FE" />
                    <Bar dataKey="stock2" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-sm text-gray-600 mt-2">
                  Performance and growth metrics comparison
                </div>
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === "analysis" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Overall Score */}
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Overall Score Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getRatingScoreData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {getRatingScoreData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Detailed Analysis Insights
                    </h3>
                    {comparisonData.analysis && (
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Valuation Winner:</span>{" "}
                          <span
                            className={`font-bold ${
                              comparisonData.analysis.value_comparison
                                .pe_winner === comparisonData.ticker1
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            {comparisonData.analysis.value_comparison
                              .pe_winner === comparisonData.ticker1
                              ? comparisonData.stock1.company_name
                              : comparisonData.stock2.company_name}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Growth Winner:</span>{" "}
                          <span
                            className={`font-bold ${
                              comparisonData.analysis.growth_comparison
                                .revenue_growth_winner ===
                              comparisonData.ticker1
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            {comparisonData.analysis.growth_comparison
                              .revenue_growth_winner === comparisonData.ticker1
                              ? comparisonData.stock1.company_name
                              : comparisonData.stock2.company_name}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">
                            Profitability Winner:
                          </span>{" "}
                          <span
                            className={`font-bold ${
                              comparisonData.analysis.financial_health_comparison
                                .profit_margin_winner === comparisonData.ticker1
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            {comparisonData.analysis.financial_health_comparison
                              .profit_margin_winner === comparisonData.ticker1
                              ? comparisonData.stock1.company_name
                              : comparisonData.stock2.company_name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default StockComparison;