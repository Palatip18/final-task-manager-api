import 'dotenv/config';
import z from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1).refine(value => value !== '<your-jwt-secret>')
});

export const env = envSchema.parse(process.env);
