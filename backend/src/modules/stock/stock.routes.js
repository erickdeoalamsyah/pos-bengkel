import { Router } from 'express';
import { authGuard, roleGuard } from '../../middlewares/auth.middleware.js';
import { listAdjustments, createAdjustment } from './stock.controller.js';

const r = Router();

// semua user bisa lihat (opsional), kalau mau hanya admin: tambahkan roleGuard
r.get('/', authGuard, listAdjustments);

// ADMIN only untuk create
r.post('/', authGuard, roleGuard('ADMIN'), createAdjustment);

export default r;
