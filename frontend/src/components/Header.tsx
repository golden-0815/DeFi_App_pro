import React, { useState, useRef, useEffect } from 'react';
import { MoonIcon, SunIcon, BellIcon, Bars3Icon, ArrowRightOnRectangleIcon, WalletIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Transition } from '@headlessui/react';
import { Snackbar, Alert } from '@mui/material';
import { useWallet } from '../context/WalletContext';
import logoImage from '../assets/defi_logo.png';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  accountType: 'personal' | 'demo';
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout, accountType }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const {
    isWalletConnected,
    isUsingDemoWallet,
    walletAddress,
    connectWallet,
    useDemoWallet,
    disconnectWallet
  } = useWallet();

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setSnackbarOpen(true);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const WalletButton = () => (
    (isWalletConnected || isUsingDemoWallet) ? (
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
        <WalletIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {formatAddress(walletAddress!)}
        </span>
        <button
          onClick={disconnectWallet}
          className="ml-2 px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-full transition duration-150 ease-in-out flex items-center"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Disconnect
        </button>
      </div>
    ) : (
      <div className="flex space-x-2">
        <button
          onClick={handleConnectWallet}
          className="px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out flex items-center"
        >
          <WalletIcon className="h-5 w-5 mr-2" />
          Connect Wallet
        </button>
        {accountType === 'demo' && (
          <button
            onClick={useDemoWallet}
            className="px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
          >
            Use Demo Wallet
          </button>
        )}
      </div>
    )
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center py-4">
          <div className="flex items-center">
            <img 
              className="h-16 w-auto mr-4 rounded-xl shadow-md border-2 border-gray-100 dark:border-gray-700" 
              src={logoImage} 
              alt="Defi Dashboard" 
            />
            <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Defi Dashboard
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && <WalletButton />}

            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6" />
            </button>
            
            <button
              onClick={toggleDarkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>

            {isAuthenticated && (
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex justify-between items-center py-4">
          <div className="flex items-center">
            <img 
              className="h-16 w-auto mr-4 rounded-xl shadow-md border-2 border-gray-100 dark:border-gray-700" 
              src={logoImage} 
              alt="Dashboard" 
            />
            <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Defi Dashboard
            </span>
          </div>

          <button
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <Transition
        show={mobileMenuOpen}
        enter="transition-all duration-300 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition-all duration-200 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div 
          ref={mobileMenuRef}
          className="md:hidden fixed inset-0 top-[98px] z-50 overflow-y-auto bg-white dark:bg-gray-900 shadow-lg"
        >
          <div className="px-4 py-6 space-y-6">
            {isAuthenticated && (
              <div className="space-y-4">
                {(isWalletConnected || isUsingDemoWallet) ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <WalletIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatAddress(walletAddress!)}
                        </span>
                      </div>
                      <button
                        onClick={disconnectWallet}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-full transition duration-150 ease-in-out flex items-center shadow-sm"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleConnectWallet}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 active:from-blue-700 active:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out flex items-center justify-center shadow-sm"
                    >
                      <WalletIcon className="h-5 w-5 mr-2" />
                      Connect Wallet
                    </button>
                    {accountType === 'demo' && (
                      <button
                        onClick={useDemoWallet}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 active:from-green-700 active:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out shadow-sm"
                      >
                        Use Demo Wallet
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <button
                className="flex items-center w-full px-4 py-3 text-sm text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                <span>Notifications</span>
              </button>

              <button
                onClick={toggleDarkMode}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <>
                    <SunIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {isAuthenticated && (
                <button
                  onClick={onLogout}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Transition>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </header>
  );
};

export default Header;