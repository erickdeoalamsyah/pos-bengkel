import { prisma } from '../../config/prisma.js';
import { createCategorySchema, updateCategorySchema } from './categories.schemas.js';

export async function listCategories(req, res) {
  const q = (req.query.q || '').trim();
  const active = req.query.active;
  const where = {};
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }];
  if (active === 'true') where.active = true;
  if (active === 'false') where.active = false;

  const data = await prisma.category.findMany({
    where,
    orderBy: [{ name: 'asc' }],
  });
  res.json({ ok: true, data });
}

export async function createCategory(req, res) {
  try {
    const body = createCategorySchema.parse(req.body);
    const data = await prisma.category.create({ data: body });
    res.status(201).json({ ok: true, data });
  } catch (e) {
    if (e?.name === 'ZodError') return res.status(400).json({ ok:false, message:'Bad input', issues:e.errors });
    if (e.code === 'P2002') return res.status(409).json({ ok:false, message:'Slug sudah dipakai' });
    res.status(500).json({ ok:false, message:'Server error' });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const body = updateCategorySchema.parse(req.body);
    const data = await prisma.category.update({ where: { id }, data: body });
    res.json({ ok: true, data });
  } catch (e) {
    if (e?.name === 'ZodError') return res.status(400).json({ ok:false, message:'Bad input', issues:e.errors });
    if (e.code === 'P2025') return res.status(404).json({ ok:false, message:'Not found' });
    if (e.code === 'P2002') return res.status(409).json({ ok:false, message:'Slug sudah dipakai' });
    res.status(500).json({ ok:false, message:'Server error' });
  }
}
