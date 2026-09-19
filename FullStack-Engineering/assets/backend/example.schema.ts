import { z } from 'zod';

// Un schema, dos usos: valida el input Y le da a TypeScript el tipo inferido
// (`z.infer<...>`) — no se mantiene una interface aparte a mano.
export const createTaskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  description: z.string().max(2000).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
