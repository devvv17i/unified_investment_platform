import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Search, PlusCircle, RefreshCw, X, ArrowRight, DollarSign, Briefcase, IndianRupee } from 'lucide-react';
import DisclaimerBanner from './DisclaimerBanner';
import Navbar from './Navbar';

const Recommendations = () => {
  const [userStocks, setUserStocks] = useState(['AAPL', 'MSFT', 'JPM']);
  const [inputStock, setInputStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
     const us = localStorage.getItem('stocksData');
     if (us) {
       try {
         const parsedStocks = JSON.parse(us);
         const tickers = parsedStocks.map(stock => stock.Ticker);
         setUserStocks(tickers);
       } catch (error) {
         console.error('Error parsing stocksData from localStorage:', error);
       }
     }
   }, []);
  // Sample performance data for visualization
 

  const getRecommendations = async () => {
    setLoading(true);
    setError(null);
    setRecommendations(null);
    
    try {
      // This would be your actual API endpoint
      const response = await fetch('http://127.0.0.1:5000/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stocks: userStocks }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(`Failed to get recommendations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const stockTagColors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-800',
    'bg-cyan-100 text-cyan-800',
  ];

  return (
     <div>
          <Navbar />
    <div className="bg-gradient-to-br from-white to-blue-50 min-h-screen p-8">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.h1 
            className="text-3xl font-bold text-blue-800 mb-2 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
          >
            <TrendingUp className="mr-2" /> Stock Recommendations 📈
          </motion.h1>
          <p className="text-blue-600">Discover better-performing alternatives to your current stock holdings</p>
        </motion.div>

        {/* User's Current Stocks */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6 mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center mb-4">
            <Briefcase className="mr-2 text-blue-700" />
            <h2 className="text-xl font-semibold text-blue-800">Your Portfolio</h2>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {userStocks.map((stock, index) => (
              <motion.div 
                key={stock}
                className={`px-3 py-2 rounded-full ${stockTagColors[index % stockTagColors.length]} font-medium flex items-center`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IndianRupee size={16} className="mr-1" />
                {stock}
              </motion.div>
            ))}
          </div>
          
          <div className="text-sm text-gray-600 italic">
            These are the stocks we'll find better alternatives for
          </div>
        </motion.div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={getRecommendations}
          disabled={userStocks.length === 0 || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center shadow-md mb-6"
        >
          {loading ? (
            <>
              <RefreshCw size={20} className="mr-2 animate-spin" />
              Finding Better Stocks...
            </>
          ) : (
            <>
              <Search size={20} className="mr-2" />
              Get Recommendations
            </>
          )}
        </motion.button>

        {/* Error Message */}
        {error && (
          <motion.div 
            className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-8"
            variants={itemVariants}
          >
            <div className="font-medium">Error</div>
            <div>{error}</div>
          </motion.div>
        )}

        {/* Results Section */}
        {recommendations && (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Recommendations ✨</h2>
            
            {recommendations.recommendations ? (
              recommendations.recommendations.map((item, index) => (
                <motion.div 
                  key={item.original_stock}
                  className="border-t border-blue-100 pt-4 mt-4 first:border-t-0 first:mt-0 first:pt-0"
                  variants={itemVariants}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">{item.original_stock}</h3>
                      <p className="text-blue-600">{item.sector}</p>
                    </div>
                  </div>

                  {item.alternatives.map(alt => (
                    <motion.div 
                      key={alt.symbol}
                      className="mt-4 bg-blue-50 p-4 rounded-lg"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center mb-2">
                        <ArrowRight size={18} className="text-blue-500 mr-2" />
                        <h3 className="font-medium text-lg text-blue-700">
                          {alt.symbol} <span className="font-normal text-blue-600 text-sm">({alt.name})</span>
                        </h3>
                      </div>
                      
                      <p className="text-gray-700 mb-3">
                        <span className="text-blue-600">💡 Why it's better:</span> {alt.rationale}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {Object.entries(alt.key_metrics).map(([key, value]) => (
                          <div key={key} className="bg-white p-2 rounded">
                            <div className="text-sm text-blue-600">{key}</div>
                            <div className="font-medium">{value}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ))
            ) : (
              <div className="text-gray-600">No recommendations available or invalid format received.</div>
            )}
          </motion.div>
        )}

        {/* Footer */}
      </motion.div>
    </div>
        <DisclaimerBanner />
    </div>
  );
};

export default Recommendations;