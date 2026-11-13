import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.ts';
import { AppError } from '../utils/app-error.ts';
import { hash, compare } from '../utils/hash.ts';
import { sign } from '../utils/jwt.ts';

const publicUser = { id: true, name: true, email: true, createdAt: true };

const register = async (name: string, email: string, plainPassword: string) => {
  const existing = await prisma.user.findUnique({
    where: { email }
  });
  if (existing) {
    throw new AppError(
      409,
      'EMAIL_ALREADY_EXIST',
      'Email already exists'
    );
  }

  const password = await hash(plainPassword);
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password
      },
      select: publicUser
    });
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(
        409,
        'EMAIL_ALREADY_EXIST',
        'Email already exists'
      );
    }
    throw error;
  }
};

const login = async (email: string, password: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password'
    );
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password'
    );
  }

  const accessToken = sign({ userId: user.id });
  return accessToken;
};

const getMe = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user) {
    throw new AppError(
      404,
      'USER_NOT_FOUND',
      'User not found'
    );
  }
  return user;
};

export const authService = { register, login, getMe };
