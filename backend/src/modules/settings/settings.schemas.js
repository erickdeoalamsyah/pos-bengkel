import { z } from 'zod';

export const updateSettingsSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(3),
  phone: z.string().min(5),
  paperWidth: z.number().int().refine(v => v === 58 || v === 80, { message: 'paperWidth must be 58 or 80' }),
});
