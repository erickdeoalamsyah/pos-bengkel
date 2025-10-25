// backend/src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

/** Auth guard: cek Authorization: Bearer <token> */
export function authGuard(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ ok:false, message:'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, role, username, iat, exp }
    next();
  } catch {
    return res.status(401).json({ ok:false, message:'Invalid token' });
  }
}

/** Role guard: batasi akses ke role tertentu */
/** Role guard: bisa terima 'ADMIN','CASHIER' atau ['ADMIN','CASHIER'] */
export function roleGuard(...allowed) {
  // rata-kan: roleGuard('ADMIN','CASHIER') atau roleGuard(['ADMIN','CASHIER'])
  const flat = allowed.flat().map(r => String(r).toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok:false, message:'Unauthenticated' });
    }
    const role = String(req.user.role || '').toUpperCase();
    if (!flat.includes(role)) {
      return res.status(403).json({ ok:false, message:'Forbidden' });
    }
    next();
  };
}

export function onlyRoles(roles = []) {
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ ok: false, message: 'unauthorized' });
      if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(500).json({ ok: false, message: 'roles not configured' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ ok: false, message: 'forbidden' });
      }
      next();
    } catch (e) {
      return res.status(500).json({ ok: false, message: 'guard error' });
    }
  };
}

/** Helper khusus admin */
export const requireAdmin = roleGuard('ADMIN');
