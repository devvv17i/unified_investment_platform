import React from "react";

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div
      className="my-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm"
      role="alert"
    >
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default ErrorMessage;