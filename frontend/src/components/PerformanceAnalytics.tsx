import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, Brush, ReferenceLine } from 'recharts';
import { format, subMonths, parseISO, isAfter } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useWallet } from '../context/WalletContext';
import WalletPlaceholder from './common/WalletPlaceholder';
import { motion } from 'framer-motion';
import axios from 'axios';
import VisualData from '../assets/visual_data.svg';

interface PerformanceData {
  date: string;
  totalValue: number;
  dailyReturn: number;
}

interface NormalizedPerformanceData extends PerformanceData {
  normalizedValue: number;
}

interface BrushStartEndIndex {
  startIndex?: number;
  endIndex?: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down';
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PERFORMANCE_ENDPOINT = process.env.REACT_APP_PERFORMANCE_ENDPOINT;
const PERFORMANCE_UPDATE_ENDPOINT = process.env.REACT_APP_PERFORMANCE_UPDATE_ENDPOINT;
const DATA_REFRESH_INTERVAL = Number(process.env.REACT_APP_DATA_REFRESH_INTERVAL) || 300000; // Default to 5 minutes

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 p-4 md:p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg"
  >
    <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
    <div className="flex items-baseline justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base lg:text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">{value}%</p>
      </div>
      <span
        className={`text-xs md:text-sm font-medium flex-shrink-0 ml-2 ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        } flex items-center`}
      >
        {trend === 'up' ? (
          <ArrowUpIcon className="h-4 w-4 md:h-5 md:w-5 mr-1" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 md:h-5 md:w-5 mr-1" />
        )}
        {trend === 'up' ? 'Up' : 'Down'}
      </span>
    </div>
  </motion.div>
);

