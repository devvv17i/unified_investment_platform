const HoldingsTable = ({ data }) => {
  // Ensure data is an array before mapping
  console.log(data);
   if (!Array.isArray(data)) {
     console.error("Invalid data format:", data);
     return <div className="text-red-500">Error loading holdings data</div>;
   }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-2">Stock</th>
            <th className="pb-2">Quantity</th>
            <th className="pb-2">Current Price</th>
            <th className="pb-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding, index) => (
            <tr key={index} className="border-b">
              <td className="py-2">{holding.tradingsymbol}</td>
              <td className="py-2">{holding.quantity}</td>
              <td className="py-2">
                ₹{holding.currentPrice?.toFixed(2) || "N/A"}
              </td>
              <td className="py-2">
                ₹{(holding.quantity * (holding.currentPrice || 0)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {holdings.length === 0 && (
        <p className="text-gray-500 mt-2">No holdings found</p>
      )}
    </div>
  );
};

export default HoldingsTable;
