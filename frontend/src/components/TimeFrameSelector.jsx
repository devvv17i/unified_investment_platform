import React from "react";

// Define available timeframes matching backend expectations or mapping
const timeframes = [
  { label: "Max (Daily)", period: "max", interval: "1d" },
  { label: "5Y (Daily)", period: "5y", interval: "1d" },
  { label: "1Y (Daily)", period: "1y", interval: "1d" },
  { label: "YTD (Daily)", period: "ytd", interval: "1d" },
  { label: "6M (Daily)", period: "6mo", interval: "1d" },
  { label: "1M (Daily)", period: "1mo", interval: "1d" },
  { label: "2Y (Hourly)", period: "2y", interval: "1h" }, // Note: Hourly limited
  { label: "5D (15 Min)", period: "5d", interval: "15m" }, // Example minute data
];

const TimeframeSelector = ({
  onSelectTimeframe,
  currentPeriod,
  currentInterval,
  isLoading,
}) => {
  return (
    <div className="mb-4 flex flex-wrap justify-center gap-2">
      {timeframes.map(({ label, period, interval }) => {
        const isActive =
          period === currentPeriod && interval === currentInterval;
        return (
          <button
            key={label}
            onClick={() => onSelectTimeframe(period, interval)}
            disabled={isLoading}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
              isActive
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default TimeframeSelector;