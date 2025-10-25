import { Router } from 'express';
import { authGuard, roleGuard } from '../../middlewares/auth.middleware.js';
import { listCategories, createCategory, updateCategory } from './categories.controller.js';

const r = Router();

r.get('/', authGuard, listCategories);
r.post('/', authGuard, roleGuard('ADMIN'), createCategory);
r.put('/:id', authGuard, roleGuard('ADMIN'), updateCategory);

export default r;
