import { apiService } from './apiService';
import { getCachedData, setCachedData } from '../cache';

const CACHE_KEY = 'priceFeeds';
const CACHE_TTL = 300; // 5 minutes

// Major 5 coins to be tracked
const MAJOR_COINS = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano'];

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image?: string;
}

export interface CoinHistory {
  prices: Array<[number, number]>;  // [timestamp, price]
}

export interface PriceFeedResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image?: string;
  priceHistory: Array<{ timestamp: number; price: number }>;
}

export const getPriceData = async (): Promise<PriceFeedResponse[]> => {
  try {
    console.log('[PriceFeedService] Checking cache');
    
    // Check cache first
    const cachedData = getCachedData<PriceFeedResponse[]>(CACHE_KEY);
    if (cachedData) {
      console.log('[PriceFeedService] Returning cached data');
      return cachedData;
    }

    console.log('[PriceFeedService] Fetching fresh data');
    
    // Get data for pre-defined top coins
    const allCoins = await apiService.getTopCoins(10);
    const selectedCoins = allCoins.filter(coin => MAJOR_COINS.includes(coin.id));

    // Transform the data and add demo history
    const transformedData = selectedCoins.map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      image: coin.image,
      priceHistory: generateDemoHistory(coin.current_price).map((price, index) => ({
        timestamp: Date.now() - (23 - index) * 3600000, // Last 24 hours
        price
      }))
    }));

    // Cache the results
    setCachedData(CACHE_KEY, transformedData, CACHE_TTL);
    console.log('[PriceFeedService] Data cached successfully');

    return transformedData;
  } catch (error) {
    console.error('[PriceFeedService] Error fetching price data:', error);
    throw error;
  }
};

// Generate demo price history data
const generateDemoHistory = (currentPrice: number): number[] => {
  const history = [];
  let price = currentPrice;
  
  // Generate 24 hours of demo data
  for (let i = 0; i < 24; i++) {
    // Add some random variation (-2% to +2%)
    const change = (Math.random() - 0.5) * 0.04;
    price = price * (1 + change);
    history.unshift(price);
  }
  
  return history;
};