// import { z } from 'zod';

// export const createTxnSchema = z.object({
//   items: z.array(z.object({
//     productId: z.string().uuid(),
//     qty: z.number().int().positive(),
//     price: z.number().int().nonnegative(), // client kirim harga, server tetap hitung ulang
//   })).min(1),

//   // MEKANIK: sekarang pilih dari daftar → kirim ID (opsional)
//   mechanicId: z.string().uuid().optional(),
//   mechanicFee: z.number().int().nonnegative().default(0),

//   // info opsional
//   customerName: z.string().optional(),
//   vehiclePlate: z.string().optional(),

//   // pembayaran cash
//   cashReceived: z.number().int().nonnegative(),
// });

import { z } from 'zod';

export const createTxnSchema = z.object({
  // items sekarang opsional & boleh kosong
  items: z.array(z.object({
    productId: z.string().uuid(),
    qty: z.number().int().positive(),
    price: z.number().int().nonnegative(),
  })).default([]),

  // jasa mekanik (boleh 0 jika ada item)
  mechanicId: z.string().uuid().optional(),
  mechanicFee: z.number().int().nonnegative().default(0),

  customerName: z.string().optional(),
  vehiclePlate: z.string().optional(),
  cashReceived: z.number().int().nonnegative(),
}).refine((v) => v.items.length > 0 || v.mechanicFee > 0, {
  message: 'Transaksi harus memiliki item ATAU ongkos mekanik.',
  path: ['mechanicFee'],
}).refine((v) => (v.items.length > 0) || (!!v.mechanicId && v.mechanicFee > 0), {
  message: 'Untuk transaksi jasa saja, pilih mekanik & isi ongkos.',
  path: ['mechanicId'],
});
