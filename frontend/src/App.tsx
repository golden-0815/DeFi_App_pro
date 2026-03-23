import React, { useState, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import Authentication from './components/Authentication';
import { WalletProvider } from './context/WalletContext';
import WalletLoading from './components/common/WalletLoading';

interface AuthData {
  token: string;
  accountType: 'personal' | 'demo';
}

const AppContent: React.FC = () => {
  const [auth, setAuth] = useState<AuthData | null>(() => {
    const token = localStorage.getItem('token');
    const accountType = localStorage.getItem('accountType') as 'personal' | 'demo';
    return token ? { token, accountType: accountType || 'personal' } : null;
  });
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (auth) {
      localStorage.setItem('token', auth.token);
      localStorage.setItem('accountType', auth.accountType);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('accountType');
    }
  }, [auth]);

  const handleAuthSuccess = (token: string, accountType: 'personal' | 'demo' = 'personal') => {
    setAuth({ token, accountType });
  };

  const handleLogout = () => {
    setAuth(null);
  };

  const handleError = (message: string) => {
    setError(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {auth ? (
        <>
          <Header 
            isAuthenticated={true} 
            onLogout={handleLogout}
            accountType={auth.accountType}
          />
          <MainContent />
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <Authentication 
            onAuthSuccess={handleAuthSuccess}
            onError={handleError}
          />
        </div>
      )}
      <Footer />

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
};

export default App;