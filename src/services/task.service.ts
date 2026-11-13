import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.ts';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema.ts';
import { AppError } from '../utils/app-error.ts';

const create = (userId: number, data: CreateTaskInput) =>
  prisma.task.create({ data: { ...data, userId } });

const getAll = (userId: number) =>
  prisma.task.findMany({ where: { userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });

const getById = async (id: number, userId: number) => {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw new AppError(404, 'Task not found');
  return task;
};

const update = async (id: number, userId: number, data: UpdateTaskInput) => {
  try {
    return await prisma.task.update({ where: { id, userId }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new AppError(404, 'Task not found');
    }
    throw error;
  }
};

const remove = async (id: number, userId: number) => {
  const result = await prisma.task.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new AppError(404, 'Task not found');
};

export const taskService = { create, getAll, getById, update, remove };
