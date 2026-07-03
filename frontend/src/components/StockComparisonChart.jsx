import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from "recharts";
import Navbar from "./Navbar";

const StockComparisonChart = () => {
  const [ticker1, setTicker1] = useState("AAPL");
  const [ticker2, setTicker2] = useState("MSFT");
  const [pastYears, setPastYears] = useState(5);
  const [futureYears, setFutureYears] = useState(5);
  const [chartData, setChartData] = useState({});
  const [filteredData, setFilteredData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [today, setToday] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const chartContainerRef = useRef(null);
  
  // Function to fetch data from the Flask backend
  const fetchData = async () => {
    if (!ticker1 || !ticker2) {
      setError("Please enter both ticker symbols");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/get-time-series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tickers: [ticker1, ticker2] }),
      });
      

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setChartData(data);

      // Find today's date in the dataset
      if (data[ticker1] && data[ticker1].length > 0) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Format as YYYY-MM-DD to match the date format in the data
        const todayStr = currentDate.toISOString().split("T")[0];
        setToday(todayStr);
        
        // Filter data based on selected time ranges
        filterDataByTimeRange(data, todayStr, pastYears, futureYears);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching time series data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on selected time range
  const filterDataByTimeRange = (data, todayStr, pastYears, futureYears) => {
    const filteredResult = {};
    const today = new Date(todayStr);

    // Calculate date limits
    const pastLimit = new Date(today);
    pastLimit.setFullYear(today.getFullYear() - pastYears);

    const futureLimit = new Date(today);
    futureLimit.setFullYear(today.getFullYear() + futureYears);

    // Filter data for each ticker
    Object.keys(data).forEach((ticker) => {
      filteredResult[ticker] = data[ticker].filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= pastLimit && itemDate <= futureLimit;
      });
    });

    setFilteredData(filteredResult);
  };

  // Update filtered data when time range changes
  const updateTimeRange = () => {
    if (Object.keys(chartData).length > 0 && today) {
      filterDataByTimeRange(chartData, today, pastYears, futureYears);
    }
  };

  // Sample the data to improve performance (we don't need to plot every daily point)
  const getSampledData = (tickerData, sampleRate = 7) => {
    if (!tickerData || tickerData.length === 0) return [];

    // Adjust sample rate based on data size
    const adjustedRate = Math.max(1, Math.floor(tickerData.length / 200));

    const result = [];
    for (let i = 0; i < tickerData.length; i += adjustedRate) {
      result.push(tickerData[i]);
    }

    // Always include the last point
    const lastPoint = tickerData[tickerData.length - 1];
    if (result[result.length - 1] !== lastPoint) {
      result.push(lastPoint);
    }

    return result;
  };

  // Generate color for each ticker
  const getTickerColor = (ticker) => {
    const colors = {
      AAPL: "#FF6384",
      MSFT: "#36A2EB",
      GOOGL: "#FFCE56",
      AMZN: "#4BC0C0",
      META: "#9966FF",
      TSLA: "#FF9F40",
    };

    return (
      colors[ticker] || `#${Math.floor(Math.random() * 16777215).toString(16)}`
    );
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (chartContainerRef.current.requestFullscreen) {
        chartContainerRef.current.requestFullscreen();
      } else if (chartContainerRef.current.webkitRequestFullscreen) {
        chartContainerRef.current.webkitRequestFullscreen();
      } else if (chartContainerRef.current.msRequestFullscreen) {
        chartContainerRef.current.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('msfullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
    };
  }, []);

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Stock Price Comparison</h1>

        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label htmlFor="ticker1" className="block mb-1">
              First Ticker:
            </label>
            <input
              id="ticker1"
              type="text"
              value={ticker1}
              onChange={(e) => setTicker1(e.target.value.toUpperCase())}
              className="border p-2 rounded"
              placeholder="e.g. AAPL"
            />
          </div>

          <div>
            <label htmlFor="ticker2" className="block mb-1">
              Second Ticker:
            </label>
            <input
              id="ticker2"
              type="text"
              value={ticker2}
              onChange={(e) => setTicker2(e.target.value.toUpperCase())}
              className="border p-2 rounded"
              placeholder="e.g. MSFT"
            />
          </div>

          <div>
            <label htmlFor="pastYears" className="block mb-1">
              Years in the Past:
            </label>
            <input
              id="pastYears"
              type="number"
              min="1"
              max="15"
              value={pastYears}
              onChange={(e) => setPastYears(Number(e.target.value))}
              className="border p-2 rounded w-20"
            />
          </div>

          <div>
            <label htmlFor="futureYears" className="block mb-1">
              Years in the Future:
            </label>
            <input
              id="futureYears"
              type="number"
              min="1"
              max="15"
              value={futureYears}
              onChange={(e) => setFutureYears(Number(e.target.value))}
              className="border p-2 rounded w-20"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mr-2"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Compare Stocks"}
            </button>

            {Object.keys(chartData).length > 0 && (
              <button
                onClick={updateTimeRange}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600 mr-2"
              >
                Update Time Range
              </button>
            )}
            
            {Object.keys(filteredData).length > 0 && (
              <button
                onClick={toggleFullScreen}
                className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
              >
                {isFullScreen ? "Exit Full Screen" : "Full Screen"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 mb-4 rounded">
            {error}
          </div>
        )}

        {Object.keys(filteredData).length > 0 && (
          <div 
            ref={chartContainerRef} 
            className={`mb-8 ${isFullScreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}
          >
            <h2 className="text-xl font-semibold mb-2">
              Price Comparison ({pastYears} years past to {futureYears} years
              future)
            </h2>
            <div className={`border p-2 bg-white rounded shadow ${isFullScreen ? 'h-full' : 'h-96'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    type="category"
                    allowDuplicatedCategory={false}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getFullYear()}-${d.getMonth() + 1}`;
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip
                    labelFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString();
                    }}
                    formatter={(value) => [`${value.toFixed(2)}`, ""]}
                  />
                  <Legend />

                  {/* Add reference line for today */}
                  {today && (
                    <ReferenceLine
                      x={today}
                      stroke="#ff0000"
                      strokeDasharray="3 3"
                      label={{ value: "Today", position: "top", fill: "#ff0000" }}
                    />
                  )}

                  {/* Line for first ticker */}
                  {filteredData[ticker1] && (
                    <Line
                      data={getSampledData(filteredData[ticker1])}
                      type="monotone"
                      dataKey="value"
                      name={ticker1}
                      stroke={getTickerColor(ticker1)}
                      dot={false}
                      activeDot={{ r: 8 }}
                    />
                  )}

                  {/* Line for second ticker */}
                  {filteredData[ticker2] && (
                    <Line
                      data={getSampledData(filteredData[ticker2])}
                      type="monotone"
                      dataKey="value"
                      name={ticker2}
                      stroke={getTickerColor(ticker2)}
                      dot={false}
                      activeDot={{ r: 8 }}
                    />
                  )}

                  {/* Add brush for zooming and scrolling */}
                  <Brush 
                    dataKey="date" 
                    height={30} 
                    stroke="#8884d8"
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getFullYear()}-${d.getMonth() + 1}`;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {isFullScreen && (
              <div className="absolute top-4 right-4">
                <button 
                  onClick={toggleFullScreen}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  Exit Full Screen
                </button>
              </div>
            )}
          </div>
        )}

        {!isFullScreen && Object.keys(filteredData).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[ticker1, ticker2].map((ticker) => {
              if (!filteredData[ticker]) return null;

              const data = filteredData[ticker];
              const start = data[0]?.value || 0;
              const end = data[data.length - 1]?.value || 0;
              const current =
                data.find((item) => item.date === today)?.value ||
                data.reduce((prev, curr) => {
                  if (!prev) return curr;
                  const prevDate = new Date(prev.date);
                  const currDate = new Date(curr.date);
                  const todayDate = new Date(today);
                  return Math.abs(currDate - todayDate) <
                    Math.abs(prevDate - todayDate)
                    ? curr
                    : prev;
                }, null)?.value ||
                0;

              const pastGrowth = (current / start - 1) * 100;
              const futureGrowth = (end / current - 1) * 100;

              return (
                <div key={ticker} className="border rounded p-4 bg-white shadow">
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: getTickerColor(ticker) }}
                  >
                    {ticker}
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div>Starting Price:</div>
                    <div className="text-right">${start.toFixed(2)}</div>

                    <div>Current Price:</div>
                    <div className="text-right">${current.toFixed(2)}</div>

                    <div>Future Price (Projected):</div>
                    <div className="text-right">${end.toFixed(2)}</div>

                    <div>Historical Growth:</div>
                    <div
                      className={`text-right ${pastGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {pastGrowth.toFixed(2)}%
                    </div>

                    <div>Projected Growth:</div>
                    <div
                      className={`text-right ${futureGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {futureGrowth.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isFullScreen && (
          <div className="mt-8 text-sm text-gray-500">
            <p>
              Note: This visualization shows historical data and predicted future
              values based on your model. The red vertical line represents today.
            </p>
            <p>
              You can adjust the time range to focus on specific periods of
              interest. Use the brush control at the bottom of the chart to zoom and
              scroll through the data, or click the Full Screen button for a larger view.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockComparisonChart;