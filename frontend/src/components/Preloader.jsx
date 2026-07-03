import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Preloader = ({ onLoadingComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (onLoadingComplete) onLoadingComplete();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [onLoadingComplete]);
  
  if (!isLoading) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-white flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: isLoading ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center w-full h-full">
        {/* Background grid lines - full screen */}
        <div className="absolute inset-0 bg-gray-50">
          {/* Horizontal grid lines */}
          {[...Array(10)].map((_, i) => (
            <div 
              key={`h-${i}`} 
              className="absolute w-full h-px bg-gray-200" 
              style={{ top: `${(i + 1) * 10}%` }}
            ></div>
          ))}
          
          {/* Vertical grid lines */}
          {[...Array(10)].map((_, i) => (
            <div 
              key={`v-${i}`} 
              className="absolute h-full w-px bg-gray-200" 
              style={{ left: `${(i + 1) * 10}%` }}
            ></div>
          ))}
        </div>
        
        {/* Centered graph with animation */}
        <div className="h-full w-full flex items-center justify-center">
          <div className="relative h-64 w-full max-w-4xl">
            {/* Graph line animation */}
            <motion.svg 
              viewBox="0 0 100 40" 
              className="w-full h-full"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                stroke="#3B82F6"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                d="M 0,40 Q 10,35 20,30 Q 30,25 40,20 Q 50,15 60,25 Q 70,35 80,10 Q 90,5 100,2"
              />
              
              {/* Data points */}
              {[
                { cx: 0, cy: 40, delay: 0 },
                { cx: 20, cy: 30, delay: 0.2 },
                { cx: 40, cy: 20, delay: 0.4 },
                { cx: 60, cy: 25, delay: 0.6 },
                { cx: 80, cy: 10, delay: 0.8 },
                { cx: 100, cy: 2, delay: 1 }
              ].map((point, index) => (
                <motion.circle
                  key={index}
                  cx={point.cx} 
                  cy={point.cy} 
                  r="1.5"
                  fill="#3B82F6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: point.delay, duration: 0.2 }}
                />
              ))}
            </motion.svg>
          </div>
        </div>
        
        {/* Logo and title at the center */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl font-bold text-gray-900 flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className='mb-32'>InvestSmart</span>
          
        </motion.div>
        
        {/* Small loading indicator at the bottom */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading your financial dashboard...
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Preloader;