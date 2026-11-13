import type { Request, Response } from 'express';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.ts';
import { taskService } from '../services/task.service.ts';
import { getAuthUser } from '../middlewares/authenticate.ts';

const create = async (req: Request, res: Response) => {
  const data = createTaskSchema.parse(req.body);
  const task = await taskService.create(getAuthUser(req).userId, data);
  res.status(201).json(task);
};

const getAll = async (req: Request, res: Response) => {
  const tasks = await taskService.getAll(getAuthUser(req).userId);
  res.status(200).json(tasks);
};

const getById = async (req: Request, res: Response) => {
  const task = await taskService.getById(req.taskId!, getAuthUser(req).userId);
  res.status(200).json(task);
};

const update = async (req: Request, res: Response) => {
  const data = updateTaskSchema.parse(req.body);
  const task = await taskService.update(req.taskId!, getAuthUser(req).userId, data);
  res.status(200).json(task);
};

const remove = async (req: Request, res: Response) => {
  await taskService.remove(req.taskId!, getAuthUser(req).userId);
  res.status(204).end();
};

export const taskController = { create, getAll, getById, update, remove };
