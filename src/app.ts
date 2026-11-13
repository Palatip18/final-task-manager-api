import express from 'express';
import { authRouter } from './routes/auth.route.ts';
import { taskRouter } from './routes/task.route.ts';
import { authenticate } from './middlewares/authenticate.ts';
import { notFound } from './middlewares/not-found.ts';
import { errorHandler } from './middlewares/error-handler.ts';

export const app = express();

app.use('/auth', authRouter);
app.use('/tasks', taskRouter);
app.use(authenticate);
app.use(notFound);
app.use(errorHandler);
