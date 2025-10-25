import { prisma } from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema } from './auth.schemas.js';

const ACCESS_TTL = '30m';      // bebas, tetap pendek
const REFRESH_DAYS = 365;      // biar gak auto-logout setahun
const REFRESH_TTL = `${REFRESH_DAYS}d`;
const REFRESH_MAX_AGE = REFRESH_DAYS * 24 * 60 * 60 * 1000; // ms
const COOKIE_NAME = 'rt';

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}
function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: REFRESH_TTL });
}

export async function postLogin(req, res) {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { username: body.username } });
    if (!user || !user.active) return res.status(401).json({ ok:false, message: 'Invalid credentials' });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok:false, message: 'Invalid credentials' });

    const payload = { sub: user.id, role: user.role, username: user.username };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    // httpOnly cookie for refresh
    res.cookie(COOKIE_NAME, refreshToken, {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,                 // set true di produksi (HTTPS)
  maxAge: REFRESH_MAX_AGE,       // <-- panjang (365 hari)
  path: '/api/v1/auth',
});

    res.json({
      ok: true,
      accessToken,
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
      expiresIn: 15 * 60,
    });
  } catch (e) {
    if (e?.name === 'ZodError') return res.status(400).json({ ok:false, message: 'Bad input', issues: e.errors });
    console.error(e);
    res.status(500).json({ ok:false, message: 'Server error' });
  }
}

export async function postRefresh(req, res) {
  try {
    const token = req.cookies?.rt;
    if (!token) return res.status(401).json({ ok:false, message:'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.active) return res.status(401).json({ ok:false, message:'User inactive' });

    // terbitkan access token baru
    const payload = { sub: user.id, role: user.role, username: user.username };
    const accessToken = signAccess(payload);

    // (opsional) terbitkan refresh token baru biar benar2 sliding
    const newRefresh = signRefresh(payload);
    res.cookie(COOKIE_NAME, newRefresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,            // true di HTTPS
      maxAge: REFRESH_MAX_AGE,
      path: '/api/v1/auth',
    });

    res.json({ ok:true, accessToken, expiresIn: 30 * 60 });
  } catch {
    res.status(401).json({ ok:false, message:'Invalid refresh' });
  }
}


export async function postLogout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: '/api/v1/auth' });
  res.json({ ok: true });
}
