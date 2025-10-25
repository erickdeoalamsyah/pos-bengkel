import { Router } from 'express';
import { authGuard, roleGuard } from '../../middlewares/auth.middleware.js';
import { listMechanics, createMechanic, updateMechanic, deleteMechanic } from './mechanics.controller.js';

const r = Router();
r.get('/', authGuard, listMechanics);
r.post('/', authGuard, roleGuard('ADMIN'), createMechanic);
r.put('/:id', authGuard, roleGuard('ADMIN'), updateMechanic);
r.delete('/:id', authGuard, roleGuard('ADMIN'), deleteMechanic);
export default r;
