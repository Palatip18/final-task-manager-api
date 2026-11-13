import { Router, json } from 'express';
import { authController } from '../controllers/auth.controller.ts';
import { authenticate } from '../middlewares/authenticate.ts';

export const authRouter = Router();

authRouter.post('/register', json(), authController.register);
authRouter.post('/login', json(), authController.login);
authRouter.get('/me', authenticate, authController.getMe);
