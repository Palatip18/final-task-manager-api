import type { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schema.ts';
import { authService } from '../services/auth.service.ts';
import { getAuthUser } from '../middlewares/authenticate.ts';

const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data);
  res.status(201).json(user);
};

const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const accessToken = await authService.login(data.email, data.password);
  res.status(200).json({ accessToken, tokenType: 'Bearer' });
};

const getMe = async (req: Request, res: Response) => {
  const user = await authService.getMe(getAuthUser(req).userId);
  res.status(200).json(user);
};

export const authController = { register, login, getMe };
