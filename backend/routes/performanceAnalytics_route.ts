import express from 'express';
import { getPerformanceData, updatePerformanceData } from '../controllers/performanceAnalyticsController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply authMiddleware to all routes
router.use((req, res, next) => {
  authMiddleware(req, res, next);
});

// Helper function to handle async routes
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(getPerformanceData));
router.post('/update', asyncHandler(updatePerformanceData));

export default router;