import React from 'react';
import PortfolioOverview from './PortfolioOverview';
import PriceFeeds from './PriceFeeds';
import TransactionHistory from './TransactionHistory';
import PerformanceAnalytics from './PerformanceAnalytics';

const MainContent: React.FC = () => {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <PortfolioOverview />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <PerformanceAnalytics />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <PriceFeeds />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <TransactionHistory />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainContent;