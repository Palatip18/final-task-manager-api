import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.ts';
import type { RegisterInput } from '../schemas/auth.schema.ts';
import { AppError } from '../utils/app-error.ts';
import { hash, compare } from '../utils/hash.ts';
import { sign } from '../utils/jwt.ts';

const publicUser = { id: true, name: true, email: true, createdAt: true };

const register = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) throw new AppError(409, 'Email already exists');
  const password = await hash(data.password);
  try {
    return await prisma.user.create({ data: { ...data, password }, select: publicUser });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Email already exists');
    }
    throw error;
  }
};

const login = async (email: string, password: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await compare(password, user.password))) {
    throw new AppError(401, 'Invalid email or password');
  }
  return sign(user.id);
};

const getMe = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

export const authService = { register, login, getMe };
