import type { RequestHandler } from 'express';
import { intIdSchema } from '../schemas/common.schema.ts';
import { AppError } from '../utils/app-error.ts';

export const validateTaskId: RequestHandler = (req, res, next) => {
  const parsed = intIdSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(
      400,
      'INVALID_TASK_ID',
      'Invalid task ID'
    );
  }
  next();
};
