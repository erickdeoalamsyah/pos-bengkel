import { Router } from 'express';
import { authGuard, roleGuard } from '../../middlewares/auth.middleware.js';
import {
  analyticsSummary,
  revenueDaily,
  mechanicsDaily,
  mechanicsToday,
  topProducts,
  byCategories,
  exportMechanicsDailyCsv,
} from './analytics.controller.js';

const r = Router();

// ADMIN only
r.get('/summary',        authGuard, roleGuard('ADMIN'), analyticsSummary);
r.get('/revenue-daily',  authGuard, roleGuard('ADMIN'), revenueDaily);
r.get('/mechanics/daily',authGuard, roleGuard('ADMIN'), mechanicsDaily);
r.get('/mechanics/today',authGuard, roleGuard('ADMIN'), mechanicsToday);
r.get('/products/top',   authGuard, roleGuard('ADMIN'), topProducts);
r.get('/categories',     authGuard, roleGuard('ADMIN'), byCategories);

// CSV export: gajian mekanik per hari
r.get('/mechanics/daily.csv', authGuard, roleGuard('ADMIN'), exportMechanicsDailyCsv);

export default r;
