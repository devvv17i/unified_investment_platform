// src/components/MFHoldings.js
import React, { useState } from "react";
import "./MF_holdings.css";

const MFHoldings = ({ holdings }) => {
  const [sortField, setSortField] = useState("schemaName");
  const [sortDirection, setSortDirection] = useState("asc");

  // This function assumes a specific structure from Motilal Oswal API
  // You may need to adjust based on their actual response format
  const processHoldings = (data) => {
    // Handle different possible response structures
    const funds = data?.data?.funds || data?.funds || [];

    // Simple data cleansing and preparation
    return funds.map((fund) => ({
      ...fund,
      currentValue: parseFloat(fund.currentValue || 0),
      investedAmount: parseFloat(fund.investedAmount || 0),
      returns: parseFloat(fund.returns || 0),
      units: parseFloat(fund.units || 0),
    }));
  };

  const sortedHoldings = () => {
    const processed = processHoldings(holdings);

    return [...processed].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle string vs number comparison
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? "▲" : "▼";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate summary data
  const calculateSummary = () => {
    const processed = processHoldings(holdings);

    return processed.reduce(
      (summary, fund) => {
        summary.totalInvested += fund.investedAmount || 0;
        summary.totalCurrent += fund.currentValue || 0;
        return summary;
      },
      { totalInvested: 0, totalCurrent: 0 }
    );
  };

  const summary = calculateSummary();
  const totalReturns = summary.totalCurrent - summary.totalInvested;
  const totalReturnsPercentage = (totalReturns / summary.totalInvested) * 100;

  return (
    <div className="holdings-container">
      <div className="summary-section">
        <div className="summary-card total-investment">
          <h3>Total Investment</h3>
          <p>{formatCurrency(summary.totalInvested)}</p>
        </div>

        <div className="summary-card current-value">
          <h3>Current Value</h3>
          <p>{formatCurrency(summary.totalCurrent)}</p>
        </div>

        <div
          className={`summary-card returns ${totalReturns >= 0 ? "positive" : "negative"}`}
        >
          <h3>Overall Returns</h3>
          <p>
            {formatCurrency(totalReturns)} (
            {formatPercentage(totalReturnsPercentage)})
          </p>
        </div>
      </div>

      <div className="holdings-table-container">
        <h2>Your Mutual Fund Holdings</h2>
        <table className="holdings-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("schemaName")}>
                Fund Name {getSortIcon("schemaName")}
              </th>
              <th onClick={() => handleSort("folioNumber")}>
                Folio No. {getSortIcon("folioNumber")}
              </th>
              <th onClick={() => handleSort("units")}>
                Units {getSortIcon("units")}
              </th>
              <th onClick={() => handleSort("investedAmount")}>
                Amount Invested {getSortIcon("investedAmount")}
              </th>
              <th onClick={() => handleSort("currentValue")}>
                Current Value {getSortIcon("currentValue")}
              </th>
              <th onClick={() => handleSort("returns")}>
                Returns {getSortIcon("returns")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings().map((fund, index) => {
              const returnAmount = fund.currentValue - fund.investedAmount;
              const returnPercentage =
                (returnAmount / fund.investedAmount) * 100;
              const isPositive = returnAmount >= 0;

              return (
                <tr key={index}>
                  <td>{fund.schemaName}</td>
                  <td>{fund.folioNumber}</td>
                  <td>{fund.units.toFixed(3)}</td>
                  <td>{formatCurrency(fund.investedAmount)}</td>
                  <td>{formatCurrency(fund.currentValue)}</td>
                  <td className={isPositive ? "positive" : "negative"}>
                    {formatCurrency(returnAmount)} (
                    {formatPercentage(returnPercentage)})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MFHoldings;
