import { Router } from 'express';
import { postLogin, postRefresh, postLogout } from './auth.controller.js';

const r = Router();
r.post('/login', postLogin);
r.post('/refresh', postRefresh);
r.post('/logout', postLogout);

export default r;
