import React, {
     useState,
     useEffect,
     useMemo,
     useRef,
     useCallback,
   } from "react";
   import { Line } from "react-chartjs-2";
   import {
     Chart as ChartJS,
     CategoryScale,
     LinearScale,
     PointElement,
     LineElement,
     Title,
     Tooltip,
     Legend,
     TimeScale, // Import TimeScale for time-based charts
   } from "chart.js";
   import "chartjs-adapter-date-fns"; // Import the date adapter
   
   // Register Chart.js components
   ChartJS.register(
     CategoryScale,
     LinearScale,
     PointElement,
     LineElement,
     Title,
     Tooltip,
     Legend,
     TimeScale // Register TimeScale
   );

   import Navbar from "./Navbar";
   
   // --- Configuration ---
   const INITIAL_BALANCE = 10000;
   const PRICE_UPDATE_INTERVAL_MS = 1500; // Update slightly slower
   const COMMISSION_PER_TRADE = 0.99; // Example commission fee
   const CHART_HISTORY_LENGTH = 60; // Keep last 60 data points for chart
   
   // --- Simulated Stock Data ---
   const createStockSimulation = (initialPrice) => {
     let currentPrice = initialPrice;
     return () => {
       const volatility = 0.005; // 0.5% volatility per tick
       const randomFactor = Math.random() * 2 * volatility - volatility;
       currentPrice *= 1 + randomFactor;
       // Ensure price doesn't go negative (though unlikely with small volatility)
       currentPrice = Math.max(0.01, currentPrice);
       return currentPrice;
     };
   };
   
   const STOCK_CATALOG = {
     AAPL: {
       name: "Apple Inc.",
       sector: "Technology",
       getPriceUpdate: createStockSimulation(175.5),
       initialPrice: 175.5,
       logo: "🍎",
     },
     GOOGL: {
       name: "Alphabet Inc.",
       sector: "Technology",
       getPriceUpdate: createStockSimulation(120.75),
       initialPrice: 120.75,
       logo: "🔍",
     },
     MSFT: {
       name: "Microsoft Corporation",
       sector: "Technology",
       getPriceUpdate: createStockSimulation(335.2),
       initialPrice: 335.2,
       logo: "🪟",
     },
     AMZN: {
       name: "Amazon.com Inc.",
       sector: "E-commerce",
       getPriceUpdate: createStockSimulation(145.3),
       initialPrice: 145.3,
       logo: "🛒",
     },
     TSLA: {
       name: "Tesla, Inc.",
       sector: "Automotive",
       getPriceUpdate: createStockSimulation(240.6),
       initialPrice: 240.6,
       logo: "🚗",
     },
   };
   
   // --- Utility Functions ---
   const formatCurrency = (value) =>
     new Intl.NumberFormat("en-US", {
       style: "currency",
       currency: "USD",
       minimumFractionDigits: 2,
       maximumFractionDigits: 2,
     }).format(value);
   
   const formatTimestamp = (timestamp) =>
     new Intl.DateTimeFormat("en-US", {
       hour: "2-digit",
       minute: "2-digit",
       second: "2-digit",
       hour12: false,
     }).format(timestamp);
   
   // --- Main App Component ---
   const AdvancedPaperTradingApp = () => {
     // --- State Management ---
     const [balance, setBalance] = useState(INITIAL_BALANCE);
     const [portfolio, setPortfolio] = useState({}); // { AAPL: { name, quantity, avgPrice }, ... }
     const [stockPrices, setStockPrices] = useState({}); // { AAPL: 175.5, ... }
     const [priceHistory, setPriceHistory] = useState({}); // { AAPL: [{x: time, y: price}], ... }
     const [selectedStock, setSelectedStock] = useState("AAPL");
     const [tradeQuantity, setTradeQuantity] = useState(1);
     const [errorMessage, setErrorMessage] = useState("");
     const [successMessage, setSuccessMessage] = useState("");
     const [transactionHistory, setTransactionHistory] = useState([]);
   
     // Ref for focusing quantity input on holding click
     const quantityInputRef = useRef(null);
     // Use refs for intervals to ensure proper cleanup
     const priceUpdateIntervalRef = useRef(null);
   
     // --- Price Updates Effect ---
     useEffect(() => {
       // console.log("Setting up price update interval..."); // Optional: for debugging setup/cleanup
       // Initialize prices and history
       const initialPrices = {};
       const initialHistory = {};
       const now = Date.now();
       Object.entries(STOCK_CATALOG).forEach(([symbol, stock]) => {
         initialPrices[symbol] = stock.initialPrice;
         // Start with at least one point for chart rendering
         initialHistory[symbol] = [{ x: now, y: stock.initialPrice }];
       });
       setStockPrices(initialPrices);
       setPriceHistory(initialHistory);
   
       // Cleanup previous interval if exists from HMR or previous runs
       if (priceUpdateIntervalRef.current) {
         // console.log("Clearing previous interval"); // Optional
         clearInterval(priceUpdateIntervalRef.current);
       }
   
       priceUpdateIntervalRef.current = setInterval(() => {
         const currentTime = Date.now();
         let latestPrices = {}; // To store prices generated in this tick
   
         // Update prices using functional update
         setStockPrices((prevPrices) => {
           const newPrices = { ...prevPrices };
           Object.entries(STOCK_CATALOG).forEach(([symbol, stock]) => {
             const newPrice = stock.getPriceUpdate(); // Generate price once
             newPrices[symbol] = newPrice;
             latestPrices[symbol] = newPrice; // Store for history update
           });
           return newPrices;
         });
   
         // Update history using functional update
         setPriceHistory((prevHistory) => {
           const updatedHistory = { ...prevHistory };
           Object.keys(STOCK_CATALOG).forEach((symbol) => {
             // Use the price generated in the setStockPrices update above
             const currentPriceForHistory = latestPrices[symbol];
             // Ensure price is valid before adding to history
             if (
               typeof currentPriceForHistory === "number" &&
               currentPriceForHistory > 0
             ) {
               const stockHistory = prevHistory[symbol] || [];
               updatedHistory[symbol] = [
                 ...stockHistory,
                 { x: currentTime, y: currentPriceForHistory },
               ].slice(-CHART_HISTORY_LENGTH);
             } else {
               // Optionally handle invalid price (e.g., keep old history)
               // console.warn(`Invalid price ${currentPriceForHistory} for ${symbol} in history update`);
               updatedHistory[symbol] = prevHistory[symbol] || []; // Keep existing history
             }
           });
           return updatedHistory;
         });
       }, PRICE_UPDATE_INTERVAL_MS);
   
       // console.log("Interval setup complete. ID:", priceUpdateIntervalRef.current); // Optional
   
       // Cleanup interval on component unmount
       return () => {
         // console.log("Cleaning up interval. ID:", priceUpdateIntervalRef.current); // Optional
         if (priceUpdateIntervalRef.current) {
           clearInterval(priceUpdateIntervalRef.current);
           priceUpdateIntervalRef.current = null; // Clear ref
         }
       };
       // Run only ONCE on mount - Empty dependency array
     }, []);
   
     // --- Clear Messages Effect ---
     useEffect(() => {
       let errorTimer;
       let successTimer;
       if (errorMessage) {
         errorTimer = setTimeout(() => setErrorMessage(""), 3000); // Clear after 3s
       }
       if (successMessage) {
         successTimer = setTimeout(() => setSuccessMessage(""), 3000); // Clear after 3s
       }
       return () => {
         clearTimeout(errorTimer);
         clearTimeout(successTimer);
       }; // Cleanup timers
     }, [errorMessage, successMessage]);
   
     // --- Trade Execution Logic ---
     const executeStockTrade = useCallback(
       (type = "buy") => {
         setErrorMessage(""); // Clear previous errors/success messages
         setSuccessMessage("");
   
         // Validate Quantity
         const quantity = Number(tradeQuantity);
         if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
           setErrorMessage("Please enter a valid whole number quantity.");
           return;
         }
   
         const currentPrice = stockPrices[selectedStock];
         if (currentPrice === undefined || currentPrice <= 0) {
           setErrorMessage(
             `Invalid price data for ${selectedStock}. Trade cancelled.`
           );
           return;
         }
   
         const totalStockValue = currentPrice * quantity;
         const totalTransactionCost = totalStockValue + COMMISSION_PER_TRADE;
         const totalSaleProceeds = totalStockValue - COMMISSION_PER_TRADE;
   
         // --- Buy Logic ---
         if (type === "buy") {
           if (totalTransactionCost > balance) {
             setErrorMessage(
               `Insufficient funds. Need ${formatCurrency(
                 totalTransactionCost
               )} (incl. ${formatCurrency(COMMISSION_PER_TRADE)} fee).`
             );
             return;
           }
   
           // *** Proceed with Buy Updates ***
           setPortfolio((prevPortfolio) => {
             const existingHolding = prevPortfolio[selectedStock] || {
               quantity: 0,
               avgPrice: 0,
             };
             const newTotalQuantity = existingHolding.quantity + quantity;
             // Calculate new average price correctly
             const newAvgPrice =
               (existingHolding.avgPrice * existingHolding.quantity +
                 currentPrice * quantity) /
               newTotalQuantity;
   
             return {
               ...prevPortfolio,
               [selectedStock]: {
                 name: STOCK_CATALOG[selectedStock].name,
                 quantity: newTotalQuantity,
                 avgPrice: newAvgPrice,
               },
             };
           });
   
           setBalance((prev) => prev - totalTransactionCost);
   
           setTransactionHistory((prev) => [
             {
               id: Date.now(),
               timestamp: Date.now(),
               type: "BUY",
               symbol: selectedStock,
               quantity,
               price: currentPrice,
               totalValue: totalStockValue,
               commission: COMMISSION_PER_TRADE,
             },
             ...prev, // Add to the beginning for recent first view
           ]);
   
           setSuccessMessage(
             `Successfully bought ${quantity} ${selectedStock} @ ${formatCurrency(
               currentPrice
             )}`
           );
         }
         // --- Sell Logic (Corrected Structure) ---
         else if (type === "sell") {
           // Read the current portfolio state directly BEFORE attempting the update
           const currentHolding = portfolio[selectedStock]; // Read from current state
   
           // *** Log values right before the critical check (for debugging) ***
           // console.log(`Attempting to sell: ${quantity} ${selectedStock}`);
           // console.log(`Current holding state:`, currentHolding);
           // console.log(`Owned quantity: ${currentHolding?.quantity}, Sell quantity: ${quantity}`);
           // console.log(`Total Sale Proceeds (after fee): ${totalSaleProceeds}`);
   
           // *** Perform CRITICAL CHECKS *BEFORE* updating state ***
           if (!currentHolding || currentHolding.quantity < quantity) {
             console.error("Sell validation failed: Insufficient shares.");
             setErrorMessage(
               `Insufficient shares. You own ${currentHolding?.quantity || 0} ${selectedStock}.`
             );
             return; // Stop execution
           }
   
           if (totalSaleProceeds < 0) {
             console.error(
               "Sell validation failed: Commission exceeds sale value."
             );
             setErrorMessage(
               `Transaction fee (${formatCurrency(COMMISSION_PER_TRADE)}) exceeds sale value (${formatCurrency(totalStockValue)}). Cannot sell.`
             );
             return; // Stop execution
           }
   
           // *** If all checks pass, proceed with ALL state updates ***
           // console.log("Sell validation passed. Updating state..."); // Optional debug log
   
           // 1. Update Portfolio using functional update for safety
           setPortfolio((prevPortfolio) => {
             // Re-read state inside functional update for atomicity
             const holdingToUpdate = prevPortfolio[selectedStock];
   
             // Double check inside just in case state changed between check and update (very unlikely but safe)
             if (!holdingToUpdate || holdingToUpdate.quantity < quantity) {
               console.warn(
                 "State changed between check and update. Aborting sell inside setPortfolio."
               );
               // Don't set error here, rely on the outer check's error message
               return prevPortfolio; // Abort if state changed unexpectedly
             }
   
             const updatedPortfolio = { ...prevPortfolio };
             const newQuantity = holdingToUpdate.quantity - quantity;
   
             // Final safety check (should not happen if initial check is correct)
             if (newQuantity < 0) {
               console.error(
                 "CRITICAL Error: Calculated negative quantity after sell check passed. Aborting."
               );
               // Don't set error here
               return prevPortfolio;
             }
   
             // Update or delete the holding
             if (newQuantity === 0) {
               delete updatedPortfolio[selectedStock];
               // console.log(`Removing ${selectedStock} from portfolio state.`); // Optional debug log
             } else {
               updatedPortfolio[selectedStock] = {
                 ...holdingToUpdate, // Keep name, avgPrice etc.
                 quantity: newQuantity,
               };
             }
             return updatedPortfolio; // Return the updated state
           });
   
           // 2. Update Balance (Increase by proceeds)
           setBalance((prev) => prev + totalSaleProceeds);
   
           // 3. Update Transaction History
           setTransactionHistory((prev) => [
             {
               id: Date.now(),
               timestamp: Date.now(),
               type: "SELL",
               symbol: selectedStock,
               quantity,
               price: currentPrice,
               totalValue: totalStockValue,
               commission: COMMISSION_PER_TRADE,
             },
             ...prev, // Add to beginning
           ]);
   
           // 4. Set Success Message
           setSuccessMessage(
             `Successfully sold ${quantity} ${selectedStock} @ ${formatCurrency(currentPrice)}`
           );
         } // End Sell Logic
       },
       [
         // Dependencies needed for the function logic
         balance,
         portfolio, // Needed for the upfront check in 'sell' logic
         selectedStock,
         stockPrices,
         tradeQuantity,
         setBalance, // Setters are stable references, technically optional but good practice
         setPortfolio,
         setTransactionHistory,
         setErrorMessage,
         setSuccessMessage,
       ]
     );
   
     // --- Computed Portfolio Metrics ---
     const portfolioMetrics = useMemo(() => {
       let totalValue = 0;
       let totalCostBasis = 0;
   
       const holdings = Object.entries(portfolio).map(([symbol, holding]) => {
         // Use current price if available, otherwise fallback (maybe to avgPrice? or 0?)
         const currentPrice = stockPrices[symbol] ?? holding.avgPrice ?? 0;
         const currentTotalValue = holding.quantity * currentPrice;
         const costBasis = holding.avgPrice * holding.quantity;
         const profitLoss = currentTotalValue - costBasis;
         // Handle costBasis being 0 or negative (though avgPrice shouldn't be neg) to avoid NaN/Infinity
         const profitLossPercent =
           costBasis && costBasis !== 0 ? (profitLoss / costBasis) * 100 : 0;
   
         totalValue += currentTotalValue;
         totalCostBasis += costBasis;
   
         return {
           symbol,
           ...holding,
           currentPrice,
           currentTotalValue,
           costBasis,
           profitLoss,
           profitLossPercent,
         };
       });
   
       const totalProfitLoss = totalValue - totalCostBasis;
       // Total P/L % should be based on the initial investment in current holdings
       const totalProfitLossPercent =
         totalCostBasis && totalCostBasis !== 0
           ? (totalProfitLoss / totalCostBasis) * 100
           : 0;
   
       return {
         holdings,
         totalValue,
         totalCostBasis, // Total initial investment in current holdings
         totalProfitLoss, // Overall unrealized P/L
         totalProfitLossPercent, // Overall unrealized P/L %
       };
     }, [portfolio, stockPrices]); // Dependencies
   
     // --- Chart Data and Options ---
     const chartData = useMemo(() => {
       const history = priceHistory[selectedStock] || [];
       // Ensure data has structure chart.js expects: {x: time, y: value}
       const formattedHistory = history
         .map((point) => ({
           x: point.x, // Already a timestamp
           y: typeof point.y === "number" ? point.y : null, // Ensure y is a number or null
         }))
         .filter((point) => point.y !== null); // Filter out invalid points
   
       return {
         datasets: [
           {
             label: `${selectedStock} Price`,
             data: formattedHistory,
             borderColor: "rgb(75, 192, 192)",
             backgroundColor: "rgba(75, 192, 192, 0.1)", // Add a fill color
             tension: 0.1,
             pointRadius: 1,
             pointHoverRadius: 5, // Make points easier to hover
             fill: true, // Enable fill under the line
           },
         ],
       };
     }, [priceHistory, selectedStock]); // Correct dependencies
   
     const chartOptions = useMemo(
       () => ({
         responsive: true,
         maintainAspectRatio: false,
         plugins: {
           legend: { display: false },
           title: {
             display: true,
             text: `${selectedStock} Price Trend (Last ${CHART_HISTORY_LENGTH} ticks)`,
           },
           tooltip: {
             mode: "index",
             intersect: false,
             callbacks: {
               // Format tooltip values
               label: function (context) {
                 let label = context.dataset.label || "";
                 if (label) {
                   label += ": ";
                 }
                 if (context.parsed.y !== null) {
                   label += formatCurrency(context.parsed.y);
                 }
                 return label;
               },
             },
           },
         },
         scales: {
           x: {
             type: "time",
             time: {
               unit: "second",
               tooltipFormat: "HH:mm:ss",
               displayFormats: { second: "HH:mm:ss" },
             },
             title: { display: true, text: "Time" },
             ticks: {
               maxTicksLimit: 10,
               autoSkip: true,
               maxRotation: 0,
               minRotation: 0,
             }, // Improve label readability
           },
           y: {
             title: { display: true, text: "Price (USD)" },
             ticks: { callback: (value) => formatCurrency(value) },
           },
         },
         animation: false, // Keep animation off for real-time
         parsing: false, // Optimization: data is already parsed {x, y}
       }),
       [selectedStock]
     ); // Dependency on selectedStock for the title
   
     // --- Price Change Calculation ---
     const calculatePriceChange = useCallback(
       (symbol) => {
         const stock = STOCK_CATALOG[symbol];
         const currentPrice = stockPrices[symbol];
         if (!stock || currentPrice === undefined) {
           return { absolute: 0, percentage: 0, isUp: true }; // Default state
         }
         // Use initialPrice from the catalog for daily change calculation
         const initialDayPrice = stock.initialPrice;
         const priceChange = currentPrice - initialDayPrice;
         const percentChange =
           initialDayPrice === 0 ? 0 : (priceChange / initialDayPrice) * 100;
         return {
           absolute: priceChange,
           percentage: percentChange,
           isUp: priceChange >= 0,
         };
       },
       [stockPrices]
     ); // Depends only on stockPrices changing
   
     // --- Click Holding Handler ---
     const handleHoldingClick = useCallback(
       (symbol) => {
         //   console.log("Holding clicked:", symbol); // Optional debug log
         setSelectedStock(symbol);
         setTradeQuantity(1); // Default to trading 1 share
   
         // Scroll to top or focus input for better UX
         window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll page top
         quantityInputRef.current?.focus(); // Focus the quantity input field
         quantityInputRef.current?.select(); // Select text in input
       },
       [setSelectedStock, setTradeQuantity]
     ); // Dependencies: Only the setters are needed
   
     // --- JSX Rendering ---
     return (
          <div>
               <Navbar />
       <div className="max-w-7xl mt-8 mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
         {/* Header */}
         <header className="mb-6 text-center">
           <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-1">
             Advanced Paper Trading Platform
           </h1>
           <p className="text-gray-600 text-sm sm:text-base">
             Real-time Simulated Stock Trading (Local Time:{" "}
             {new Date().toLocaleTimeString()})
           </p>
         </header>
   
         {/* Top Status Bar */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white shadow p-4 rounded-lg border border-gray-200">
           <AccountStat
             label="Cash Balance"
             value={formatCurrency(balance)}
             icon="💰"
             color="text-green-600"
           />
           <AccountStat
             label="Portfolio Value"
             value={formatCurrency(portfolioMetrics.totalValue)}
             icon="📈"
             color="text-blue-600"
           />
           <AccountStat
             label="Unrealized P/L"
             value={`${formatCurrency(portfolioMetrics.totalProfitLoss)} (${portfolioMetrics.totalProfitLossPercent.toFixed(2)}%)`}
             icon={portfolioMetrics.totalProfitLoss >= 0 ? "▲" : "▼"}
             color={
               portfolioMetrics.totalProfitLoss >= 0
                 ? "text-green-600"
                 : "text-red-600"
             }
           />
         </div>
   
         {/* Messages Area */}
         <div className="h-8 mb-4 text-center">
           {" "}
           {/* Fixed height to prevent layout shifts */}
           {errorMessage && (
             <div className="inline-block p-2 bg-red-100 text-red-700 rounded-md text-sm font-medium animate-pulse">
               {errorMessage}
             </div>
           )}
           {successMessage && (
             <div className="inline-block p-2 bg-green-100 text-green-700 rounded-md text-sm font-medium animate-pulse">
               {successMessage}
             </div>
           )}
         </div>
   
         {/* Trading Interface & Chart */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           {/* Stock Selection, Price, Chart (Left/Center) */}
           <div className="lg:col-span-2 bg-white shadow p-6 rounded-lg border border-gray-200">
             <h3 className="text-xl font-semibold mb-4 text-gray-800">
               Market Watch & Trade
             </h3>
             {/* Stock Selector */}
             <select
               value={selectedStock}
               onChange={(e) => setSelectedStock(e.target.value)}
               className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               {Object.entries(STOCK_CATALOG).map(([symbol, stock]) => (
                 <option key={symbol} value={symbol}>
                   {stock.logo} {symbol} - {stock.name} ({stock.sector})
                 </option>
               ))}
             </select>
   
             {/* Current Stock Price Display */}
             {stockPrices[selectedStock] !== undefined ? (
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-lg font-bold text-gray-900">
                     {STOCK_CATALOG[selectedStock]?.logo} {selectedStock} Current
                     Price
                   </span>
                   <span
                     className={`font-semibold text-sm px-2 py-0.5 rounded ${calculatePriceChange(selectedStock).isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                   >
                     {calculatePriceChange(selectedStock).isUp ? "▲" : "▼"}{" "}
                     {calculatePriceChange(selectedStock).absolute.toFixed(2)} (
                     {calculatePriceChange(selectedStock).percentage.toFixed(2)}%)
                   </span>
                 </div>
                 <div className="text-3xl font-bold text-gray-900">
                   {formatCurrency(stockPrices[selectedStock])}
                 </div>
               </div>
             ) : (
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 text-gray-500">
                 Loading price...
               </div>
             )}
   
             {/* Chart Display */}
             <div className="h-64 md:h-80 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-200 relative">
               {priceHistory[selectedStock] &&
               priceHistory[selectedStock].length > 0 ? (
                 <Line options={chartOptions} data={chartData} />
               ) : (
                 <div className="flex justify-center items-center h-full text-gray-500">
                   {stockPrices[selectedStock] === undefined
                     ? "Loading initial data..."
                     : "Waiting for price data..."}
                 </div>
               )}
             </div>
           </div>
   
           {/* Trade Execution Panel (Right) */}
           <div className="bg-white shadow p-6 rounded-lg border border-gray-200 self-start">
             <h3 className="text-xl font-semibold mb-4 text-gray-800">
               Execute Trade
             </h3>
             <div className="mb-4">
               <label
                 htmlFor="tradeQuantityInput"
                 className="block mb-1 text-sm font-medium text-gray-700"
               >
                 Quantity
               </label>
               <input
                 ref={quantityInputRef} // Attach ref here
                 id="tradeQuantityInput"
                 type="number"
                 min="1"
                 step="1" // Only whole numbers
                 value={tradeQuantity}
                 onChange={(e) =>
                   // Ensure only positive integers
                   setTradeQuantity(
                     Math.max(1, Math.floor(Number(e.target.value) || 1))
                   )
                 }
                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 placeholder="Enter quantity"
               />
             </div>
   
             {/* Estimated Cost/Proceeds */}
             <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-100 rounded-md">
               <p>
                 Est. Cost (Buy):{" "}
                 {formatCurrency(
                   (stockPrices[selectedStock] || 0) * tradeQuantity +
                     COMMISSION_PER_TRADE
                 )}
               </p>
               <p>
                 Est. Proceeds (Sell):{" "}
                 {formatCurrency(
                   (stockPrices[selectedStock] || 0) * tradeQuantity -
                     COMMISSION_PER_TRADE
                 )}
               </p>
               <p className="text-xs italic">
                 (Includes {formatCurrency(COMMISSION_PER_TRADE)} commission fee)
               </p>
             </div>
   
             <div className="flex flex-col space-y-3">
               <button
                 onClick={() => executeStockTrade("buy")}
                 className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition duration-150 flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                 // Disable buy if price is missing or cost exceeds balance
                 disabled={
                   !stockPrices[selectedStock] ||
                   balance <
                     (stockPrices[selectedStock] || 0) * tradeQuantity +
                       COMMISSION_PER_TRADE
                 }
               >
                 <span className="mr-2">🛒</span> Buy {selectedStock}
               </button>
               <button
                 onClick={() => executeStockTrade("sell")}
                 className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition duration-150 flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                 // Disable sell if price missing, holding doesn't exist, or quantity to sell exceeds owned quantity
                 disabled={
                   !stockPrices[selectedStock] ||
                   !portfolio[selectedStock] || // Check if holding exists
                   portfolio[selectedStock].quantity < tradeQuantity // Check if owned quantity is sufficient
                 }
               >
                 <span className="mr-2">💸</span> Sell {selectedStock}
               </button>
             </div>
           </div>
         </div>
   
         {/* Portfolio Holdings & Transaction History Tabs */}
         <div className="bg-white shadow p-6 rounded-lg border border-gray-200">
           <Tabs>
             {/* Pass handleHoldingClick down to PortfolioTable */}
             <Tab label="Portfolio Holdings">
               <PortfolioTable
                 metrics={portfolioMetrics}
                 onHoldingClick={handleHoldingClick}
               />
             </Tab>
             <Tab label="Transaction History">
               <TransactionHistoryTable history={transactionHistory} />
             </Tab>
           </Tabs>
         </div>
       </div>
       </div>
     );
   };
   
   // --- Helper Components ---
   
   // Stat component for the top bar
   const AccountStat = ({ label, value, icon, color = "text-gray-800" }) => (
     <div className="text-center">
       <h3 className="text-sm sm:text-base font-medium text-gray-500 mb-1">
         {label}
       </h3>
       <div className={`flex items-center justify-center ${color}`}>
         <span className="mr-2 text-xl">{icon}</span>
         <span className="text-lg sm:text-xl font-bold">{value}</span>
       </div>
     </div>
   );
   
   // Portfolio Table Component - Updated
   const PortfolioTable = ({ metrics, onHoldingClick }) => {
     // Accept onHoldingClick prop
     if (metrics.holdings.length === 0) {
       return (
         <p className="text-center text-gray-600 py-4">
           Your portfolio is empty. Start by buying some stocks!
         </p>
       );
     }
     return (
       <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Symbol
               </th>
               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Qty
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Avg. Price
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Current Price
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Market Value
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Unrealized P/L
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 P/L %
               </th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {metrics.holdings.map((h) => (
               // Add onClick handler and cursor style to the row
               <tr
                 key={h.symbol}
                 onClick={() => onHoldingClick(h.symbol)} // Call handler with symbol
                 className="hover:bg-blue-50 cursor-pointer transition-colors duration-150" // Added styles
               >
                 <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                   {STOCK_CATALOG[h.symbol]?.logo} {h.symbol}
                 </td>
                 <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                   {h.quantity}
                 </td>
                 <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                   {formatCurrency(h.avgPrice)}
                 </td>
                 <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                   {formatCurrency(h.currentPrice)}
                 </td>
                 <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                   {formatCurrency(h.currentTotalValue)}
                 </td>
                 <td
                   className={`px-4 py-2 whitespace-nowrap text-sm font-semibold text-right ${h.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                 >
                   {h.profitLoss >= 0 ? "+" : ""}
                   {formatCurrency(h.profitLoss)}
                 </td>
                 <td
                   className={`px-4 py-2 whitespace-nowrap text-sm font-semibold text-right ${h.profitLossPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                 >
                   {h.profitLossPercent.toFixed(2)}%
                 </td>
               </tr>
             ))}
             {/* Total Row */}
             <tr className="bg-gray-100 font-bold">
               <td
                 colSpan="4"
                 className="px-4 py-2 text-right text-sm text-gray-800 uppercase"
               >
                 Portfolio Totals:
               </td>
               <td className="px-4 py-2 text-right text-sm text-gray-800">
                 {formatCurrency(metrics.totalValue)}
               </td>
               <td
                 className={`px-4 py-2 text-right text-sm ${metrics.totalProfitLoss >= 0 ? "text-green-700" : "text-red-700"}`}
               >
                 {metrics.totalProfitLoss >= 0 ? "+" : ""}
                 {formatCurrency(metrics.totalProfitLoss)}
               </td>
               <td
                 className={`px-4 py-2 text-right text-sm ${metrics.totalProfitLossPercent >= 0 ? "text-green-700" : "text-red-700"}`}
               >
                 {metrics.totalProfitLossPercent.toFixed(2)}%
               </td>
             </tr>
           </tbody>
         </table>
       </div>
     );
   };
   
   // Transaction History Table Component
   const TransactionHistoryTable = ({ history }) => {
     if (history.length === 0) {
       return (
         <p className="text-center text-gray-600 py-4">
           No transactions recorded yet.
         </p>
       );
     }
   
     // Assumes history array has latest transactions first due to how they are added
     return (
       <div className="overflow-x-auto max-h-96 overflow-y-auto">
         {" "}
         {/* Limit height and add scroll */}
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50 sticky top-0 z-10">
             {" "}
             {/* Sticky header */}
             <tr>
               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Time
               </th>
               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Type
               </th>
               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Symbol
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Qty
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Price
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Total Value
               </th>
               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Fee
               </th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {history.map(
               (
                 t // Iterate directly
               ) => (
                 <tr key={t.id} className="hover:bg-gray-50">
                   <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                     {formatTimestamp(t.timestamp)}
                   </td>
                   <td
                     className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${t.type === "BUY" ? "text-green-600" : "text-red-600"}`}
                   >
                     {t.type}
                   </td>
                   <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                     {STOCK_CATALOG[t.symbol]?.logo} {t.symbol}
                   </td>
                   <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                     {t.quantity}
                   </td>
                   <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                     {formatCurrency(t.price)}
                   </td>
                   <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                     {formatCurrency(t.totalValue)}
                   </td>
                   <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                     {formatCurrency(t.commission)}
                   </td>
                 </tr>
               )
             )}
           </tbody>
         </table>
       </div>
     );
   };
   
   // Simple Tabs Component
   const Tabs = ({ children }) => {
     const [activeTab, setActiveTab] = useState(0);
     // Filter out null/undefined children just in case
     const tabs = React.Children.toArray(children).filter(Boolean);
   
     return (
       <div>
         <div className="border-b border-gray-200 mb-4">
           <nav className="-mb-px flex space-x-6" aria-label="Tabs">
             {tabs.map((tab, index) => (
               <button
                 key={index}
                 onClick={() => setActiveTab(index)}
                 className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
                   // Added focus style
                   activeTab === index
                     ? "border-blue-500 text-blue-600"
                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                 }`}
                 aria-current={activeTab === index ? "page" : undefined}
               >
                 {tab.props.label}
               </button>
             ))}
           </nav>
         </div>
         <div>
           {/* Render only the active tab */}
           {tabs[activeTab]}
         </div>
       </div>
     );
   };
   
   // Tab Pane Component (used within Tabs)
   // No changes needed here, it just holds props and children
   const Tab = ({ children }) => {
     return <>{children}</>;
   };
   
   export default AdvancedPaperTradingApp;