import { Router, json } from 'express';
import { taskController } from '../controllers/task.controller.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { validateTaskId } from '../middlewares/validate-task-id.ts';

export const taskRouter = Router();

taskRouter.use(authenticate);
taskRouter.post('/', json(), taskController.create);
taskRouter.get('/', taskController.getAll);
taskRouter.get('/:id', validateTaskId, taskController.getById);
taskRouter.patch('/:id', validateTaskId, json(), taskController.update);
taskRouter.delete('/:id', validateTaskId, taskController.remove);
