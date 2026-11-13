import z from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0);

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
