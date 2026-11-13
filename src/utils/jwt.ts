import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { AppError } from './app-error.ts';

export function sign(userId: number): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

export function verify(token: string): { userId: number } {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (
      typeof payload === 'string' ||
      typeof payload.userId !== 'number' ||
      !Number.isInteger(payload.userId) ||
      payload.userId < 1 ||
      payload.userId > 2147483647 ||
      !Number.isFinite(payload.exp)
    ) {
      throw new Error('Invalid payload');
    }
    return { userId: payload.userId };
  } catch (error) {
    throw new AppError(401, error instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token');
  }
}
