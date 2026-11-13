import 'dotenv/config';
import z from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(1)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.log('Env validation failed');
  console.log(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
