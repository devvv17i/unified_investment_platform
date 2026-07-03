import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, BarChart, TrendingUp, ShoppingCart } from 'lucide-react';
import { Key, Shield, Lock, Fingerprint, AlertTriangle } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { toast, Toaster } from 'react-hot-toast';

const BuySell = () => {
  const navbarRef = useRef(null);

  const handleAppSelect = (app) => {
    toast.dismiss();
    toast.error("Market is currently closed. Trading will resume during regular market hours.");
  };

  const handleClickOutsideNavbar = (e) => {
    if (navbarRef.current && !navbarRef.current.contains(e.target)) {
      toast.dismiss();
      toast.error("Market is currently closed. Trading will resume during regular market hours.");
    }
  };

  useEffect(() => {
    window.addEventListener('click', handleClickOutsideNavbar);
    return () => {
      window.removeEventListener('click', handleClickOutsideNavbar);
    };
  }, []);

  const tradingApps = [
    {
      id: 'zerodha',
      name: 'Zerodha Kite',
      color: 'bg-emerald-500',
      icon: <Key className="w-8 h-8" />,
      description: 'Connect your Zerodha account to enable automated trading and portfolio tracking.',
      warning: 'This will allow read and trade access to your Zerodha account. Make sure to use App-Specific Password.',
    },
    {
      id: 'angelone',
      name: 'Angel One',
      color: 'bg-blue-500',
      icon: <Shield className="w-8 h-8" />,
      description: 'Link your Angel One account for seamless trading integration.',
      warning: 'Ensure you are using the Smart API credentials from your Angel One account.',
    },
    {
      id: 'upstox',
      name: 'Upstox Pro',
      color: 'bg-purple-500',
      icon: <Lock className="w-8 h-8" />,
      description: 'Connect Upstox Pro to access advanced trading features.',
      warning: 'Use the API credentials from your Upstox Developer Console.',
    },
    {
      id: 'fyers',
      name: 'Fyers',
      color: 'bg-rose-500',
      icon: <Fingerprint className="w-8 h-8" />,
      description: 'Integrate your Fyers account for comprehensive trading solutions.',
      warning: 'API access requires enabling API features from your Fyers account settings.',
    },
  ];

  return (
    <div>
      <Toaster />
      
      {/* Navbar with ref */}
      <div ref={navbarRef}>
        <Navbar />
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gray-200 bg-opacity-80 backdrop-blur-xl pointer-events-none" />
        
        <motion.div
          initial="hidden"
          animate="visible"
          className="min-h-screen bg-gray-200 text-blue-900 p-4 flex flex-col items-center relative"
        >
          <div className="w-full max-w-7xl mx-auto mt-8 filter">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex items-center gap-3 shadow-sm opacity-90">
              <AlertTriangle className="text-amber-500 w-6 h-6 flex-shrink-0" />
              <p className="text-amber-800 font-medium">Market is currently closed. Trading will resume during regular market hours.</p>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-700 pt-4 sm:text-4xl">
                Buy/Sell Stocks with Ease
              </h1>
              <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
                Connect your trading accounts to enable automated trading and portfolio tracking
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {tradingApps.map((app) => (
                <motion.div
                  key={app.id}
                  className="bg-white bg-opacity-80 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className={`${app.color} text-white p-6 rounded-t-xl opacity-85`}>
                    {app.icon}
                    <h3 className="mt-4 text-xl font-semibold">{app.name}</h3>
                    <p className="mt-2 text-sm opacity-90">{app.description}</p>
                  </div>
                  <div className="p-6 bg-white bg-opacity-70 rounded-b-xl">
                    <button
                      onClick={() => handleAppSelect(app)}
                      className="w-full bg-gray-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
                    >
                      Open
                      <ChevronRight size={18} />
                    </button>
                    <p className="mt-3 text-xs text-gray-500 leading-tight">{app.warning}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BuySell;
