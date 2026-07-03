import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, PieChart, Brain, X, ChevronRight, LineChart, LogIn, UserPlus, Github, Twitter, Linkedin, Mail, User, UserCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Preloader from './Preloader';
import reg from '../assets/reg.jpg';
const LoginModal = ({ isOpen, onClose }) => {
     const navigate = useNavigate();

     if(isOpen && localStorage.getItem('token')){
          navigate("/appdetails");
     }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async(e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    toast.loading('Logging in...');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    toast.loading('Creating your account...');
    

      await axios.post('http://127.0.0.1:5000/api/login', {
        email,
        password
      })
          .then((response) => {
          toast.dismiss();
          toast.success('Login successful!');
          console.log('Login successful:', response.data);
          onClose();
          setEmail('');
          setPassword('');

          localStorage.setItem('token', response.data.user_id);

          setTimeout(() => {
               navigate("/appdetails");
          }, 1000);
          })

          .catch((error) => {
          toast.dismiss();
          toast.error('Invalid email or password. Please try again.');
          console.error('Error:', error);
          }
            );
    
  }
  

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
            <img src={reg} alt="" className='h-72 mx-auto' />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RegisterModal = ({ isOpen, onClose }) => {
     const navigate = useNavigate();

     if(isOpen && localStorage.getItem('token')){
          navigate("/appdetails");
     }

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!fullName || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    toast.loading('Creating your account...');
    
    try {
      await axios.post('http://127.0.0.1:5000/api/register', {
        fullName: fullName,
        email,
        password
      });
      
      toast.dismiss();
      toast.success('Account created successfully!');
      onClose();
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      toast.dismiss();
      toast.error('Error creating account. Please try again.');
      console.error('Error:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Your Account</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <img src={reg} alt="" className='h-72 mx-auto' />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Account
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function Homepage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: "Smart Portfolio Tracking",
      description: "Automatically track your investments across multiple platforms in real-time."
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Insights",
      description: "Get personalized investment recommendations using advanced AI algorithms."
    },
    {
      icon: <PieChart className="w-8 h-8 text-blue-600" />,
      title: "Jargon-Free Analysis",
      description: "Understand your investments with simple, clear explanations."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <Preloader onLoadingComplete={() => setLoading(false)} />
      
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <LineChart className="w-8 h-8 text-blue-600" />
              <span onClick={()=>window.location.href="/"} className="ml-2 cursor-pointer text-xl font-bold text-gray-900">
                InvestSmart
              </span>
            </div>
{!localStorage.getItem("token") && (
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="w-5 h-5 mr-1" />
                Login
              </button>
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => setShowRegisterModal(true)}
              >
                <UserPlus className="w-5 h-5 mr-1" />
                Register
              </button>
            </div>
)}
{localStorage.getItem("token") && (
            <div className="hidden md:flex items-center space-x-4">
              <UserCheck className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">Logged In</span>
              </div>
)}
              
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Smart Investing, Simplified
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Track, analyze, and execute your investments in one place. Let AI help you make smarter investment decisions.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 cursor-pointer"
              onClick={() => {
                setShowRegisterModal(true);
                toast.success("Let's get you started!");
              }}
            >
              Get Started
              <ChevronRight className="ml-2 w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="p-2 bg-blue-50 rounded-lg inline-block">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-500">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="mt-24 grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { number: "100K+", label: "Active Users" },
            { number: "5B+", label: "Assets Tracked" },
            { number: "99.9%", label: "Uptime" },
            { number: "24/7", label: "Support" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="text-3xl font-bold text-blue-600">
                {stat.number}
              </div>
              <div className="mt-2 text-gray-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <LineChart className="w-8 h-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">
                  InvestSmart
                </span>
              </div>
              <p className="text-gray-400">
                Making investment decisions simpler and smarter with AI-powered insights.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Company
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Connect
              </h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Github className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Linkedin className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Mail className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            © 2025 InvestSmart. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <RegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
    </div> 
     
  );
}

export default Homepage;