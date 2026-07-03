import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { TrendingUp, DollarSign, Percent, BarChart2 } from 'lucide-react';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helper to format numbers (currency, large numbers, percentages)
const formatNumber = (num, type = "number") => {
  if (num === null || num === undefined || isNaN(num)) return "N/A";

  switch (type) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    case "percent":
      return `${(num * 100).toFixed(2)}%`;
    case "large":
      if (Math.abs(num) >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
      if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
      if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
      if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    case "ratio":
      return num.toFixed(2);
    default:
      return typeof num === "number"
        ? num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : num;
  }
};

const InfoItem = ({ label, value, formatType = "number", icon }) => (
  <div className="py-2 px-3 flex justify-between items-center text-sm border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
    <span className="text-gray-600 font-medium flex items-center gap-2">
      {icon && icon}
      {label}
    </span>
    <span className="text-gray-800 font-semibold text-right">
      {value === "N/A" || value === undefined ? (
        "N/A"
      ) : formatType === "link" &&
        typeof value === "string" &&
        value.startsWith("http") ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        formatNumber(value, formatType)
      )}
    </span>
  </div>
);

const MarginsPieChart = ({ data }) => {
  const chartData = {
    labels: ['Gross Margin', 'Operating Margin', 'Profit Margin'],
    datasets: [
      {
        data: [
          data.grossMargins * 100,
          data.operatingMargins * 100,
          data.profitMargins * 100
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="h-64">
      <Pie
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'Margin Analysis 📊',
            },
          },
        }}
      />
    </div>
  );
};

const ReturnsLineChart = ({ data }) => {
  const chartData = {
    labels: ['ROA', 'ROE'],
    datasets: [
      {
        label: 'Returns (%)',
        data: [
          data.returnOnAssets * 100,
          data.returnOnEquity * 100,
        ],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="h-64">
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'Returns Analysis 📈',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Percentage (%)',
              },
            },
          },
        }}
      />
    </div>
  );
};

const StockInfo = ({ data }) => {
  if (!data?.symbol) {
    return (
      <div className="p-4 text-center text-gray-500">
        No fundamental data available.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-200  text-black">
        <h2 className="text-2xl font-bold">
          {data.longName || data.symbol} ({data.symbol}) 🏢
        </h2>
        <p className="text-sm opacity-90">
          {data.sector} 📊 | {data.industry} 🏭 | {data.country} 🌍
        </p>
        {data.website && (
          <InfoItem label="Website 🌐" value={data.website} formatType="link" />
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
          <TrendingUp size={20} /> Business Summary
        </h3>
        <p className="text-md text-gray-600 mb-6 leading-relaxed">
          {data.longBusinessSummary || "No summary available."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700 flex items-center gap-2">
              <DollarSign size={20} /> Key Metrics
            </h3>
            <div className="border border-gray-200 rounded-md mb-6 hover:shadow-md transition-shadow">
              <InfoItem
                label="Market Cap"
                value={data.marketCap}
                formatType="large"
                icon={<BarChart2 size={16} />}
              />
              <InfoItem
                label="Enterprise Value"
                value={data.enterpriseValue}
                formatType="large"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="Current Price"
                value={data.currentPrice}
                formatType="currency"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="52 Week High"
                value={data.fiftyTwoWeekHigh}
                formatType="currency"
                icon={<TrendingUp size={16} />}
              />
              <InfoItem
                label="52 Week Low"
                value={data.fiftyTwoWeekLow}
                formatType="currency"
                icon={<TrendingUp size={16} />}
              />
              <InfoItem
                label="Avg. Volume"
                value={data.averageVolume}
                formatType="large"
                icon={<BarChart2 size={16} />}
              />
              <InfoItem
                label="Beta"
                value={data.beta}
                formatType="ratio"
                icon={<Percent size={16} />}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700 flex items-center gap-2">
              <Percent size={20} /> Valuation & Ratios
            </h3>
            <div className="border border-gray-200 rounded-md mb-6 hover:shadow-md transition-shadow">
              <InfoItem
                label="Trailing P/E"
                value={data.trailingPE}
                formatType="ratio"
                icon={<BarChart2 size={16} />}
              />
              <InfoItem
                label="Forward P/E"
                value={data.forwardPE}
                formatType="ratio"
                icon={<BarChart2 size={16} />}
              />
              <InfoItem
                label="Price To Book"
                value={data.priceToBook}
                formatType="ratio"
                icon={<BarChart2 size={16} />}
              />
              <InfoItem
                label="EV/Revenue"
                value={data.enterpriseToRevenue}
                formatType="ratio"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="EV/EBITDA"
                value={data.enterpriseToEbitda}
                formatType="ratio"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="Dividend Yield"
                value={data.dividendYield}
                formatType="percent"
                icon={<Percent size={16} />}
              />
              <InfoItem
                label="Payout Ratio"
                value={data.payoutRatio}
                formatType="percent"
                icon={<Percent size={16} />}
              />
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <MarginsPieChart data={data} />
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <ReturnsLineChart data={data} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700 flex items-center gap-2">
              <TrendingUp size={20} /> Financials & Growth
            </h3>
            <div className="border border-gray-200 rounded-md mb-6 hover:shadow-md transition-shadow">
              <InfoItem
                label="Total Revenue"
                value={data.totalRevenue}
                formatType="large"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="Revenue Per Share"
                value={data.revenuePerShare}
                formatType="ratio"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="Revenue Growth"
                value={data.revenueGrowth}
                formatType="percent"
                icon={<TrendingUp size={16} />}
              />
              <InfoItem
                label="Earnings Growth"
                value={data.earningsGrowth}
                formatType="percent"
                icon={<TrendingUp size={16} />}
              />
              <InfoItem
                label="Gross Margins"
                value={data.grossMargins}
                formatType="percent"
                icon={<Percent size={16} />}
              />
              <InfoItem
                label="Operating Margins"
                value={data.operatingMargins}
                formatType="percent"
                icon={<Percent size={16} />}
              />
              <InfoItem
                label="Profit Margins"
                value={data.profitMargins}
                formatType="percent"
                icon={<Percent size={16} />}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700 flex items-center gap-2">
              <BarChart2 size={20} /> Balance Sheet
            </h3>
            <div className="border border-gray-200 rounded-md mb-6 hover:shadow-md transition-shadow">
              <InfoItem
                label="Total Cash"
                value={data.totalCash}
                formatType="large"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="Total Cash Per Share"
                value={data.totalCashPerShare}
                formatType="ratio"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="Total Debt"
                value={data.totalDebt}
                formatType="large"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="Book Value Per Share"
                value={data.bookValue}
                formatType="ratio"
                icon={<DollarSign size={16} />}
              />
              <InfoItem
                label="Return on Assets"
                value={data.returnOnAssets}
                formatType="percent"
                icon={<Percent size={16} />}
              />
              <InfoItem
                label="Return on Equity"
                value={data.returnOnEquity}
                formatType="percent"
                icon={<Percent size={16} />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockInfo;