import { Request } from 'express';

export interface UserRequest extends Request {
  user?: {
    id: string;
    type: 'personal' | 'demo';
  };
}