import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Star, Clock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import Navbar from './Navbar'; // Assuming Navbar component exists

// --- Finnhub API Setup ---
const FINNHUB_API_KEY = "cvo5l1hr01qppf5b2190cvo5l1hr01qppf5b219g";
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const finnhubClient = axios.create({
  baseURL: FINNHUB_BASE_URL,
  params: {
    token: FINNHUB_API_KEY
  }
});
// --- --- --- --- --- --- --

const SearchStocks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]); // Will store { symbol, description } from Finnhub /search
  const [fetchedQuotes, setFetchedQuotes] = useState({}); // Cache for fetched quote data { SYMBOL: { price, change, ... } }
  const [popularStocks, setPopularStocks] = useState([]); // Stores { symbol, name, price, change }
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true); // Loading state for popular stocks
  const [error, setError] = useState(null);

  // --- Define symbols for popular stocks ---
  const popularStockSymbols = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'META'];
  // Use a mapping for names since /quote doesn't provide them
  const popularStockNames = {
      AAPL: 'Apple Inc.',
      NVDA: 'NVIDIA Corporation',
      MSFT: 'Microsoft Corporation',
      TSLA: 'Tesla Inc.',
      META: 'Meta Platforms Inc.'
  };

//   if(!localStorage.getItem('token')) {
//           window.location.href = '/';
//   }
  // --- Fetch Quote Data ---
  // useCallback to prevent re-creation on every render unless dependencies change
  const fetchQuote = useCallback(async (symbol) => {
    // Check cache first
    if (fetchedQuotes[symbol]) {
        return fetchedQuotes[symbol];
    }
    try {
      const response = await finnhubClient.get('/quote', { params: { symbol } });
      if (response.data && response.data.c !== undefined) { // Check if data is valid
         const quoteData = {
              price: response.data.c,
              change: response.data.dp, // Percent change
              // Add other fields if needed: o, h, l, pc etc.
          };
          // Update cache
          setFetchedQuotes(prev => ({ ...prev, [symbol]: quoteData }));
          return quoteData;
      } else {
          console.warn(`No quote data received for ${symbol}`);
          return null; // Indicate no data
      }
    } catch (err) {
      console.error(`Error fetching quote for ${symbol}:`, err);
      // Avoid setting global error for single quote fetch failure unless critical
      return null; // Indicate fetch failure
    }
  }, [fetchedQuotes]); // Dependency: fetchedQuotes cache

  // --- Fetch Popular Stocks Data on Mount ---
  useEffect(() => {
    const fetchPopularStocks = async () => {
      setIsLoadingPopular(true);
      setError(null); // Clear previous errors

      try {
          const quotePromises = popularStockSymbols.map(symbol => fetchQuote(symbol));
          const quotes = await Promise.all(quotePromises);

          const popularData = popularStockSymbols
              .map((symbol, index) => {
                  const quote = quotes[index];
                  if (quote) { // Only include if quote fetch was successful
                      return {
                          symbol: symbol,
                          name: popularStockNames[symbol] || 'N/A', // Use mapped name
                          price: quote.price,
                          change: quote.change,
                      };
                  }
                  return null; // Exclude if quote failed
              })
              .filter(stock => stock !== null); // Remove null entries

          setPopularStocks(popularData);
      } catch (err) {
           console.error("Error fetching popular stocks:", err);
           setError('Failed to load popular stocks.'); // Set specific error
      } finally {
          setIsLoadingPopular(false);
      }
    };

    fetchPopularStocks();

    // Load recent searches from localStorage (example)
    const storedRecents = localStorage.getItem('recentStockSearches');
    if (storedRecents) {
      setRecentSearches(JSON.parse(storedRecents));
    } else {
         // Default recent searches if nothing in localStorage
         setRecentSearches([
             { symbol: 'AMZN', name: 'Amazon.com Inc.' },
             { symbol: 'GOOGL', name: 'Alphabet Inc.' }
         ]);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount (fetchQuote is memoized)

  // --- Handle Search Input & Fetch Suggestions ---
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      setIsLoadingSuggestions(false); // Ensure loading is off when query is empty
      return;
    }

    setIsLoadingSuggestions(true);
    setError(null); // Clear error specific to search suggestions

    // Debounce mechanism
    const handler = setTimeout(async () => {
      try {
        const response = await finnhubClient.get('/search', { params: { q: searchQuery } });
        if (response.data && response.data.result) {
          // Filter out non-common stock results if desired (e.g., indices, forex)
          const filteredResults = response.data.result.filter(item =>
              item.type === 'Common Stock' || !item.type // Include items without a type specified potentially
              // You might want to adjust this filter based on Finnhub's response types
          );
          setSuggestions(filteredResults.slice(0, 10)); // Limit suggestions count
        } else {
            setSuggestions([]);
        }
      } catch (err) {
        console.error("Error fetching search suggestions:", err);
        // Don't show API key errors to the user
        if (err.response && err.response.status === 401) {
            setError('Invalid or missing API Key.');
        } else if (err.response && err.response.status === 429) {
            setError('API rate limit exceeded. Please try again later.');
        }
         else {
            setError('Failed to fetch search results.');
        }
        setSuggestions([]); // Clear suggestions on error
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // Debounce time: 300ms

    // Cleanup function to clear timeout if query changes before fetch completes
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]); // Re-run when searchQuery changes

  // --- Update Recent Searches and Persist ---
  const updateRecentSearches = (stock) => {
      // Use the description from suggestions or a fetched name
      const stockToAdd = { symbol: stock.symbol, name: stock.description || stock.name || stock.symbol };

      const newRecents = [
          stockToAdd,
          ...recentSearches.filter(item => item.symbol !== stock.symbol) // Remove duplicates
      ].slice(0, 5); // Keep only the latest 5

      setRecentSearches(newRecents);
      localStorage.setItem('recentStockSearches', JSON.stringify(newRecents));
  };

  // --- Event Handlers ---
  const handleSearchFocus = () => setIsSearchFocused(true);
  const handleSearchBlur = (e) => {
      // Use setTimeout to allow clicks within suggestions dropdown
      setTimeout(() => {
          // Check if the new focused element is *not* inside the suggestions container
          if (!e.relatedTarget || !e.relatedTarget.closest('.suggestions-container')) {
              setIsSearchFocused(false);
          }
      }, 100); // Small delay
  };
  const handleClearSearch = () => setSearchQuery('');
  const handleStockSelect = (stock) => {
      // 'stock' could be from suggestions ({ symbol, description })
      // or popular/recent ({ symbol, name, price?, change? })
      console.log(`Selected stock: ${stock.symbol}`);

      // Update recent searches
      updateRecentSearches(stock);

      // Reset search state
      setSearchQuery('');
      setSuggestions([]);
      setIsSearchFocused(false);

      // TODO: Navigate to a stock details page or perform another action
      // Example: navigate(`/stocks/${stock.symbol}`);
  };

  return (
    <div>
        <Navbar /> {/* Include Navbar */}

        
        <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans"> {/* Added font-sans */}
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Search Stocks</h2>

            {/* Search Bar */}
            <div className="relative mb-6"> {/* Adjusted margin */}
                <div className="relative">
                    <div className={`flex items-center p-3 border-2 rounded-lg bg-white transition-all duration-300 ${isSearchFocused ? 'border-blue-500 shadow-lg' : 'border-gray-300'}`}>
                        <Search className={`w-5 h-5 mr-3 transition-colors flex-shrink-0 ${isSearchFocused ? 'text-blue-500' : 'text-gray-500'}`} />
                        <input
                            type="text"
                            placeholder="Search by company name or symbol (e.g., AAPL)"
                            className="flex-grow outline-none text-base md:text-lg text-gray-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={handleSearchFocus}
                            onBlur={handleSearchBlur}
                            aria-label="Search Stocks"
                        />
                        {searchQuery && (
                            <button onClick={handleClearSearch} className="text-gray-400 hover:text-gray-600 ml-2" aria-label="Clear search">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {/* Animated underline */}
                    <motion.div
                        className="h-0.5 bg-blue-500 mt-0.5" /* Thinner underline */
                        initial={{ width: 0 }}
                        animate={{ width: isSearchFocused ? '100%' : '0%' }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Search Suggestions Dropdown */}
                <AnimatePresence>
                    {isSearchFocused && (
                        <motion.div
                            className="suggestions-container absolute z-20 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden max-h-[70vh] overflow-y-auto" // Added max-height and scroll
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            tabIndex={-1} // Make it focusable for blur logic
                        >
                            {isLoadingSuggestions ? (
                                <div className="p-4 flex justify-center items-center text-gray-500">
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
                                </div>
                            ) : error && searchQuery.length > 0 ? ( // Only show search error if query is active
                                <div className="p-4 text-red-600 flex items-center bg-red-50">
                                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" /> {error}
                                </div>
                            ) : suggestions.length > 0 ? (
                                <>
                                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Search Results
                                    </div>
                                    {suggestions.map((stock) => (
                                        <div // Changed from motion.div as list animation might be overkill
                                            key={stock.symbol}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-b-0"
                                            onClick={() => handleStockSelect(stock)}
                                            onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click registers
                                            role="option"
                                            aria-selected="false"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-800">{stock.description}</div>
                                                <div className="text-sm text-gray-500">{stock.symbol}</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                                        </div>
                                    ))}
                                </>
                            ) : searchQuery.trim() !== '' ? (
                                <div className="p-4 text-gray-500 text-center">
                                    No results found for "{searchQuery}"
                                </div>
                            ) : (
                                <>
                                    {/* Recent Searches */}
                                    {recentSearches.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-gray-50 flex items-center border-b border-gray-200">
                                                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Recent Searches</span>
                                            </div>
                                            {recentSearches.map((stock) => (
                                                <div
                                                    key={stock.symbol}
                                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-b-0"
                                                    onClick={() => handleStockSelect(stock)}
                                                     onMouseDown={(e) => e.preventDefault()}
                                                    role="option"
                                                    aria-selected="false"
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-800">{stock.name}</div>
                                                        <div className="text-sm text-gray-500">{stock.symbol}</div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Optionally add default suggestions or popular links here when search is empty */}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Popular Stocks Section */}
            <div>
                <div className="flex items-center mb-4">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-800">Popular Stocks</h3>
                </div>

                {isLoadingPopular ? (
                     <div className="p-4 flex justify-center items-center text-gray-500">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading Popular Stocks...
                    </div>
                ) : error && popularStocks.length === 0 ? ( // Show error if loading failed AND no stocks loaded
                     <div className="p-4 text-red-600 flex items-center bg-red-50 rounded border border-red-200">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" /> {error}
                    </div>
                ) : popularStocks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"> {/* Adjusted grid cols */}
                        {popularStocks.map((stock) => (
                            <motion.div
                                key={stock.symbol}
                                className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => handleStockSelect(stock)}
                                role="button"
                                tabIndex={0} // Make it focusable
                            >
                                <div>
                                    <div className="flex items-center mb-1">
                                        <h4 className="font-bold text-lg text-gray-900">{stock.symbol}</h4>
                                        {/* Simple star for visual cue, not functional */}
                                        <Star className="w-4 h-4 ml-2 text-yellow-400 fill-current" />
                                    </div>
                                    <p className="text-sm text-gray-600 truncate mb-2">{stock.name}</p>
                                </div>
                                <div className="text-right mt-auto"> {/* Push price to bottom */}
                                    <p className="font-semibold text-base text-gray-800">
                                        ${(stock.price ?? 0).toFixed(2)} {/* Handle potential null price */}
                                    </p>
                                    <p className={`text-sm font-medium ${stock.change == null ? 'text-gray-500' : stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                         {stock.change == null ? 'N/A' : `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%`}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                 ) : (
                     <div className="p-4 text-gray-500">No popular stocks available.</div>
                 )}

                {/* Sectors Navigation - Placeholder/Example - Requires more complex filtering/API calls */}
                {/* <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Browse by Sector</h3>
                    <div className="flex flex-wrap gap-2">
                        {['Technology', 'Financial Services', 'Healthcare', 'Consumer Cyclical', 'Communication Services', 'Consumer Defensive'].map((sector) => (
                            <motion.button
                                key={sector}
                                className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                whileTap={{ scale: 0.97 }}
                            >
                                {sector}
                            </motion.button>
                        ))}
                    </div>
                </div> */}

                {/* Note: The "All Stocks Table" is removed as fetching *all* stocks isn't feasible */}
                {/* with Finnhub's basic endpoints without specific exchange listing and potentially */}
                {/* many quote calls. You might replace this with a "Watchlist" or "Top Movers" section */}
                {/* if desired, which would require different API endpoints or logic. */}

            </div>
        </div>
    </div>
  );
};

export default SearchStocks;