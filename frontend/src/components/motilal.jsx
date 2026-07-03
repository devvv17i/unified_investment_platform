// src/App.js
import React, { useState } from "react";
import "./Motilal.css";
// import LoginForm from "./components/LoginForm";
import MFHoldings from "./MF_holdings";

function Motilal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [holdingsData, setHoldingsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/mf-holdings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to fetch holdings");
      }

      const data = await response.json();
      setHoldingsData(data);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setHoldingsData(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Motilal Oswal Mutual Fund Holdings</h1>
        {isLoggedIn && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </header>

      <main>
        {loading && <div className="loader">Loading...</div>}

        {error && (
          <div className="error-container">
            <p>Error: {error}</p>
          </div>
        )}

        <MFHoldings holdings={holdingsData} />
      </main>

      <footer>
        <p>
          &copy; {new Date().getFullYear()} Your Company Name. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

export default Motilal;
