import { Router } from 'express';
import { authGuard, roleGuard } from '../../middlewares/auth.middleware.js';
import {
  createTransaction,
  listTransactions,
  getTransaction,
  exportTransactionsCsv,
  summaryTransactions,
  cancelTransaction
} from './transactions.controller.js';

const r = Router();

r.use(authGuard);

// yang statis dulu
r.get('/summary', summaryTransactions);
r.get('/csv', roleGuard(['ADMIN']), exportTransactionsCsv);

// list & detail
r.get('/', roleGuard(['ADMIN', 'CASHIER']), listTransactions);
r.get('/:id', roleGuard(['ADMIN', 'CASHIER']), getTransaction);

// create
r.post('/', roleGuard(['ADMIN', 'CASHIER']), createTransaction);

//void 
r.patch('/:id/cancel', roleGuard(['ADMIN', 'CASHIER']), cancelTransaction);

export default r;
