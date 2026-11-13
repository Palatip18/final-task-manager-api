import type { Request, RequestHandler } from 'express';
import { AppError } from '../utils/app-error.ts';
import { verify } from '../utils/jwt.ts';

export const authenticate: RequestHandler = (req, res, next) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') ?? '');
  if (!match) throw new AppError(401, 'Authentication required');
  req.user = verify(match[1]);
  next();
};

export function getAuthUser(req: Request): { userId: number } {
  if (!req.user) throw new AppError(401, 'Authentication required');
  return req.user;
}
