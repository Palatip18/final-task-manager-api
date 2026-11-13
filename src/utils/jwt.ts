import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';

export type JwtPayload = {
  userId: number;
  exp: number;
};

export const sign = (payload: { userId: number }): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
};

export const verify = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
};
