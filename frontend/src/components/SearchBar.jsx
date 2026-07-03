import React, { useState } from "react";

const SearchBar = ({ onSearch, isLoading }) => {
  const [inputTicker, setInputTicker] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputTicker.trim()) {
      onSearch(inputTicker.trim().toUpperCase()); // Pass uppercase ticker
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 w-full max-w-md mx-auto">
      <div className="flex items-center border border-gray-300 rounded-lg shadow-sm overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500">
        <input
          type="text"
          value={inputTicker}
          onChange={(e) => setInputTicker(e.target.value)}
          placeholder="Enter stock ticker (e.g., AAPL)"
          className="p-3 flex-grow text-lg border-none focus:outline-none"
          disabled={isLoading}
          aria-label="Stock Ticker Input"
        />
        <button
          type="submit"
          className={`p-3 px-5 text-lg font-semibold text-white transition-colors duration-150 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={isLoading || !inputTicker.trim()}
        >
          {isLoading ? "Loading..." : "Search"}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;