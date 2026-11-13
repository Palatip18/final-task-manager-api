import z from 'zod';

export const intIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(2147483647))
});
