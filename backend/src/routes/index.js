// src/routes/index.js
import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import authRoutes from '../modules/auth/auth.routes.js';
import { authGuard, roleGuard } from '../middlewares/auth.middleware.js';

import categoryRoutes from '../modules/categories/categories.routes.js';
import productRoutes from '../modules/products/products.routes.js';
import transactionRoutes from '../modules/transactions/transactions.routes.js';
import mechanicRoutes from '../modules/mechanics/mechanics.routes.js';
import stockRoutes from '../modules/stock/stock.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';

const r = Router();

r.get('/', (req, res) => res.json({ message: 'bengkel-kasir API v1', ok: true }));

r.get('/health/db', async (req, res) => {
  try {
    const now = await prisma.$queryRaw`SELECT NOW() as now`;
    res.json({ ok: true, db_time: now?.[0]?.now });
  } catch (e) {
    res.status(500).json({ ok:false, error: String(e) });
  }
});

r.use('/auth', authRoutes);
r.use('/categories', categoryRoutes);
r.use('/products', productRoutes);       // ← pastikan hanya sekali
r.use('/transactions', transactionRoutes);
r.use('/mechanics', mechanicRoutes);
r.use('/stock-adjustments', stockRoutes);
r.use('/settings', settingsRoutes);
r.use('/analytics', analyticsRoutes);

// Contoh admin-only
r.get('/secure/admin-ping', authGuard, roleGuard('ADMIN'), (req, res) => {
  res.json({ ok: true, msg: `hello ${req.user.username}, role=${req.user.role}` });
});

export default r;
