import 'express';
import type { JwtPayload } from '../utils/jwt.ts';

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
