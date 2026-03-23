import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  isWalletConnected: boolean;
  isUsingDemoWallet: boolean;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  useDemoWallet: () => void;
  disconnectWallet: () => void;
  accountType: 'personal' | 'demo' | null;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Constants for localStorage keys
const WALLET_STORAGE_KEYS = {
  CONNECTED: 'walletConnected',
  ADDRESS: 'walletAddress',
  DEMO: 'isDemoWallet',
  ACCOUNT_TYPE: 'accountType'
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isUsingDemoWallet, setIsUsingDemoWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'personal' | 'demo' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const disconnectWalletRef = useRef(() => {
    setIsWalletConnected(false);
    setIsUsingDemoWallet(false);
    setWalletAddress(null);
    setAccountType(null);
    setError(null);
    
    Object.values(WALLET_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  });

  const getProvider = useCallback(() => {
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  }, []);

  const initializeDemoWallet = useCallback(() => {
    const demoAddress = process.env.REACT_APP_DEMO_WALLET_ADDRESS || '0xDEMO1234567890DeFiDashboardDemo1234567890';
    
    setIsUsingDemoWallet(true);
    setWalletAddress(demoAddress);
    setIsWalletConnected(false);
    setAccountType('demo');

    localStorage.setItem(WALLET_STORAGE_KEYS.DEMO, 'true');
    localStorage.setItem(WALLET_STORAGE_KEYS.ADDRESS, demoAddress);
    localStorage.setItem(WALLET_STORAGE_KEYS.ACCOUNT_TYPE, 'demo');
  }, []);

  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWalletRef.current();
    } else {
      const provider = getProvider();
      if (provider) {
        try {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setWalletAddress(address);
          setIsWalletConnected(true);
          setIsUsingDemoWallet(false);
          localStorage.setItem(WALLET_STORAGE_KEYS.CONNECTED, 'true');
          localStorage.setItem(WALLET_STORAGE_KEYS.ADDRESS, address);
          setAccountType('personal');
          localStorage.setItem(WALLET_STORAGE_KEYS.ACCOUNT_TYPE, 'personal');
        } catch (error) {
          console.error('Error updating wallet address:', error);
          disconnectWalletRef.current();
        }
      }
    }
  }, [getProvider]);

  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  // Initialize wallet state
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const storedWalletConnected = localStorage.getItem(WALLET_STORAGE_KEYS.CONNECTED);
        const storedDemoWallet = localStorage.getItem(WALLET_STORAGE_KEYS.DEMO);
        const storedAccountType = localStorage.getItem(WALLET_STORAGE_KEYS.ACCOUNT_TYPE) as 'personal' | 'demo' | null;

        setAccountType(storedAccountType);

        if (storedDemoWallet === 'true') {
          initializeDemoWallet();
          setIsLoading(false);
          return;
        }

        if (storedWalletConnected === 'true' && window.ethereum) {
          const provider = getProvider();
          if (provider) {
            const accounts = await provider.send("eth_accounts", []);
            if (accounts.length > 0) {
              const signer = await provider.getSigner();
              const address = await signer.getAddress();
              setWalletAddress(address);
              setIsWalletConnected(true);
              setIsUsingDemoWallet(false);
            } else {
              disconnectWalletRef.current();
            }
          }
        }
      } catch (error) {
        console.error('Error initializing wallet:', error);
        disconnectWalletRef.current();
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, [getProvider, initializeDemoWallet]);

  // Set up event listeners
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', disconnectWalletRef.current);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
        window.ethereum?.removeListener('disconnect', disconnectWalletRef.current);
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to connect a wallet');
      throw new Error('Please install MetaMask to connect a wallet');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const provider = getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setWalletAddress(address);
        setIsWalletConnected(true);
        setIsUsingDemoWallet(false);
        setAccountType('personal');

        localStorage.setItem(WALLET_STORAGE_KEYS.CONNECTED, 'true');
        localStorage.setItem(WALLET_STORAGE_KEYS.ADDRESS, address);
        localStorage.setItem(WALLET_STORAGE_KEYS.ACCOUNT_TYPE, 'personal');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoWallet = useCallback(() => {
    initializeDemoWallet();
  }, [initializeDemoWallet]);

  const value = {
    isWalletConnected,
    isUsingDemoWallet,
    walletAddress,
    connectWallet,
    useDemoWallet,
    disconnectWallet: disconnectWalletRef.current,
    accountType,
    isLoading,
    error
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};