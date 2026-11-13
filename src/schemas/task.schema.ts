import z from 'zod';

export const createTaskSchema = z.object({
  title: z.string().refine(value => value.trim().length > 0),
  description: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']).optional()
});

export const updateTaskSchema = createTaskSchema.partial()
  .refine(data => Object.keys(data).length > 0);

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
