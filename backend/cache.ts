import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 30,
  checkperiod: 60,
  useClones: false,
});

export const getCachedData = <T>(key: string): T | undefined => {
  //console.log(`[Cache] Attempting to get data for key: ${key}`);
  const data = cache.get<T>(key);
  //console.log(`[Cache] ${data ? 'Hit' : 'Miss'} for key: ${key}`);
  return data;
};

export const setCachedData = <T>(key: string, data: T, ttl: number = 30): void => {
  //console.log(`[Cache] Setting data for key: ${key}`);
  cache.set(key, data, Math.floor(ttl)); 
};

export const clearCache = (): void => {
  //console.log('[Cache] Clearing all cache');
  cache.flushAll();
};

export const getCacheStats = (): NodeCache.Stats => {
  return cache.getStats();
};

// Helper function to validate cache key
export const validateCacheKey = (key: string): boolean => {
  return typeof key === 'string' && key.length > 0;
};

// Helper function to check if key exists in cache
export const hasKey = (key: string): boolean => {
  return cache.has(key);
};

// Get multiple keys at once
export const getManyFromCache = <T>(keys: string[]): Record<string, T> => {
  return cache.mget<T>(keys);
};

// Delete specific key
export const deleteFromCache = (key: string): number => {
  return cache.del(key);
};