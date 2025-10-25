import { Router } from 'express';
import { authGuard, roleGuard } from '../../middlewares/auth.middleware.js';
import { getSettings, updateSettings } from './settings.controller.js';

const r = Router();

r.get('/', authGuard, getSettings);
r.put('/', authGuard, roleGuard('ADMIN'), updateSettings);

export default r;
