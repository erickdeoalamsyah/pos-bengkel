import { z } from 'zod';

export const createAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN','OUT']),
  qty: z.number().int().positive(),
  reason: z.string().optional(), // RESTOCK | CORRECTION | WASTE | SALE | RETURN | OTHER
  note: z.string().optional(),
});
