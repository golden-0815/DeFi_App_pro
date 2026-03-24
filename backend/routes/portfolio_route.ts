import express from 'express';
import { getPortfolio, updatePortfolio, addAsset, removeAsset } from '../controllers/portfolioController';
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

router.get('/', asyncHandler(getPortfolio));
router.put('/', asyncHandler(updatePortfolio));
router.post('/asset', asyncHandler(addAsset));
router.delete('/asset/:symbol', asyncHandler(removeAsset));

export default router;