// import { Router } from 'express';
// import { authGuard, roleGuard } from '../../middlewares/auth.middleware.js';
// import { listProducts,getProduct, createProduct, updateProduct, listLowStock } from './products.controller.js';

// const r = Router();

// r.get('/', authGuard, listProducts);
// r.get('/:id', roleGuard(['ADMIN', 'CASHIER']), getProduct);
// r.post('/', authGuard, roleGuard('ADMIN'), createProduct);
// r.put('/:id', authGuard, roleGuard('ADMIN'), updateProduct);
// r.get('/low-stock', authGuard, listLowStock);

// // catatan: endpoint adjust-stock khusus akan kita buat terpisah nanti

// export default r;

// src/modules/products/products.routes.js
import { Router } from 'express';
import { authGuard, roleGuard } from '../../middlewares/auth.middleware.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listLowStock,
} from './products.controller.js';

const r = Router();

r.use(authGuard);

// perhatikan urutan khusus path statis
r.get('/low-stock', roleGuard('ADMIN', 'CASHIER'), listLowStock);

// list & get
r.get('/', roleGuard('ADMIN', 'CASHIER'), listProducts);
r.get('/:id', roleGuard('ADMIN', 'CASHIER'), getProduct);

// create / update / delete (admin-only)
r.post('/', roleGuard('ADMIN'), createProduct);
r.put('/:id', roleGuard('ADMIN'), updateProduct);
r.delete('/:id', roleGuard('ADMIN'), deleteProduct);

export default r;
