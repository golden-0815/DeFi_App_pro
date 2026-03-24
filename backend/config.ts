import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

//Interface with all configuration options
interface Config {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  API_BASE_URL: string;
  API_TIMEOUT: number;
  MAX_REQUESTS_PER_SECOND: number;
  MAX_REQUESTS_PER_MINUTE: number;
  MAX_RETRIES: number;
  MIN_RETRY_DELAY: number;
  MAX_RETRY_DELAY: number;
  FRONTEND_URL: string;
  COINGECKO_CACHE_TTL: number;
  COINGECKO_REFRESH_INTERVAL: number;
  CACHE_DEFAULT_TTL: number;
  CACHE_CHECK_PERIOD: number;
  CACHE_TOP_COINS_TTL: number;
  CACHE_COIN_HISTORY_TTL: number;
}

// Load environment-specific .env file
const loadEnvFile = () => {
  const envFiles = {
    development: '.env.development',
    production: '.env'
  };

  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFile = envFiles[nodeEnv as keyof typeof envFiles];
  const envPath = path.resolve(__dirname, '..', envFile);

  if (!fs.existsSync(envPath)) {
    // Fallback to default .env if environment-specific file doesn't exist
    const defaultEnvPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(defaultEnvPath)) {
      throw new Error(`.env file not found! Please create one based on .env.example`);
    }
    dotenv.config({ path: defaultEnvPath });
  } else {
    dotenv.config({ path: envPath });
  }
};

loadEnvFile();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI', 
  'JWT_SECRET',
  'API_BASE_URL',
  'API_TIMEOUT'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Environment-specific configurations
const developmentConfig: Config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: 'development',
  MONGODB_URI: process.env.MONGODB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  API_BASE_URL: process.env.API_BASE_URL || 'https://api.coingecko.com/api/v3',
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '10000'),
  MAX_REQUESTS_PER_SECOND: parseInt(process.env.MAX_REQUESTS_PER_SECOND || '5'),
  MAX_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '50'),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  MIN_RETRY_DELAY: parseInt(process.env.MIN_RETRY_DELAY || '1000'),
  MAX_RETRY_DELAY: parseInt(process.env.MAX_RETRY_DELAY || '30000'),
  FRONTEND_URL: 'http://localhost:3000',
  COINGECKO_CACHE_TTL: parseInt(process.env.COINGECKO_CACHE_TTL || '60'),
  COINGECKO_REFRESH_INTERVAL: parseInt(process.env.COINGECKO_REFRESH_INTERVAL || '10000'),
  CACHE_DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL || '60'),
  CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '120'),
  CACHE_TOP_COINS_TTL: parseInt(process.env.CACHE_TOP_COINS_TTL || '300'),
  CACHE_COIN_HISTORY_TTL: parseInt(process.env.CACHE_COIN_HISTORY_TTL || '300')
};

const productionConfig: Config = {
  ...developmentConfig,
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://defi-dashboard-gold.vercel.app',
  // Override any production-specific values
  MAX_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '100'),
  CACHE_DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300'),
};

// Select configuration based on environment
export const config: Config = 
  process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig;

// Validate configuration
const validateConfig = (conf: Config) => {
  const requiredFields = ['MONGODB_URI', 'JWT_SECRET', 'API_BASE_URL'];
  const missingFields = requiredFields.filter(field => !conf[field as keyof Config]);
  
  if (missingFields.length > 0) {
    throw new Error(`Invalid configuration: Missing required values: ${missingFields.join(', ')}`);
  }
};

validateConfig(config);

// Safe logging in development environment
if (config.NODE_ENV === 'development') {
  const safeConfig = {
    ...config,
    JWT_SECRET: '[REDACTED]',
    MONGODB_URI: '[REDACTED]',
  };
}