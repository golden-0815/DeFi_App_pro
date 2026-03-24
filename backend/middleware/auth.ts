import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRequest } from '../types';

interface DecodedToken {
  user: {
    id: string;
    type: 'personal' | 'demo';
  };
  iat: number;
  exp: number;
}

export const authMiddleware = (req: UserRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as DecodedToken;

    if (!decoded.user || !decoded.user.id || !decoded.user.type) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    req.user = {
      id: decoded.user.id,
      type: decoded.user.type
    };

    next();
  } catch (err) {
    console.error('Error decoding token:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};