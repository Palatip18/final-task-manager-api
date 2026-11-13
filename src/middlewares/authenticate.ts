import type { Request, RequestHandler } from 'express';
import { AppError } from '../utils/app-error.ts';
import { verify } from '../utils/jwt.ts';
import { jwtPayloadSchema } from '../schemas/auth.schema.ts';

export const authenticate: RequestHandler = (req: Request, res, next) => {
  const [bearer, token] = req.headers.authorization?.split(' ') ?? [];
  if (bearer !== 'Bearer' || !token) {
    throw new AppError(
      401,
      'INVALID_AUTH_SCHEME',
      'Invalid authorization header'
    );
  }
  const payload = verify(token);
  const parsed = jwtPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError(
      401,
      'INVALID_TOKEN',
      'Invalid token'
    );
  }
  req.user = payload;

  next();
};

export function getAuthUser(req: Request) {
  const authUser = req.user;
  if (!authUser) {
    throw new AppError(401, 'UNAUTHORIZED', 'Auth user is missing');
  }
  return authUser;
}
