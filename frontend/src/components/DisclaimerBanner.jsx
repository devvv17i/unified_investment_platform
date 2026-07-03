import React from 'react';

const DisclaimerBanner = () => {
  return (
    <div className="w-full overflow-hidden bg-red-100 text-gray-700 font-sans text-md py-2">
      <div className="inline-block whitespace-nowrap animate-marquee">
        <strong className="text-red-600">Disclaimer:</strong> Stock predictions on this website are for informational purposes only and do not constitute financial advice. Investing involves risk, and you should consult a qualified financial advisor before making decisions. We are not liable for any losses based on the use of this information.
      </div>
    </div>
  );
};

export default DisclaimerBanner;

// Tailwind CSS animation
const styles = `
@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.animate-marquee {
  animation: marquee 20s linear infinite; // Adjusted speed to 15 seconds
}
`;

// Create a style element and append it to the document head
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);