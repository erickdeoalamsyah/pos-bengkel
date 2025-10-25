import { prisma } from '../../config/prisma.js';
import { updateSettingsSchema } from './settings.schemas.js';

async function ensureOne() {
  const rows = await prisma.shopSetting.findMany({ take: 1 });
  if (rows.length) return rows[0];
  return prisma.shopSetting.create({
    data: { /* default via schema */ },
  });
}

// GET /settings
export async function getSettings(req, res) {
  try {
    const s = await ensureOne();
    res.json({ ok: true, data: s });
  } catch (e) {
    console.error('getSettings', e);
    res.status(500).json({ ok:false, message:'Server error' });
  }
}

// PUT /settings  (ADMIN)
export async function updateSettings(req, res) {
  try {
    const body = updateSettingsSchema.parse({
      ...req.body,
      paperWidth: Number(req.body.paperWidth),
    });
    const s = await ensureOne();
    const up = await prisma.shopSetting.update({
      where: { id: s.id },
      data: body,
    });
    res.json({ ok: true, data: up });
  } catch (e) {
    if (e?.name === 'ZodError') return res.status(400).json({ ok:false, message:'Bad input', issues:e.errors });
    console.error('updateSettings', e);
    res.status(500).json({ ok:false, message:'Server error' });
  }
}
