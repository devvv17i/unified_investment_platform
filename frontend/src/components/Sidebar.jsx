import React from "react";
import {
  NewspaperIcon,
  IndianRupee,
  Columns2,
  FileBarChart,
  BarChart3,
  Calculator,
  UserRound,
  Lightbulb,
  Briefcase,
  ArrowUpRightSquare,
  ChartAreaIcon,
  Home,
  LineChart,
  Search,

  X,

  SearchCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ isOpen, onClose }) => {
  const sidebarVariants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  const menuItems = [
    { icon: UserRound, text: "Trading Accounts", path: "/appdetails" },
    { icon: NewspaperIcon, text: "Stock News", path: "/news" },
    { icon: IndianRupee, text: "Buy/Sell", path: "/buysell" },
    { icon: Columns2, text: "Compare", path: "/compare" },
    { icon: FileBarChart, text: "Paper Trading", path: "/papertrading" },
    { icon: ChartAreaIcon, text: "Comparison Chart", path: "/comparisonchart" },
    { icon: BarChart3, text: "Portfolio", path: "/dashboard" },
    { icon: Search, text: "Search For Stocks", path: "/stockanalysis" },
    { icon: Lightbulb, text: "Recommendations", path: "/recommendations" }, // Added based on your routes
    { icon: LineChart, text: "Investor Behavior", path: "/investor_behavior" }, // Added based on your routes
    { icon: Home, text: "Home", path: "/" }, // Added based on your routes
    { icon: SearchCheck, text: "Ticker Finder", path: "/search" }, // Added based on your routes
];


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="p-4 flex justify-between items-center border-b border-blue-200">
              <h2 className="text-xl font-semibold text-blue-800">Menu</h2>
              <button
                onClick={onClose}
                className="text-blue-500 hover:text-blue-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4">
              {menuItems.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.path}
                  className="flex items-center space-x-2 p-3 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors duration-200"
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                >
                  <item.icon className="w-5 h-5 text-blue-500" />
                  <span>{item.text}</span>
                </motion.a>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;