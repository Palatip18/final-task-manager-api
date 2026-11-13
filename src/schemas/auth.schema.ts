import z from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1).refine(value => value.trim().length > 0)
});

export const jwtPayloadSchema = z.object({
  userId: z.number().int().positive().max(2147483647),
  exp: z.number()
});