const PerformanceAnalytics: React.FC = () => {
  const { isWalletConnected, isUsingDemoWallet } = useWallet();
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [dateRange, setDateRange] = useState('6M');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showArea, setShowArea] = useState(true);
  const [showNormalizedData, setShowNormalizedData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = useCallback(async () => {
    if (!isWalletConnected && !isUsingDemoWallet) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<PerformanceData[]>(`${API_BASE_URL}${PERFORMANCE_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setError('Failed to fetch performance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isWalletConnected, isUsingDemoWallet]);

  const handleUpdateData = async () => {
    if (!isWalletConnected && !isUsingDemoWallet) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post(`${API_BASE_URL}${PERFORMANCE_UPDATE_ENDPOINT}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchPerformanceData();
    } catch (error) {
      console.error('Error updating performance data:', error);
      setError('Failed to update performance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isWalletConnected || isUsingDemoWallet) {
      fetchPerformanceData();
      const intervalId = setInterval(fetchPerformanceData, DATA_REFRESH_INTERVAL);
      return () => clearInterval(intervalId);
    } else {
      setPerformanceData([]);
      setIsLoading(false);
    }
  }, [isWalletConnected, isUsingDemoWallet, fetchPerformanceData]);

  const filteredData = useMemo(() => {
    const months = dateRange === '1Y' ? 12 : dateRange === '6M' ? 6 : dateRange === '3M' ? 3 : 36;
    const startDate = subMonths(new Date(), months);
    return performanceData.filter((d) => isAfter(parseISO(d.date), startDate));
  }, [performanceData, dateRange]);

  const normalizedData: NormalizedPerformanceData[] = useMemo(() => {
    if (filteredData.length === 0) return [];
    const startValue = filteredData[0].totalValue;
    return filteredData.map((item) => ({
      ...item,
      normalizedValue: (item.totalValue / startValue) * 100,
    }));
  }, [filteredData]);

  const calculatePerformanceMetrics = useCallback((data: PerformanceData[]) => {
    if (data.length < 2) return { portfolioReturn: 0, benchmarkReturn: 0, alpha: 0, sharpeRatio: 0 };

    const startValue = data[0].totalValue;
    const endValue = data[data.length - 1].totalValue;
    const portfolioReturn = ((endValue - startValue) / startValue) * 100;

    const benchmarkReturn = 0;
    const alpha = portfolioReturn - benchmarkReturn;

    const returns = data.slice(1).map((d, i) => (d.totalValue - data[i].totalValue) / data[i].totalValue);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252);

    return { portfolioReturn, benchmarkReturn, alpha, sharpeRatio };
  }, []);

  const { portfolioReturn, benchmarkReturn, alpha, sharpeRatio } = useMemo(
    () => calculatePerformanceMetrics(filteredData),
    [filteredData, calculatePerformanceMetrics]
  );

  const handleBrushChange = useCallback((newRange: BrushStartEndIndex) => {
    if (newRange && newRange.startIndex !== undefined && newRange.endIndex !== undefined && newRange.startIndex !== newRange.endIndex) {
      const startDate = filteredData[newRange.startIndex].date;
      const endDate = filteredData[newRange.endIndex].date;
      console.log(`Custom range selected: ${startDate} to ${endDate}`);
    }
  }, [filteredData]);

  if (!isWalletConnected && !isUsingDemoWallet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg"
      >
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col justify-center items-center text-center max-w-lg mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
                Performance Analytics
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Track and analyze your portfolio performance with detailed metrics and visualizations
              </p>
              <WalletPlaceholder
                title="Connect Wallet to View Performance"
                message="Please connect your wallet or use demo wallet to view your portfolio performance analytics and track your returns."
              />
            </div>
            <div className="hidden lg:flex justify-center items-center">
              <img
                src={VisualData}
                alt="Performance Analytics"
                className="w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isLoading && !performanceData.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 md:p-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-8">Performance Analytics</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-indigo-600"></div>
        </div>
      </motion.div>
    );
  }

  const chartData = showNormalizedData ? normalizedData : filteredData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 md:p-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">Performance Analytics</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUpdateData}
          disabled={isLoading}
          className={`px-4 py-2 rounded-full transition-all duration-300 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {isLoading ? 'Updating...' : 'Add Latest Data Point'}
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </motion.div>
      )}

      <div className="flex flex-wrap justify-between items-center mb-8">
        <div className="flex space-x-2 mb-4 md:mb-0 overflow-x-auto">
          {['3M', '6M', '1Y', 'All'].map((range) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 md:px-4 md:py-2 rounded-full transition-all duration-300 ${
                dateRange === range
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <MetricCard
          title="Portfolio Return"
          value={portfolioReturn.toFixed(2)}
          trend={portfolioReturn >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Benchmark Return"
          value={benchmarkReturn.toFixed(2)}
          trend={benchmarkReturn >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Alpha"
          value={alpha.toFixed(2)}
          trend={alpha >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={sharpeRatio.toFixed(2)}
          trend={sharpeRatio >= 1 ? 'up' : 'down'}
        />
      </div>

      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 w-full md:w-auto">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-indigo-600 rounded transition duration-150 ease-in-out"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
            />
            <span className="ml-2 text-sm md:text-base text-gray-700 dark:text-gray-300">Show Benchmark</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-indigo-600 rounded transition duration-150 ease-in-out"
              checked={showArea}
              onChange={(e) => setShowArea(e.target.checked)}
            />
            <span className="ml-2 text-sm md:text-base text-gray-700 dark:text-gray-300">Show Area</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-indigo-600 rounded transition duration-150 ease-in-out"
              checked={showNormalizedData}
              onChange={(e) => setShowNormalizedData(e.target.checked)}
            />
            <span className="ml-2 text-sm md:text-base text-gray-700 dark:text-gray-300">Show Normalized Data</span>
          </label>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4 md:p-6 rounded-xl shadow-inner">
        <ResponsiveContainer width="100%" height={window.innerWidth <= 768 ? 300 : 400}>
          <LineChart
            data={chartData}
            margin={window.innerWidth <= 768
              ? { top: 20, right: 10, left: -20, bottom: 20 }
              : { top: 20, right: 30, left: 20, bottom: 20 }
            }
          >
            <defs>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
              stroke="#718096"
              tick={{ fill: '#718096', fontSize: window.innerWidth <= 768 ? 10 : 12 }}
            />
            <YAxis
              domain={showNormalizedData ? [0, 'dataMax + 10'] : [0, 'dataMax + 1000']}
              stroke="#718096"
              tick={{ fill: '#718096', fontSize: window.innerWidth <= 768 ? 10 : 12 }}
              tickFormatter={(value) => {
                if (showNormalizedData) {
                  return `${value.toFixed(0)}%`;
                }

                if (window.innerWidth <= 768) {
                  if (value >= 1000000000) {
                    return `${(value / 1000000000).toFixed(1)}B`;
                  } else if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}k`;
                  }
                }
                return `$${value.toLocaleString()}`;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              labelStyle={{ color: '#4a5568', fontWeight: 'bold' }}
              labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
              formatter={(value: number, name: string) => [
                showNormalizedData ? `${value.toFixed(2)}%` : `$${value.toLocaleString()}`,
                name === 'totalValue' || name === 'normalizedValue' ? 'Portfolio Value' : 'Daily Return'
              ]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={10}
            />
            <Line
              type="monotone"
              dataKey={showNormalizedData ? "normalizedValue" : "totalValue"}
              name="Portfolio Value"
              stroke="#8884d8"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 8 }}
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="dailyReturn"
                name="Daily Return"
                stroke="#82ca9d"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 8 }}
              />
            )}
            {showArea && (
              <>
                <Area
                  type="monotone"
                  dataKey={showNormalizedData ? "normalizedValue" : "totalValue"}
                  fill="url(#colorPortfolio)"
                  fillOpacity={0.3}
                />
                {showBenchmark && (
                  <Area
                    type="monotone"
                    dataKey="dailyReturn"
                    fill="url(#colorBenchmark)"
                    fillOpacity={0.3}
                  />
                )}
              </>
            )}
            {chartData.length > 0 && (
              <ReferenceLine
                y={showNormalizedData ? 100 : chartData[0].totalValue}
                label={{
                  value: "Start",
                  position: 'insideLeft',
                  fill: '#e53e3e',
                  fontSize: window.innerWidth <= 768 ? 10 : 12
                }}
                stroke="#e53e3e"
                strokeDasharray="3 3"
              />
            )}
            <Brush
              dataKey="date"
              height={window.innerWidth <= 768 ? 20 : 30}
              stroke="#8884d8"
              fill="#f7fafc"
              travellerWidth={window.innerWidth <= 768 ? 8 : 10}
              onChange={handleBrushChange}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default PerformanceAnalytics;