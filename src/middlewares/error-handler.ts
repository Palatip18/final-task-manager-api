import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.ts';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Validation failed' });
    return;
  }
  if (error instanceof jwt.TokenExpiredError) {
    res.status(401).json({ message: 'Token expired' });
    return;
  }
  if (error instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  if (error instanceof Error && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({ message: 'Invalid JSON body' });
      return;
    }
    if (error.type === 'entity.too.large') {
      res.status(400).json({ message: 'Request body too large' });
      return;
    }
  }
  res.status(500).json({ message: 'Internal server error' });
};
