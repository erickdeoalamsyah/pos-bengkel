import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  active: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  active: z.boolean().optional(),
});
