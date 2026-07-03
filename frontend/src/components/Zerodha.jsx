import React, { useState, useEffect } from "react";

function Holdings() {
  const [holdings, setHoldings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        // Fetch holdings data with credentials to include cookies
        const response = await fetch("http://127.0.0.1:5000/holdings", {
          credentials: "include",
        });

        if (response.status === 401) {
          // Not authenticated, set flag to show login button
          setIsAuthenticated(false);
          throw new Error("Please login to view your holdings");
        }

        if (!response.ok) {
          throw new Error("Failed to fetch holdings data");
        }

        // Authentication successful
        setIsAuthenticated(true);
        const data = await response.json();
        setHoldings(data);

        // Calculate totals
        const value = data.reduce(
          (sum, item) => sum + item.last_price * item.quantity,
          0
        );
        const pnl = data.reduce((sum, item) => {
          // Calculate PnL if it's not directly available
          const itemPnl =
            item.pnl || (item.last_price - item.average_price) * item.quantity;
          return sum + itemPnl;
        }, 0);

        setTotalValue(value);
        setTotalPnL(pnl);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  // Handle login redirect
  const handleLogin = () => {
    window.location.href = "http://127.0.0.1:5000/login";
  };

  // Sorting function
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedHoldings = React.useMemo(() => {
    if (!sortConfig.key) return holdings;

    return [...holdings].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }, [holdings, sortConfig]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show login button if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="mb-6 text-gray-600">
          Please login with your Zerodha account to view your holdings.
        </p>
        <button
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
        >
          Login with Zerodha
        </button>
      </div>
    );
  }

  if (error && isAuthenticated) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700">
              Portfolio Value
            </h3>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <div
            className={`p-4 rounded-lg ${totalPnL >= 0 ? "bg-green-50" : "bg-red-50"}`}
          >
            <h3
              className={`text-sm font-medium ${totalPnL >= 0 ? "text-green-700" : "text-red-700"}`}
            >
              Total P&L
            </h3>
            <p
              className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(totalPnL)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("tradingsymbol")}
              >
                Symbol
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("quantity")}
              >
                Qty
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("average_price")}
              >
                Avg. Price
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("last_price")}
              >
                LTP
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("pnl")}
              >
                P&L
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort("day_change_percentage")}
              >
                Change %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedHoldings.length > 0 ? (
              sortedHoldings.map((holding) => {
                // Calculate P&L if not available
                const pnl =
                  holding.pnl ||
                  (holding.last_price - holding.average_price) *
                    holding.quantity;

                return (
                  <tr key={holding.tradingsymbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {holding.tradingsymbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          {holding.exchange}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {holding.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(holding.average_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(holding.last_price)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(pnl)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${holding.day_change_percentage >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {holding.day_change_percentage > 0 ? "+" : ""}
                      {holding.day_change_percentage?.toFixed(2) || "0.00"}%
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No holdings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Holdings;