import express from 'express';
import { register, login, loginDemo } from '../controllers/authController';

const router = express.Router();

// Helper function to handle async routes
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/login-demo', asyncHandler(loginDemo));

export default router;