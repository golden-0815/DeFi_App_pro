import NodeCache from 'node-cache';
import { sleep } from './helpers';

export class RateLimiter {
  private cache: NodeCache;
  private readonly maxRequests = 30; 
  private readonly windowMs = 60000; 
  private readonly minInterval = 2000; 
  private lastRequestTime = 0;
  private retryQueue: Map<string, number> = new Map();

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 60,
      checkperiod: 120,
      useClones: false
    });
  }

  async checkRateLimit(key: string = 'global'): Promise<void> {
    const now = Date.now();
    const requests = this.cache.get<number>(key) || 0;
    const timeSinceLastRequest = now - this.lastRequestTime;
    const retryAfter = this.retryQueue.get(key);

    // Check if it's in retry period
    if (retryAfter && now < retryAfter) {
      const waitTime = retryAfter - now;
      throw new Error(`rate limit exceeded:${Math.ceil(waitTime / 1000)}`);
    }

    // Enforce minimum interval between requests
    if (timeSinceLastRequest < this.minInterval) {
      await sleep(this.minInterval - timeSinceLastRequest);
    }

    // Check if the rate limit is reached
    if (requests >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.lastRequestTime);
      this.retryQueue.set(key, now + waitTime);
      console.log(`Rate limit reached for ${key}. Waiting ${waitTime}ms`);
      throw new Error(`rate limit exceeded:${Math.ceil(waitTime / 1000)}`);
    }

    // Update counters
    this.cache.set(key, requests + 1);
    this.lastRequestTime = now;

    // Reset counter after window
    setTimeout(() => {
      this.cache.set(key, 0);
      this.retryQueue.delete(key);
    }, this.windowMs);
  }

  getRequestCount(key: string = 'global'): number {
    return this.cache.get<number>(key) || 0;
  }
}

export const globalRateLimiter = new RateLimiter();