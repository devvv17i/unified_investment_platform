import React from "react";
import Holdings from "./Zerodha";

function ZerodhaPortfolio() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Zerodha Portfolio Tracker
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Holdings />
      </main>
    </div>
  );
}

export default ZerodhaPortfolio;