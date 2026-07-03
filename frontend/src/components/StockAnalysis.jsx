import React, { useState, useEffect, useCallback, useRef } from "react";
import SearchBar from "./SearchBar";
import StockInfo from "./StockInfo.jsx";
import LoadingSpinner from "./LoadingSpinner"; // Ensure component exists
import ErrorMessage from "./ErrorMessage"; // Ensure component exists
import Navbar from "./Navbar.jsx";

// Define your backend API URL (Consider moving to a config file or .env)
const API_BASE_URL = "http://127.0.0.1:5000"; // Replace with your actual API URL

const StockAnalysisPage = () => {
  const [ticker, setTicker] = useState("AAPL"); // Default ticker
  const [stockData, setStockData] = useState({ info: null, history: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTimeframe, setCurrentTimeframe] = useState({
    period: "1y", // Default timeframe period
    interval: "1d", // Default timeframe interval
  });

  // Ref for the chart container div
  const chartContainerRef = useRef(null);
  // State to store chart dimensions
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Function to fetch data from backend (Memoized)
  const fetchStockData = useCallback(async (symbol, period, interval) => {
    setIsLoading(true);
    setError(null);
    // Keep previous data while loading new for smoother transition? Or clear immediately?
    // setStockData({ info: null, history: [] }); // Option: Clear previous data immediately
    console.log(
      `Workspaceing data for ${symbol}, Period: ${period}, Interval: ${interval}`
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stock/${symbol}?period=${period}&interval=${interval}`
      );

      if (!response.ok) {
        let errorMsg = `HTTP error! Status: ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg; // Use backend error if available
        } catch (jsonError) {
          // Handle cases where response is not JSON
          errorMsg = `Failed to fetch data. Server responded with status ${response.status}.`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.error) {
        // Handle errors returned explicitly in JSON body
        throw new Error(data.error);
      }
      console.log("Data received from backend:", data);

      // Basic validation of received data
      if (!data.history || !Array.isArray(data.history)) {
        console.error("Invalid history data format received:", data.history);
        throw new Error("Received invalid chart data format from server.");
      }
      if (!data.info || typeof data.info !== "object") {
        console.warn(
          "Fundamental info missing or invalid in response for",
          symbol
        );
        data.info = null; // Allow missing info, but ensure it's null
      }

      setStockData(data); // Set both info and history
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "An unknown error occurred while fetching data.");
      setStockData({ info: null, history: [] }); // Clear data fully on error
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed if API_BASE_URL is constant

  // Effect to fetch data on initial load and when ticker or timeframe changes
  useEffect(() => {
    if (ticker) {
      fetchStockData(
        ticker,
        currentTimeframe.period,
        currentTimeframe.interval
      );
    }
    // Dependency array includes ticker and timeframe state + the memoized fetch function
  }, [ticker, currentTimeframe, fetchStockData]);

  // Effect to measure chart container and handle resize
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      console.log("Chart container ref not found yet (Initial render likely).");
      return; // Exit if ref not attached yet
    }

    const updateSize = () => {
      if (container) {
        // Double check ref still exists
        console.log(
          "ResizeObserver triggered. Container Client W/H:",
          container.clientWidth,
          container.clientHeight
        ); // Log dimensions being measured
        setChartDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    // Initial measurement after mount
    updateSize();

    // Use ResizeObserver for performance
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    // Cleanup function to disconnect observer
    return () => {
      console.log("Disconnecting ResizeObserver.");
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // Handlers
  const handleSearch = (newTicker) => {
    if (newTicker !== ticker) {
      setTicker(newTicker);
      // Optionally clear old data immediately for better UX
      // setStockData({ info: null, history: [] });
      // setError(null);
      // setChartDimensions({ width: 0, height: 0 }); // Reset dimensions? Maybe not needed.
    }
  };

  const handleTimeframeSelect = (period, interval) => {
    if (
      period !== currentTimeframe.period ||
      interval !== currentTimeframe.interval
    ) {
      setCurrentTimeframe({ period, interval });
    }
  };

  // Determine if the chart itself can be rendered
  const canRenderChart =
    !isLoading &&
    !error &&
    stockData.history?.length > 0 &&
    chartDimensions.width > 0 &&
    chartDimensions.height > 0;

  // Log dimensions being passed just before render
  console.log(
    "StockAnalysisPage Render -> Passing Dimensions:",
    chartDimensions,
    "Can Render Chart:",
    canRenderChart
  );

  return (
     <div>
          <Navbar />
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        Professional Stock Analysis
      </h1>

      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      {/* Error Message Display */}
      {error && <ErrorMessage message={error} />}

      {/* Loading State Indicator */}
      {isLoading && <LoadingSpinner />}

      {/* Message when no data is found (after loading, without error) */}
      {!isLoading && !error && stockData.history?.length === 0 && ticker && (
        <div className="mt-8 p-4 text-center text-gray-500 bg-gray-100 border border-gray-200 rounded-md shadow-sm">
          No data found for "{ticker}" with the selected timeframe. Try
          adjusting the timeframe or ticker symbol.
        </div>
      )}

      {/* Chart and Info Section - Render structure, conditionally render chart */}
      {/* Render container only if we might show a chart or info */}
      

      {/* Stock Info Section - Show if chart data exists */}
      {!isLoading && !error && stockData.history?.length > 0 && (
        <>
          {stockData.info ? (
            <div className="mt-8">
              <StockInfo data={stockData.info} />{" "}
              {/* Ensure StockInfo component exists */}
            </div>
          ) : (
            // Show mild warning if fundamentals are missing but chart data exists
            <div className="mt-8 p-4 text-center text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md shadow-sm">
              Fundamental data could not be loaded for {ticker}.
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
};

export default StockAnalysisPage;