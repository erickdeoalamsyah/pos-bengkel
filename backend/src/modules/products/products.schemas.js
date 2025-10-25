// import { z } from 'zod';

// export const createProductSchema = z.object({
//   sku: z.string().min(2),
//   name: z.string().min(2),
//   price: z.number().int().nonnegative(),
//   cost: z.number().int().nonnegative().optional(),
//   stock: z.number().int().nonnegative().default(0),
//   unit: z.string().min(1).default('pcs'),
//   active: z.boolean().optional(),
//   categoryId: z.string().uuid(),
// });

// export const updateProductSchema = z.object({
//   name: z.string().min(2).optional(),
//   price: z.number().int().nonnegative().optional(),
//   cost: z.number().int().nonnegative().optional(),
//   stock: z.number().int().optional(), // boleh negatif? -> di CRUD tidak; adjustment nanti di endpoint khusus
//   unit: z.string().min(1).optional(),
//   active: z.boolean().optional(),
//   categoryId: z.string().uuid().optional(),
// });
// src/modules/products/products.schemas.js
import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  cost: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().default(0),
  unit: z.string().min(1).default('pcs'),
  categoryId: z.string().uuid(),
  active: z.boolean().optional().default(true),
  lowStockThreshold: z.number().int().nonnegative().optional().default(0),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  price: z.number().int().nonnegative().optional(),
  cost: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  unit: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  active: z.boolean().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
});
