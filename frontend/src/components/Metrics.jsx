import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

const StockMetricsDashboard = ({ stockData }) => {
  // Default data in case no props are passed
  const defaultData = {
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

  const data = stockData || defaultData;

  // Color schemes
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // State for active tab
  const [activeTab, setActiveTab] = useState("overview");

  // Format large numbers
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A";

    if (num >= 1000000000000) {
      return `$${(num / 1000000000000).toFixed(2)}T`;
    }
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (typeof num === "number") {
      return num.toLocaleString();
    }

    return num;
  };

  // Format percentage values
  const formatPercent = (num) => {
    if (num === undefined || num === null) return "N/A";
    return `${(num * 100).toFixed(2)}%`;
  };

  // Determine if a metric is good, bad, or neutral
  const getMetricStatus = (metric, value) => {
    if (value === undefined || value === null) return "neutral";

    switch (metric) {
      case "P/E Ratio":
        return value < 15 ? "good" : value > 30 ? "bad" : "neutral";
      case "P/B Ratio":
        return value < 3 ? "good" : value > 7 ? "bad" : "neutral";
      case "Dividend Yield":
        return value > 0.02 ? "good" : value === 0 ? "bad" : "neutral";
      case "Return on Equity (ROE)":
        return value > 0.15 ? "good" : value < 0.1 ? "bad" : "neutral";
      case "Debt to Equity Ratio":
        return value < 1 ? "good" : value > 2 ? "bad" : "neutral";
      case "Operating Margin":
        return value > 0.15 ? "good" : value < 0.05 ? "bad" : "neutral";
      case "Profit Margin":
        return value > 0.1 ? "good" : value < 0.05 ? "bad" : "neutral";
      case "Revenue Growth":
        return value > 0.1 ? "good" : value < 0.05 ? "bad" : "neutral";
      case "Earnings Growth":
        return value > 0.15 ? "good" : value < 0.05 ? "bad" : "neutral";
      case "Analyst Recommendation Mean":
        return value < 2.2 ? "good" : value > 3 ? "bad" : "neutral";
      default:
        return "neutral";
    }
  };

  // Get explanation for a metric (jargon-free)
  const getMetricExplanation = (metric) => {
    switch (metric) {
      case "P/E Ratio":
        return "This shows how much investors are willing to pay for each dollar the company earns. A lower number might mean the stock is a better deal 💰, while a very high number could suggest it's expensive 💸.";
      case "P/B Ratio":
        return "This compares the company's stock price to the value of its assets if it sold everything. A low number might mean you're getting a good value for what the company owns 🏢, but a high number could mean you're paying a lot for those assets 🏦.";
      case "Dividend Yield":
        return "This is the percentage of the stock price that the company pays out in dividends each year. A higher percentage means you get more income from holding the stock 🤑, but a zero means they don't pay dividends 🚫.";
      case "Return on Equity (ROE)":
        return "This measures how well the company is using the money invested by its shareholders to generate profit. A higher percentage (above 15%) usually means the company is good at making money from your investment 👍.";
      case "Debt to Equity Ratio":
        return "This shows how much the company owes compared to how much it owns (its equity). A lower number is generally better as it means the company has less debt and might be less risky 🤔. A high number could indicate they have a lot of debt 😬.";
      case "Operating Margin":
        return "This is the percentage of revenue left after covering the basic costs of running the business (like salaries and rent). A higher margin shows the company is efficient at its core operations 💪.";
      case "Profit Margin":
        return "This is the percentage of revenue that turns into actual profit after all expenses are paid. A higher margin means the company keeps more money from each sale 🎉.";
      case "Revenue Growth":
        return "This shows how much the company's sales have increased over the past year. Higher growth usually means the company is doing well and attracting more customers 🌱.";
      case "Earnings Growth":
        return "This shows how much the company's profits have increased over the past year. Growing profits can be a sign of a healthy and expanding business 📈.";
      case "Market Cap":
        return "This is the total value of all the company's outstanding shares of stock. It's like the price tag for the entire company. Big companies tend to be more stable but might grow slower 🐢, while smaller ones can grow faster but might be riskier 🚀.";
      case "Beta":
        return "This measures how much a stock's price tends to move compared to the overall stock market. A beta greater than 1 means the stock is more volatile than the market 🎢, and a beta less than 1 means it's less volatile 安定.";
      case "Current Price":
        return "This is the latest price at which the stock was traded 💲.";
      case "52-Week High/Low":
        return "These are the highest and lowest prices the stock has traded at over the past 52 weeks. It gives you an idea of the stock's recent price range 📊.";
      case "Analyst Recommendations":
        return "This is the average rating given by financial experts who analyze the stock. Lower numbers (closer to 1) usually mean they think it's a good time to buy 👍, while higher numbers suggest caution or selling 👎.";
      default:
        return "This is a financial number used to understand how a company is doing.";
    }
  };
  // Price position relative to 52-week range
  const pricePosition =
    ((data["Current Price"] - data["52-Week Low"]) /
      (data["52-Week High"] - data["52-Week Low"])) *
    100;

  // Stock performance potential based on analyst targets
  const upside =
    ((data["Target Mean Price"] - data["Current Price"]) /
      data["Current Price"]) *
    100;

  // Prepare data for charts
  const valuationChartData = [
    { name: "P/E Ratio", value: data["P/E Ratio"] || 0 },
    { name: "P/B Ratio", value: data["P/B Ratio"] || 0 },
    {
      name: "ROE",
      value: data["Return on Equity (ROE)"]
        ? data["Return on Equity (ROE)"] * 100
        : 0,
    },
    {
      name: "Dividend Yield",
      value: data["Dividend Yield"] ? data["Dividend Yield"] * 100 : 0,
    },
  ];

  const profitabilityChartData = [
    {
      name: "Operating Margin",
      value: data["Operating Margin"] ? data["Operating Margin"] * 100 : 0,
    },
    {
      name: "Profit Margin",
      value: data["Profit Margin"] ? data["Profit Margin"] * 100 : 0,
    },
  ];

  const growthChartData = [
    {
      name: "Revenue Growth",
      value: data["Revenue Growth"] ? data["Revenue Growth"] * 100 : 0,
    },
    {
      name: "Earnings Growth",
      value: data["Earnings Growth"] ? data["Earnings Growth"] * 100 : 0,
    },
  ];

  // Render metric card with status and tooltip
  const MetricCard = ({
    title,
    value,
    format = "number",
    showStatus = true,
  }) => {
    const formattedValue =
      format === "percent" ? formatPercent(value) : formatNumber(value);
    const status = showStatus ? getMetricStatus(title, value) : "neutral";
    const explanation = getMetricExplanation(title);

    return (
      <div className="bg-white p-4 rounded-lg shadow-md relative">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold">{formattedValue}</p>
          </div>
          <div className="flex items-center">
            {status === "good" && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {status === "bad" && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div className="relative ml-1 group">
              <Info className="h-4 w-4 text-blue-500 cursor-help" />
              <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded w-64 right-0 top-full mt-1 text-xs">
                {explanation}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto bg-gray-50 p-6 rounded-xl shadow-lg">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {data["Company Name"]} ({data["Ticker"]})
            </h1>
            <p className="text-gray-600">
              {data["Sector"]} | {data["Industry"]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              ${data["Current Price"]?.toFixed(2) || "N/A"}
            </p>
            <div
              className={`flex items-center justify-end ${upside >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {upside >= 0 ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span className="font-medium">
                {upside.toFixed(2)}% Potential
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === "overview" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "valuation" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("valuation")}
        >
          Valuation
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "profitability" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("profitability")}
        >
          Profitability
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "growth" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("growth")}
        >
          Growth
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard title="Market Cap" value={data["Market Cap"]} />
            <MetricCard title="P/E Ratio" value={data["P/E Ratio"]} />
            <MetricCard title="Beta" value={data["Beta"]} showStatus={false} />
            <MetricCard
              title="Dividend Yield"
              value={data["Dividend Yield"]}
              format="percent"
            />
          </div>

          {/* Price Range */}
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">52-Week Price Range</h2>
            <div className="bg-gray-200 h-4 rounded-full relative mb-2">
              <div
                className="absolute h-full bg-blue-500 rounded-full"
                style={{ width: `${pricePosition}%` }}
              ></div>
              <div
                className="absolute w-4 h-4 bg-blue-600 rounded-full -mt-2 -ml-2"
                style={{ left: `${pricePosition}%`, top: "50%" }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span>${data["52-Week Low"]?.toFixed(2) || "N/A"}</span>
              <span>
                Current: ${data["Current Price"]?.toFixed(2) || "N/A"}
              </span>
              <span>${data["52-Week High"]?.toFixed(2) || "N/A"}</span>
            </div>
          </div>

          {/* Analyst Recommendations */}
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-4">
              Analyst Recommendations
            </h2>
            <div className="flex items-center mb-2">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${data["Analyst Recommendation Mean"] < 2.5 ? "bg-green-500" : data["Analyst Recommendation Mean"] < 3.5 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{
                    width: `${((5 - (data["Analyst Recommendation Mean"] || 3)) / 5) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span>Strong Buy (1.0)</span>
              <span>Hold (3.0)</span>
              <span>Strong Sell (5.0)</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium capitalize">
                    {data["Analyst Recommendation Key"] || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Based on {data["Number of Analysts"] || "N/A"} analysts
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium">
                    Target: ${data["Target Mean Price"]?.toFixed(2) || "N/A"}
                  </p>
                  <p
                    className={`text-sm ${upside >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {upside >= 0 ? "+" : ""}
                    {upside.toFixed(2)}% from current
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "valuation" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <MetricCard title="P/E Ratio" value={data["P/E Ratio"]} />
            <MetricCard title="P/B Ratio" value={data["P/B Ratio"]} />
            <MetricCard
              title="EPS (TTM)"
              value={data["EPS (TTM)"]}
              showStatus={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Valuation Metrics</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valuationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toFixed(2)} />
                    <Bar dataKey="value" fill="#0088FE">
                      {valuationChartData.map((entry, index) => (
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

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">
                What These Metrics Mean
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium group cursor-help">
                    <span className="relative">
                      P/E Ratio: {data["P/E Ratio"]?.toFixed(2) || "N/A"}
                      <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded w-64 left-1/2 -translate-x-1/2 top-full mt-1 text-xs">
                        {getMetricExplanation("P/E Ratio")}
                      </span>
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    The <span className="font-medium">P/E Ratio</span> suggests
                    the stock might be{" "}
                    <span
                      className={`font-medium ${getMetricStatus("P/E Ratio", data["P/E Ratio"]) === "good" ? "text-green-500" : getMetricStatus("P/E Ratio", data["P/E Ratio"]) === "bad" ? "text-red-500" : "text-yellow-500"}`}
                    >
                      {getMetricStatus("P/E Ratio", data["P/E Ratio"]) ===
                      "good"
                        ? "attractively priced"
                        : getMetricStatus("P/E Ratio", data["P/E Ratio"]) ===
                            "bad"
                          ? "pricey"
                          : "moderately valued"}{" "}
                      {getMetricStatus("P/E Ratio", data["P/E Ratio"]) ===
                      "good"
                        ? "👍"
                        : getMetricStatus("P/E Ratio", data["P/E Ratio"]) ===
                            "bad"
                          ? "😬"
                          : "🤔"}
                      .
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-medium group cursor-help">
                    <span className="relative">
                      P/B Ratio: {data["P/B Ratio"]?.toFixed(2) || "N/A"}
                      <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded w-64 left-1/2 -translate-x-1/2 top-full mt-1 text-xs">
                        {getMetricExplanation("P/B Ratio")}
                      </span>
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    The <span className="font-medium">P/B Ratio</span> indicates
                    the stock's value relative to its assets is{" "}
                    <span
                      className={`font-medium ${getMetricStatus("P/B Ratio", data["P/B Ratio"]) === "good" ? "text-green-500" : getMetricStatus("P/B Ratio", data["P/B Ratio"]) === "bad" ? "text-red-500" : "text-yellow-500"}`}
                    >
                      {getMetricStatus("P/B Ratio", data["P/B Ratio"]) ===
                      "good"
                        ? "potentially good"
                        : getMetricStatus("P/B Ratio", data["P/B Ratio"]) ===
                            "bad"
                          ? "high"
                          : "reasonable"}{" "}
                      {getMetricStatus("P/B Ratio", data["P/B Ratio"]) ===
                      "good"
                        ? "✅"
                        : getMetricStatus("P/B Ratio", data["P/B Ratio"]) ===
                            "bad"
                          ? "🚩"
                          : "👌"}
                      .
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profitability Tab */}
      {activeTab === "profitability" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <MetricCard
              title="Operating Margin"
              value={data["Operating Margin"]}
              format="percent"
            />
            <MetricCard
              title="Profit Margin"
              value={data["Profit Margin"]}
              format="percent"
            />
            <MetricCard
              title="Return on Equity (ROE)"
              value={data["Return on Equity (ROE)"]}
              format="percent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Margin Analysis</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitabilityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                    <Bar dataKey="value" fill="#00C49F">
                      {profitabilityChartData.map((entry, index) => (
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

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">
                What These Metrics Mean
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium group cursor-help">
                    <span className="relative">
                      Operating Margin:{" "}
                      {formatPercent(data["Operating Margin"])}
                      <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded w-64 left-1/2 -translate-x-1/2 top-full mt-1 text-xs">
                        {getMetricExplanation("Operating Margin")}
                      </span>
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    The <span className="font-medium">Operating Margin</span>
                    suggests the company's core business is{" "}
                    <span
                      className={`font-medium ${getMetricStatus("Operating Margin", data["Operating Margin"]) === "good" ? "text-green-500" : getMetricStatus("Operating Margin", data["Operating Margin"]) === "bad" ? "text-red-500" : "text-yellow-500"}`}
                    >
                      {getMetricStatus(
                        "Operating Margin",
                        data["Operating Margin"]
                      ) === "good"
                        ? "efficient"
                        : getMetricStatus(
                              "Operating Margin",
                              data["Operating Margin"]
                            ) === "bad"
                          ? "struggling"
                          : "doing okay"}{" "}
                      {getMetricStatus(
                        "Operating Margin",
                        data["Operating Margin"]
                      ) === "good"
                        ? "👍"
                        : getMetricStatus(
                              "Operating Margin",
                              data["Operating Margin"]
                            ) === "bad"
                          ? "😟"
                          : "😐"}
                      .
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-medium group cursor-help">
                    <span className="relative">
                      Profit Margin: {formatPercent(data["Profit Margin"])}
                      <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded w-64 left-1/2 -translate-x-1/2 top-full mt-1 text-xs">
                        {getMetricExplanation("Profit Margin")}
                      </span>
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    The <span className="font-medium">Profit Margin</span> shows
                    how much money the company keeps after all costs, indicating{" "}
                    <span
                      className={`font-medium ${getMetricStatus("Profit Margin", data["Profit Margin"]) === "good" ? "text-green-500" : getMetricStatus("Profit Margin", data["Profit Margin"]) === "bad" ? "text-red-500" : "text-yellow-500"}`}
                    >
                      {getMetricStatus(
                        "Profit Margin",
                        data["Profit Margin"]
                      ) === "good"
                        ? "strong earnings"
                        : getMetricStatus(
                              "Profit Margin",
                              data["Profit Margin"]
                            ) === "bad"
                          ? "weak earnings"
                          : "decent earnings"}{" "}
                      {getMetricStatus(
                        "Profit Margin",
                        data["Profit Margin"]
                      ) === "good"
                        ? "💰"
                        : getMetricStatus(
                              "Profit Margin",
                              data["Profit Margin"]
                            ) === "bad"
                          ? "📉"
                          : "📊"}
                      .
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Growth Tab */}
      {activeTab === "growth" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <MetricCard
              title="Revenue Growth"
              value={data["Revenue Growth"]}
              format="percent"
            />
            <MetricCard
              title="Earnings Growth"
              value={data["Earnings Growth"]}
              format="percent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">Growth Analysis</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                    <Bar dataKey="value" fill="#FFBB28">
                      {growthChartData.map((entry, index) => (
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

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4">
                What These Metrics Mean
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium group cursor-help">
                    <span className="relative">
                      Revenue Growth: {formatPercent(data["Revenue Growth"])}
                      <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded w-64 left-1/2 -translate-x-1/2 top-full mt-1 text-xs">
                        {getMetricExplanation("Revenue Growth")}
                      </span>
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    The <span className="font-medium">Revenue Growth</span>
                    indicates the company's sales are{" "}
                    <span
                      className={`font-medium ${getMetricStatus("Revenue Growth", data["Revenue Growth"]) === "good" ? "text-green-500" : getMetricStatus("Revenue Growth", data["Revenue Growth"]) === "bad" ? "text-red-500" : "text-yellow-500"}`}
                    >
                      {getMetricStatus(
                        "Revenue Growth",
                        data["Revenue Growth"]
                      ) === "good"
                        ? "increasing nicely"
                        : getMetricStatus(
                              "Revenue Growth",
                              data["Revenue Growth"]
                            ) === "bad"
                          ? "not growing much"
                          : "growing steadily"}{" "}
                      {getMetricStatus(
                        "Revenue Growth",
                        data["Revenue Growth"]
                      ) === "good"
                        ? "🚀"
                        : getMetricStatus(
                              "Revenue Growth",
                              data["Revenue Growth"]
                            ) === "bad"
                          ? "🐌"
                          : "🚶"}
                      .
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-medium group cursor-help">
                    <span className="relative">
                      Earnings Growth: {formatPercent(data["Earnings Growth"])}
                      <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded w-64 left-1/2 -translate-x-1/2 top-full mt-1 text-xs">
                        {getMetricExplanation("Earnings Growth")}
                      </span>
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    The <span className="font-medium">Earnings Growth</span>
                    shows the company's profits are{" "}
                    <span
                      className={`font-medium ${getMetricStatus("Earnings Growth", data["Earnings Growth"]) === "good" ? "text-green-500" : getMetricStatus("Earnings Growth", data["Earnings Growth"]) === "bad" ? "text-red-500" : "text-yellow-500"}`}
                    >
                      {getMetricStatus(
                        "Earnings Growth",
                        data["Earnings Growth"]
                      ) === "good"
                        ? "rising well"
                        : getMetricStatus(
                              "Earnings Growth",
                              data["Earnings Growth"]
                            ) === "bad"
                          ? "not growing well"
                          : "growing moderately"}{" "}
                      {getMetricStatus(
                        "Earnings Growth",
                        data["Earnings Growth"]
                      ) === "good"
                        ? "📈"
                        : getMetricStatus(
                              "Earnings Growth",
                              data["Earnings Growth"]
                            ) === "bad"
                          ? "📉"
                          : "➡️"}
                      .
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investment Summary */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-medium mb-4">Investment Summary</h2>
        <p className="text-gray-700">
          {data["Company Name"]} shows
          {getMetricStatus("Profit Margin", data["Profit Margin"]) === "good"
            ? " strong 💪"
            : getMetricStatus("Profit Margin", data["Profit Margin"]) === "bad"
              ? " weak 😔"
              : " average 😐"}{" "}
          profitability with
          {data["Profit Margin"]
            ? ` a ${(data["Profit Margin"] * 100).toFixed(2)}% profit margin 🎉`
            : ""}
          .
          {getMetricStatus("P/E Ratio", data["P/E Ratio"]) === "good"
            ? " Valuation appears reasonable 👍"
            : getMetricStatus("P/E Ratio", data["P/E Ratio"]) === "bad"
              ? " Valuation appears elevated 😬"
              : " Valuation is moderate 🤔"}
          with a{" "}
          <span className="font-medium group cursor-help">
            <span className="relative">
              P/E ratio
              <span className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded w-64 left-1/2 -translate-x-1/2 top-full mt-1 text-xs">
                {getMetricExplanation("P/E Ratio")}
              </span>
            </span>
          </span>{" "}
          of {data["P/E Ratio"]?.toFixed(2) || "N/A"}. Growth is{" "}
          {getMetricStatus("Revenue Growth", data["Revenue Growth"]) === "good"
            ? "robust 🌱"
            : getMetricStatus("Revenue Growth", data["Revenue Growth"]) ===
                "bad"
              ? "sluggish 🐌"
              : "moderate 🚶"}
          with{" "}
          {data["Revenue Growth"]
            ? `${(data["Revenue Growth"] * 100).toFixed(2)}% revenue growth 📈`
            : "moderate revenue growth ➡️"}
          . Analysts are{" "}
          {data["Analyst Recommendation Mean"] < 2.5
            ? "generally positive ✅"
            : data["Analyst Recommendation Mean"] < 3.5
              ? "neutral 🤷"
              : "generally negative 👎"}{" "}
          on the stock with a consensus{" "}
          {data["Analyst Recommendation Key"] || "hold"} rating.
        </p>
      </div>
    </div>
  );
};

export default StockMetricsDashboard;
