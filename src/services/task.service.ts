import { prisma } from "../lib/prisma.ts";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../schemas/task.schema.ts";
import { AppError } from "../utils/app-error.ts";

const create = async (userId: number, data: CreateTaskInput) => {
  const task = await prisma.task.create({
    data: { ...data, userId },
  });
  return task;
};

const getAll = async (userId: number) => {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return tasks;
};

const getById = async (id: number, userId: number) => {
  const task = await prisma.task.findFirst({
    where: { id, userId },
  });
  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
  }
  return task;
};

const update = async (id: number, userId: number, data: UpdateTaskInput) => {
  const task = await prisma.task.findFirst({
    where: { id, userId },
  });
  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
  }
  const updatedTask = await prisma.task.update({
    where: { id, userId },
    data,
  });
  return updatedTask;
};

const remove = async (id: number, userId: number) => {
  const task = await prisma.task.findFirst({
    where: { id, userId },
  });
  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
  }
  await prisma.task.delete({
    where: { id, userId },
  });
};

export const taskService = {
  create,
  getAll,
  getById,
  update,
  remove,
};
