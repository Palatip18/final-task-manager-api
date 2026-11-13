import type { Request, Response } from "express";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../schemas/task.schema.ts";
import { intIdSchema } from "../schemas/common.schema.ts";
import { getAuthUser } from "../middlewares/authenticate.ts";
import { taskService } from "../services/task.service.ts";

const create = async (req: Request, res: Response) => {
  const data = createTaskSchema.parse(req.body);
  const authUser = getAuthUser(req);
  const task = await taskService.create(authUser.userId, data);
  res.status(201).json(task);
};

const getAll = async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const tasks = await taskService.getAll(authUser.userId);
  res.status(200).json(tasks);
};

const getById = async (req: Request, res: Response) => {
  const { id } = intIdSchema.parse(req.params);
  const authUser = getAuthUser(req);
  const task = await taskService.getById(id, authUser.userId);
  res.status(200).json(task);
};

const update = async (req: Request, res: Response) => {
  const { id } = intIdSchema.parse(req.params);
  const data = updateTaskSchema.parse(req.body);
  const authUser = getAuthUser(req);
  const task = await taskService.update(id, authUser.userId, data);
  res.status(200).json(task);
};

const remove = async (req: Request, res: Response) => {
  const { id } = intIdSchema.parse(req.params);
  const authUser = getAuthUser(req);
  await taskService.remove(id, authUser.userId);
  res.status(204).end();
};

export const taskController = {
  create,
  getAll,
  getById,
  update,
  remove,
};
