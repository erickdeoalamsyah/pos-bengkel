import { prisma } from '../../config/prisma.js';
import { createMechanicSchema, updateMechanicSchema } from './mechanics.schemas.js';

export async function listMechanics(req, res) {
  const q = (req.query.q || '').trim();
  const active = req.query.active;
  const where = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (active === 'true') where.active = true;
  if (active === 'false') where.active = false;

  const data = await prisma.mechanic.findMany({ where, orderBy: { name: 'asc' } });
  res.json({ ok: true, data });
}

export async function createMechanic(req, res) {
  try {
    const body = createMechanicSchema.parse(req.body);
    const data = await prisma.mechanic.create({ data: body });
    res.status(201).json({ ok: true, data });
  } catch (e) {
    if (e?.name === 'ZodError') return res.status(400).json({ ok:false, message:'Bad input', issues:e.errors });
    if (e.code === 'P2002') return res.status(409).json({ ok:false, message:'Nama mekanik sudah ada' });
    res.status(500).json({ ok:false, message:'Server error' });
  }
}

export async function updateMechanic(req, res) {
  try {
    const { id } = req.params;
    const body = updateMechanicSchema.parse(req.body);
    const data = await prisma.mechanic.update({ where: { id }, data: body });
    res.json({ ok: true, data });
  } catch (e) {
    if (e?.name === 'ZodError') return res.status(400).json({ ok:false, message:'Bad input', issues:e.errors });
    if (e.code === 'P2025') return res.status(404).json({ ok:false, message:'Not found' });
    if (e.code === 'P2002') return res.status(409).json({ ok:false, message:'Nama mekanik sudah ada' });
    res.status(500).json({ ok:false, message:'Server error' });
  }
}

export async function deleteMechanic(req, res) {
  try {
    const { id } = req.params;
    await prisma.mechanic.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok:false, message:'Not found' });
    res.status(500).json({ ok:false, message:'Server error' });
  }
}
