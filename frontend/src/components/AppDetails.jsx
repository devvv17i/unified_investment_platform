import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Key, Lock, Fingerprint, Shield, ChevronRight, GitBranch } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


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
  {
    id: 'motilal',
    name: 'Motilal Oswal',
    color: 'bg-amber-500',
    icon: <GitBranch className="w-8 h-8" />,
    description: 'Connect your Motilal Oswal account for enhanced trading capabilities.',
    warning: 'Ensure you have the required permissions enabled for API access.',
  }
];


const UpstoxAuthorizationInputModal = ({ app, isOpen, onClose }) => {
     const [authCode, setAuthCode] = useState('');
     const navigate = useNavigate();

     const handleGenerateAccessToken = async (e) => {
          e.preventDefault();

          await axios.post("http://127.0.0.1:5000/upstox/callback", {
               "code": authCode,
               "client_id": localStorage.getItem('upstox_api_key'),
               "client_secret": localStorage.getItem('upstox_client_id'),
          })
          .then((response) => {
               console.log(response.data);
               toast.success("Successfully connected to Upstox Pro!");
               localStorage.setItem('upstox_access_token', response.data.access_token);
               setAuthCode("");
               
               navigate("/upstox_holdings")
               onClose();
          })
          .catch((error) => {
               console.error(error);
               toast.error("Failed to connect to Upstox Pro. Please try again.");
          });
     };

     return (
          <AnimatePresence>
               {isOpen && (
                    <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                         onClick={onClose}
                    >
                         <motion.div
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.95, opacity: 0 }}
                              className="bg-white rounded-xl shadow-xl max-w-lg w-full"
                              onClick={e => e.stopPropagation()}
                         >
                              <div className={`${app.color} text-white p-6 rounded-t-xl flex items-start justify-between`}>
                                   <div>
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                             {app.icon}
                                             {app.name}
                                        </h2>
                                        <p className="mt-2 opacity-90">{app.description}</p>
                                   </div>
                                   <button onClick={onClose} className="text-white/80 hover:text-white">
                                        <X size={24} />
                                   </button>
                              </div>

                              <div className="p-6">
                                   <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                             <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                             <p className="text-amber-700 text-sm">You will be redirected to Unstop page. After entering your password, copy code from url of callback page!</p>
                                        </div>
                                   </div>
                                   <form className="space-y-4">
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">
                                                  Authorization Code
                                             </label>
                                             <input
                                                  type="text"
                                                  value={authCode}
                                                  onChange={e => setAuthCode(e.target.value)}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                  placeholder="Enter your authorization code"
                                             />
                                        </div>

                                        <button
                                             onClick={handleGenerateAccessToken}
                                             type="submit"
                                             className={`w-full ${app.color} text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                                        >
                                             Generate Access Token
                                             <ChevronRight size={18} />
                                        </button>
                                   </form>
                              </div>
                         </motion.div>
                    </motion.div>
               )}
          </AnimatePresence>
     );
};


const CredentialsModal = ({ app, isOpen, onClose, onUpstoxAuth }) => {
  const [credentials, setCredentials] = useState({
    api_key: '',
    client_id: '',
    password: '',
    totp_secret: '',
  });

  const handleUpstoxLogin = async(e) => {
     e.preventDefault();

     // Store credentials for later use in the authorization modal
     if (app.name === "Upstox Pro") {
       localStorage.setItem('upstox_api_key', credentials.api_key);
       localStorage.setItem('upstox_client_id', credentials.client_id);
     }

     await axios.post("http://127.0.0.1:5000/upstox/login", {
          "client_id": credentials.api_key,
     })
     .then((response) => {
          console.log(response.data);
          toast.success("Successfully initiated Upstox Pro connection!");
          window.open(response.data.auth_url, "_blank");
          
          // Close this modal and open the authorization modal
          onClose();
          if (app.name === "Upstox Pro") {
            onUpstoxAuth();
          }
          
          // Reset form
          setCredentials({
               api_key: "",
               client_id: "",
               password: "",
               totp_secret: "",
          });
     })
     .catch((error) => {
          console.error(error);
          toast.error("Failed to connect to Upstox Pro. Please try again.");
     });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (app.name === "Upstox Pro") {
      handleUpstoxLogin(e);
    } else if (app.name === "Angel One") {
      // Handle Angel One connection
      onClose();
      toast.success("Successfully connected to Angel One!");
      navigate("/dashboard");
    } else {
      // Handle other apps
      toast.success(`Successfully connected to ${app.name}!`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className={`${app.color} text-white p-6 rounded-t-xl flex items-start justify-between`}>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {app.icon}
                  {app.name}
                </h2>
                <p className="mt-2 opacity-90">{app.description}</p>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-sm">{app.warning}</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={credentials.api_key}
                    onChange={e => setCredentials(prev => ({ ...prev, api_key: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your API key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {app.name === "Upstox Pro" ? "API Secret" : "Client ID"}
                  </label>
                  <input
                    type="text"
                    value={credentials.client_id}
                    onChange={e => setCredentials(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`${app.name === "Upstox Pro" ? "Enter your API Secret" : "Enter your Client ID"}`}
                  />
                </div>
                
                {!(app.name === "Upstox Pro") && (
                  <div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={credentials.password}
                        onChange={e => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TOTP Secret
                      </label>
                      <input
                        type="text"
                        value={credentials.totp_secret}
                        onChange={e => setCredentials(prev => ({ ...prev, totp_secret: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your TOTP secret"
                      />
                    </div> 
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full ${app.color} text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                >
                  Connect {app.name}
                  <ChevronRight size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function AppDetails() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const handleAppSelect = (app) => {
    setSelectedApp(app);
    
    if(app.name === "Angel One") {
      navigate("/dashboard");
    }
  };

  const handleUpstoxAuthModalOpen = () => {
    setSelectedApp(tradingApps.find(app => app.id === 'upstox'));
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <Navbar />

      <p className='text-center mt-8 text-orange-400 text-xl cursor-pointer'>Manually Upload Stocks?</p>
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 pt-12 sm:text-4xl">
            Trading Accounts
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Connect your trading accounts to enable automated trading and portfolio tracking
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tradingApps.map((app) => (
            <motion.div
              key={app.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`${app.color} text-white p-6 rounded-t-xl`}>
                {app.icon}
                <h3 className="mt-4 text-xl font-semibold">{app.name}</h3>
                <p className="mt-2 text-sm opacity-90">{app.description}</p>
              </div>
              <div className="p-6 bg-white rounded-b-xl">
                <button
                  onClick={() => handleAppSelect(app)}
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Configure
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* First modal: Credentials */}
      {selectedApp && !showAuthModal && (
        <CredentialsModal
          app={selectedApp}
          isOpen={!!selectedApp && !showAuthModal}
          onClose={() => setSelectedApp(null)}
          onUpstoxAuth={handleUpstoxAuthModalOpen}
        />
      )}

      {/* Second modal: Authorization code for Upstox */}
      {showAuthModal && (
        <UpstoxAuthorizationInputModal
          app={selectedApp}
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
}

export default AppDetails;