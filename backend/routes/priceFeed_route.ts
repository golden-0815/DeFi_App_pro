import express from 'express';
import { getPriceFeeds } from '../controllers/priceFeedController';
import { authMiddleware } from '../middleware/auth';
import { UserRequest } from '../types';

const router = express.Router();

// Debugging middleware
router.use((req, res, next) => {
  console.log(`[PriceFeed Route] ${req.method} request to ${req.url}`);
  console.log('[PriceFeed Route] Headers:', req.headers);
  next();
});

// Apply auth middleware
router.use((req, res, next) => {
  authMiddleware(req as UserRequest, res, next);
});

// Price feed route
router.get('/', async (req, res, next) => {
  try {
    await getPriceFeeds(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;