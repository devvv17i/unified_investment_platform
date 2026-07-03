// utils.js
export const formatCurrency = (value) => {
     return new Intl.NumberFormat("en-IN", {
       style: "currency",
       currency: "INR",
     }).format(value);
   };
   
   export const formatPercentage = (value) => {
     return (value > 0 ? "+" : "") + value.toFixed(2) + "%";
   };