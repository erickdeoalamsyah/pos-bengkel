import { prisma } from '../../config/prisma.js';
import { createAdjustmentSchema } from './stock.schemas.js';

// GET /stock-adjustments?from=&to=&productId=&type=IN|OUT
export async function listAdjustments(req, res) {
  const { from, to, productId, type } = req.query;
  const where = {};
  if (productId) where.productId = productId;
  if (type === 'IN' || type === 'OUT') where.type = type;
  if (from) where.createdAt = { gte: new Date(from) };
  if (to) {
    where.createdAt = where.createdAt || {};
    where.createdAt.lte = new Date(to);
  }

  const data = await prisma.stockAdjustment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { username: true } },
    },
  });
  res.json({ ok: true, data });
}

// POST /stock-adjustments  (ADMIN)
export async function createAdjustment(req, res) {
  try {
    const body = createAdjustmentSchema.parse({
      ...req.body,
      qty: Number(req.body.qty),
    });

    const userId = req.user?.sub || null;

    const result = await prisma.$transaction(async (tx) => {
      const p = await tx.product.findUnique({ where: { id: body.productId } });
      if (!p) throw new Error('Produk tidak ditemukan');

      const before = p.stock;
      let after = before;

      if (body.type === 'IN') {
        after = before + body.qty;
        await tx.product.update({
          where: { id: p.id },
          data: { stock: { increment: body.qty } },
        });
      } else {
        if (before < body.qty) throw new Error(`Stok tidak cukup (stok: ${before})`);
        after = before - body.qty;
        await tx.product.update({
          where: { id: p.id },
          data: { stock: { decrement: body.qty } },
        });
      }

      const adj = await tx.stockAdjustment.create({
        data: {
          productId: p.id,
          userId,
          type: body.type,
          qty: body.qty,
          reason: body.reason || null,
          note: body.note || null,
          beforeStock: before,
          afterStock: after,
        },
        include: {
          product: { select: { name: true, sku: true } },
        },
      });

      return { adj, product: { id: p.id, name: p.name, sku: p.sku, stock: after } };
    });

    res.status(201).json({ ok: true, data: result });
  } catch (e) {
    if (e?.name === 'ZodError') {
      return res.status(400).json({ ok:false, message:'Bad input', issues: e.errors });
    }
    if (String(e).includes('Stok tidak cukup') || String(e).includes('Produk tidak')) {
      return res.status(400).json({ ok:false, message: String(e) });
    }
    console.error('createAdjustment', e);
    res.status(500).json({ ok:false, message:'Server error' });
  }
}
