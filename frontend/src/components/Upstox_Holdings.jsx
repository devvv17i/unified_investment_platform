import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart, Bar } from "recharts";
import { Briefcase, AlertCircle } from "lucide-react";
import Navbar from "./Navbar";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function UpstoxHoldings() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const token = localStorage.getItem("upstox_access_token");
        const response = await axios.get("http://127.0.0.1/upstox/holdings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setHoldings(response.data.data || []);
      } catch (error) {
        console.error("Error fetching holdings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHoldings();
  }, []);

  const totalInvestment = holdings.reduce((sum, h) => sum + (h.quantity * h.average_price), 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.market_value, 0);

  const pieData = holdings.map((h) => ({
    name: h.trading_symbol,
    value: h.market_value,
  }));

  if (loading) {
    return <div className="text-center p-10 text-blue-600 text-xl">Loading holdings...</div>;
  }

  if (!holdings.length) {
    return (
      <div>
      <Navbar />
      <div className="flex items-center justify-center h-screen bg-white text-blue-600">
        <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h2 className="text-2xl font-semibold mb-2">No Stocks Present</h2>
          <p className="text-blue-400">Your portfolio is currently empty.</p>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Upstox Holdings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 shadow-md rounded-xl">
          <h2 className="text-lg font-semibold mb-2">Total Investment</h2>
          <p className="text-2xl text-blue-700">₹ {totalInvestment.toFixed(2)}</p>
        </div>

        <div className="bg-white p-4 shadow-md rounded-xl">
          <h2 className="text-lg font-semibold mb-2">Current Value</h2>
          <p className="text-2xl text-blue-700">₹ {currentValue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-4 shadow-md rounded-xl col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Holdings Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 shadow-md rounded-xl col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Market Value per Stock</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={holdings}>
              <XAxis dataKey="trading_symbol" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="market_value" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {holdings.map((holding, idx) => (
          <div key={idx} className="bg-white p-4 shadow-md rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="text-blue-600 w-5 h-5" />
              <h3 className="text-lg font-semibold">{holding.trading_symbol}</h3>
            </div>
            <p>Quantity: {holding.quantity}</p>
            <p>Avg. Price: ₹{holding.average_price}</p>
            <p>LTP: ₹{holding.ltp}</p>
            <p>Market Value: ₹{holding.market_value}</p>
            <p>PnL: ₹{holding.pnl}</p>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}