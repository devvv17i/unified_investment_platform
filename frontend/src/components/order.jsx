import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000"; // Adjust this to your Flask backend URL

const OrderManagement = () => {
  const [formData, setFormData] = useState({
    variety: "",
    tradingsymbol: "",
    symboltoken: "",
    transactiontype: "",
    exchange: "",
    ordertype: "",
    producttype: "",
    duration: "",
    price: "",
    quantity: "",
    orderid: "",
  });
  const [response, setResponse] = useState(null);
  const [action, setAction] = useState("place"); // 'place', 'modify', or 'cancel'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let endpoint = "";
    let data = { ...formData };

    switch (action) {
      case "place":
        endpoint = "/place_order";
        delete data.orderid;
        break;
      case "modify":
        endpoint = "/modify_order";
        break;
      case "cancel":
        endpoint = "/cancel_order";
        data = { orderid: formData.orderid, variety: formData.variety };
        break;
      default:
        return;
    }

    try {
      const res = await axios.post(`${API_URL}${endpoint}`, data);
      setResponse(res.data);
    } catch (error) {
      setResponse({ status: "error", message: error.message });
    }
  };

  return (
    <div className="container">
      <h2>Order Management</h2>
      <div>
        <button onClick={() => setAction("place")}>Place Order</button>
        <button onClick={() => setAction("modify")}>Modify Order</button>
        <button onClick={() => setAction("cancel")}>Cancel Order</button>
      </div>
      <form onSubmit={handleSubmit}>
        {action !== "cancel" && (
          <>
            <label>Variety:</label>
            <input
              type="text"
              name="variety"
              value={formData.variety}
              onChange={handleChange}
              required
            />

            <label>Trading Symbol:</label>
            <input
              type="text"
              name="tradingsymbol"
              value={formData.tradingsymbol}
              onChange={handleChange}
              required
            />

            <label>Symbol Token:</label>
            <input
              type="text"
              name="symboltoken"
              value={formData.symboltoken}
              onChange={handleChange}
              required
            />

            <label>Transaction Type:</label>
            <select
              name="transactiontype"
              value={formData.transactiontype}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>

            <label>Exchange:</label>
            <input
              type="text"
              name="exchange"
              value={formData.exchange}
              onChange={handleChange}
              required
            />

            <label>Order Type:</label>
            <input
              type="text"
              name="ordertype"
              value={formData.ordertype}
              onChange={handleChange}
              required
            />

            <label>Product Type:</label>
            <input
              type="text"
              name="producttype"
              value={formData.producttype}
              onChange={handleChange}
              required
            />

            <label>Duration:</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
            />

            <label>Price:</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />

            <label>Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </>
        )}

        {(action === "modify" || action === "cancel") && (
          <>
            <label>Order ID:</label>
            <input
              type="text"
              name="orderid"
              value={formData.orderid}
              onChange={handleChange}
              required
            />
          </>
        )}

        <button type="submit">
          {action === "place" && "Place Order"}
          {action === "modify" && "Modify Order"}
          {action === "cancel" && "Cancel Order"}
        </button>
      </form>
      {response && (
        <div className="response">
          <strong>Status:</strong> {response.status}
          <br />
          {response.order_id && (
            <>
              <strong>Order ID:</strong> {response.order_id}
              <br />
            </>
          )}
          {response.message && (
            <>
              <strong>Message:</strong> {response.message}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
