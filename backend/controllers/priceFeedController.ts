import { Request, Response } from 'express';
import { getPriceData } from '../services/priceFeedService';
import { getCachedData, setCachedData } from '../cache';
import { globalRateLimiter } from '../utils/rateLimiter';

const CACHE_KEY = 'priceFeeds';
const CACHE_TTL = 300; // 5 minutes

export const getPriceFeeds = async (req: Request, res: Response) => {
  try {
    //console.log('[PriceFeedController] Starting price feed request');
    
    // Check cache first
    const cachedData = getCachedData(CACHE_KEY);
    if (cachedData) {
      //console.log('[PriceFeedController] Returning cached data');
      return res.json(cachedData);
    }

    // Check rate limit
    await globalRateLimiter.checkRateLimit();
    
    //console.log('[PriceFeedController] Fetching fresh price data');
    
    const priceFeeds = await getPriceData();
    
    // Cache the result
    setCachedData(CACHE_KEY, priceFeeds, CACHE_TTL);
    //console.log('[PriceFeedController] Data cached successfully');

    res.json(priceFeeds);
  } catch (error: any) {
    console.error('[PriceFeedController] Error:', error);
    
    if (error.message?.includes('rate limit')) {
      const retryAfter = parseInt(error.message.split(':')[1]) || 60;
      return res.status(429).json({ 
        message: 'Rate limit exceeded',
        retryAfter 
      });
    }

    res.status(500).json({ message: 'Error fetching price feeds' });
  }
};