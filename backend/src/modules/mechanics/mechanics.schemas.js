import { z } from 'zod';

export const createMechanicSchema = z.object({
  name: z.string().min(2),
  active: z.boolean().optional(),
});

export const updateMechanicSchema = z.object({
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
});
