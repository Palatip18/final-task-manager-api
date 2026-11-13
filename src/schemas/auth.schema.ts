import z from 'zod';

const nonemptyString = z.string().refine(value => value.trim().length > 0);

export const registerSchema = z.object({
  name: nonemptyString,
  email: z.string().regex(/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: nonemptyString,
  password: nonemptyString
});

export type RegisterInput = z.infer<typeof registerSchema>;
