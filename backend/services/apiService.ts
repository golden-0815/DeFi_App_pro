import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import rateLimit from 'axios-rate-limit';
import NodeCache from 'node-cache';
import { CoinData, CoinHistory } from './priceFeedService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables with fallbacks
const {
  API_BASE_URL = 'https://api.coingecko.com/api/v3',
  API_TIMEOUT = '10000',
  MAX_REQUESTS_PER_SECOND = '10',
  MAX_REQUESTS_PER_MINUTE = '50',
  MAX_RETRIES = '3',
  MIN_RETRY_DELAY = '1000',
  MAX_RETRY_DELAY = '30000',
  CACHE_DEFAULT_TTL = '60',
  CACHE_CHECK_PERIOD = '120',
  CACHE_TOP_COINS_TTL = '300',
  CACHE_COIN_HISTORY_TTL = '300'
} = process.env;

// Configure cache with different TTLs for different endpoints
const cache = new NodeCache({
  stdTTL: parseInt(CACHE_DEFAULT_TTL),
  checkperiod: parseInt(CACHE_CHECK_PERIOD),
  useClones: false,
});

// Configure axios with rate limiting
const http = rateLimit(axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(API_TIMEOUT),
}), {
  maxRequests: parseInt(MAX_REQUESTS_PER_SECOND),
  perMilliseconds: 1000,
});

interface ApiConfig extends AxiosRequestConfig {
  cacheKey?: string;
  cacheTTL?: number;
  bypassCache?: boolean;
}

// Custom retry logic with exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  retries: number = parseInt(MAX_RETRIES),
  minDelay: number = parseInt(MIN_RETRY_DELAY),
  maxDelay: number = parseInt(MAX_RETRY_DELAY)
): Promise<T> {
  let lastError: Error = new Error('Operation failed after maximum retries');
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error(String(error));
      }
      
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const delay = Math.min(
          Math.pow(2, attempt) * minDelay + Math.random() * 1000,
          maxDelay
        );
        
        console.log(
          `Attempt ${attempt + 1} failed. Retrying in ${delay}ms. ${retries - attempt - 1} retries left.`
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError;
}

class EnhancedApiService {
  private static instance: EnhancedApiService;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();

  private constructor() {
    // Reset request count every minute
    setInterval(() => {
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }, 60000);
  }

  static getInstance(): EnhancedApiService {
    if (!EnhancedApiService.instance) {
      EnhancedApiService.instance = new EnhancedApiService();
    }
    return EnhancedApiService.instance;
  }

  private async makeRequest<T>(config: ApiConfig): Promise<T> {
    // Check rate limits
    if (this.requestCount >= parseInt(MAX_REQUESTS_PER_MINUTE)) {
      const timeToWait = 60000 - (Date.now() - this.lastResetTime);
      throw new Error(`Rate limit exceeded. Please wait ${timeToWait}ms`);
    }

    // Check cache first
    if (config.cacheKey && !config.bypassCache) {
      const cachedData = cache.get<T>(config.cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const response = await retry(async () => {
      const result = await http.request<T>(config);
      this.requestCount++;
      
      // Cache successful response
      if (config.cacheKey && config.cacheTTL) {
        cache.set(config.cacheKey, result.data, Math.floor(config.cacheTTL));
      }
      
      return result.data;
    });

    return response;
  }

  async getTopCoins(count: number = 10): Promise<CoinData[]> {
    const cacheKey = `topCoins_${count}`;
    
    return this.makeRequest<CoinData[]>({
      method: 'GET',
      url: '/coins/markets',
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: count,
        page: 1,
        sparkline: false,
      },
      cacheKey,
      cacheTTL: parseInt(CACHE_TOP_COINS_TTL),
    });
  }

  async getCoinHistory(coinId: string, days: number = 1): Promise<CoinHistory> {
    const cacheKey = `coinHistory_${coinId}_${days}`;
    
    return this.makeRequest<CoinHistory>({
      method: 'GET',
      url: `/coins/${coinId}/market_chart`,
      params: {
        vs_currency: 'usd',
        days: days.toString(),
      },
      cacheKey,
      cacheTTL: parseInt(CACHE_COIN_HISTORY_TTL),
    });
  }

  clearCache(): void {
    cache.flushAll();
  }

  getCacheStats(): NodeCache.Stats {
    return cache.getStats();
  }
}

export const apiService = EnhancedApiService.getInstance();