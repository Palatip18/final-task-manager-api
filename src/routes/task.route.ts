import { Router, json } from 'express';
import { taskController } from '../controllers/task.controller.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { validateTaskId } from '../middlewares/validate-task-id.ts';

export const taskRouter = Router();

taskRouter.post('/', authenticate, json(), taskController.create);
taskRouter.get('/', authenticate, taskController.getAll);
taskRouter.get('/:id', authenticate, validateTaskId, taskController.getById);
taskRouter.patch('/:id', authenticate, validateTaskId, json(), taskController.update);
taskRouter.delete('/:id', authenticate, validateTaskId, taskController.remove);
