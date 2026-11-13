import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.ts';

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof AppError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Validation failed' });
    return;
  }
  const type = typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
  if (type === 'entity.parse.failed' || type === 'entity.too.large') {
    res.status(400).json({ message: type === 'entity.parse.failed' ? 'Invalid JSON body' : 'Request body too large' });
    return;
  }
  res.status(500).json({ message: 'Internal server error' });
};
