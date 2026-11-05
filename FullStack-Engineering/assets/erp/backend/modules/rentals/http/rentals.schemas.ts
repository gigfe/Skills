import { z } from 'zod';

export const createRentalOrderSchema = z.object({
  customerId: z.string().uuid(),
  equipmentId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateRentalOrderDto = z.infer<typeof createRentalOrderSchema>;
