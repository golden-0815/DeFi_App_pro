import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import portfolioRoutes from './routes/portfolio_route';
import priceFeedRoutes from './routes/priceFeed_route';
import transactionRoutes from './routes/transaction_route';
import authRoutes from './routes/auth_route';
import performanceAnalyticsRoutes from './routes/performanceAnalytics_route';
import { setupErrorHandling } from './middleware/errorHandler';

const app = express();

// Middleware logging
const loggerMiddleware = morgan((tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: `${tokens['response-time'](req, res)} ms`,
    timestamp: new Date().toISOString(),
    userAgent: tokens['user-agent'](req, res),
  });
});

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(15 * 60 / 60)
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS Configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.1.130:3000',
      'http://127.0.0.1:3000',
      'https://defi-dashboard-gold.vercel.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
};

app.options('*', cors(corsOptions));

// Additional headers middleware
const setCustomHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
  }
  
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.status(200).json({
      status: 'success',
      message: 'Preflight request successful'
    });
    return;
  }

  next();
};

// MongoDB connection handling for serverless environment
let cachedDb: typeof mongoose | null = null;

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    //console.log('[MongoDB] Using cached connection');
    return cachedDb;
  }

  try {
    if (config.NODE_ENV === 'development') {
      //console.log('[MongoDB] Attempting to connect to:', config.MONGODB_URI);
    }
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,  // Force IPv4
      maxPoolSize: 1,  
    };

    await mongoose.connect(config.MONGODB_URI, opts);
    cachedDb = mongoose;
    
    // Setup connection error handlers
    mongoose.connection.on('error', (error) => {
      console.error('[MongoDB] Connection error:', error);
      cachedDb = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[MongoDB] Disconnected');
      cachedDb = null;
    });
    
    console.log(`[MongoDB] Connected successfully in ${config.NODE_ENV} mode`);
    return cachedDb;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    cachedDb = null;
    throw error;
  }
};

// Basic Middleware Setup 
app.use(cors(corsOptions));
app.use(express.json());
app.use(loggerMiddleware);
app.disable('x-powered-by');
app.use(setCustomHeaders);

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// API Root
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'DeFi Dashboard API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      portfolio: '/api/portfolio',
      priceFeed: '/api/price-feed',
      transactions: '/api/transactions',
      performanceAnalytics: '/api/performance-analytics'
    }
  });
});

// Health check endpoint 
app.get('/health', async (req: Request, res: Response) => {
  try {
    await connectDB();
    
    const status = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      mongoReadyState: mongoose.connection.readyState,
      version: '1.0.0'
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      mongoConnection: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug middleware for test endpoints
app.use('/api/test/*', (req: Request, res: Response, next: NextFunction) => {
  console.log('[Debug] Test endpoint accessed:', {
    path: req.path,
    method: req.method,
    headers: req.headers
  });
  next();
});

// Test endpoint for development
app.get('/api/test/price-feed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    //console.log('[PriceFeed Test] Starting price feed test');
    const mockData = [
      {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        current_price: 68239,
        price_change_percentage_24h: 1.65071,
        market_cap: 1349344685657,
        total_volume: 22677042905,
        image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
        priceHistory: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          price: 68000 + Math.random() * 2000
        }))
      }
    ];

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: mockData
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/price-feed', priceFeedRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/performance-analytics', performanceAnalyticsRoutes);

// Setup error handling (should be last)
setupErrorHandling(app);

// Graceful shutdown handling for non-serverless environments
const gracefulShutdown = async () => {
  //console.log('[Server] Initiating graceful shutdown...');
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Only attach process handlers in non-serverless environment
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  
  // Start the server for development
  const startServer = async () => {
    try {
      await connectDB();
      const server = app.listen(config.PORT, () => {
        console.log(`[Server] Running on port ${config.PORT} in ${config.NODE_ENV} mode`);
      });

      // Error handling
      process.on('unhandledRejection', (error: Error) => {
        console.error('[Server] Unhandled Rejection:', error);
        server.close(() => {
          console.error('[Server] Shutting down due to unhandled rejection');
          process.exit(1);
        });
      });

      process.on('uncaughtException', (error: Error) => {
        console.error('[Server] Uncaught Exception:', error);
        server.close(() => {
          console.error('[Server] Shutting down due to uncaught exception');
          process.exit(1);
        });
      });

    } catch (error) {
      console.error('[Server] Failed to start:', error);
      process.exit(1);
    }
  };

  startServer();
}

// Export handler for serverless deployment
export default async function handler(req: Request, res: Response) {
  try {
    if (process.env.NODE_ENV === 'production') {
      await connectDB();
    }
    return app(req, res);
  } catch (error) {
    console.error('[Server] Error in handler:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}