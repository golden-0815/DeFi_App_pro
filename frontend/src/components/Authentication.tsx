import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ShieldCheck, KeyRound } from 'lucide-react';
import BitcoinP2P from '../assets/bitcoin_p2p.svg';
import SecureLogin from '../assets/secure_login.svg';


// axios instance with default config
const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

interface AuthenticationProps {
  onAuthSuccess: (token: string, accountType?: 'personal' | 'demo') => void;
  onError: (message: string) => void;
}

const Authentication: React.FC<AuthenticationProps> = ({ onAuthSuccess, onError }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const baseUrl = process.env.REACT_APP_API_BASE_URL;

      if (!baseUrl) {
        throw new Error('API base URL not configured');
      }

      const response = await api.post(`${baseUrl}${endpoint}`, { 
        address, 
        password 
      });

      const { token, accountType } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('accountType', accountType || 'personal');
        onAuthSuccess(token, accountType || 'personal');
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Authentication failed. Please check your credentials and try again.';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);

    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;

      if (!baseUrl) {
        throw new Error('API base URL not configured');
      }

      const response = await api.post(`${baseUrl}/api/auth/login-demo`, {}, {
        timeout: 10000 // 10 second timeout
      });

      const { token, portfolio, performanceAnalytics } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('accountType', 'demo');
        
        if (portfolio) {
          localStorage.setItem('demoPortfolio', JSON.stringify(portfolio));
        }
        if (performanceAnalytics) {
          localStorage.setItem('demoAnalytics', JSON.stringify(performanceAnalytics));
        }

        onAuthSuccess(token, 'demo');
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Demo login failed. Please try again.';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Left Side - Illustration and Features */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <img
                src={isLogin ? SecureLogin : BitcoinP2P}
                alt={isLogin ? "Secure Login" : "Bitcoin P2P"}
                className="w-full h-auto max-w-md mx-auto"
              />
            </motion.div>
            <div className="space-y-4">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-3"
              >
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
                <span className="text-gray-600 dark:text-gray-300">
                  Enhanced security with blockchain technology
                </span>
              </motion.div>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-3"
              >
                <KeyRound className="h-6 w-6 text-indigo-600" />
                <span className="text-gray-600 dark:text-gray-300">
                  Secure wallet integration and management
                </span>
              </motion.div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {isLogin ? 'Welcome' : 'Create Account'}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isLogin 
                  ? 'Access your DeFi dashboard securely'
                  : 'Start your DeFi journey today'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wallet Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your wallet address"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </motion.button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                }`}
              >
                Try Demo Account
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Authentication;