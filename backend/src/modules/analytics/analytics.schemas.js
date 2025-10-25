import { z } from 'zod';

export const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().optional(),
  mechanicId: z.string().uuid().optional(),
  n: z.coerce.number().int().positive().optional(),
  by: z.enum(['qty','revenue']).optional(),
});
