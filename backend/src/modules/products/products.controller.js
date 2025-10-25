import { prisma } from '../../config/prisma.js';
import { createProductSchema, updateProductSchema } from './products.schemas.js';

/** GET /products/:id */
export async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) return res.status(404).json({ ok: false, message: 'Produk tidak ditemukan' });
    return res.json({ ok: true, data: product });
  } catch (e) {
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}

/** GET /products */
export async function listProducts(req, res) {
  try {
    const q = (req.query.q || '').trim();
    const categoryId = req.query.categoryId || null;
    const active = req.query.active;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10), 1), 100);

    const where = {};
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }];
    if (categoryId) where.categoryId = categoryId;
    if (active === 'true') where.active = true;
    if (active === 'false') where.active = false;

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ ok: true, data, page, pageSize, total });
  } catch (e) {
    console.error('listProducts error:', e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
}

/** POST /products */
export async function createProduct(req, res) {
  try {
    const parsed = createProductSchema.parse({
      ...req.body,
      price: Number(req.body.price),
      cost: req.body.cost != null ? Number(req.body.cost) : undefined,
      stock: req.body.stock != null ? Number(req.body.stock) : 0,
      lowStockThreshold:
        req.body.lowStockThreshold != null ? Number(req.body.lowStockThreshold) : undefined,
    });

    const data = await prisma.product.create({ data: parsed });
    res.status(201).json({ ok: true, data });
  } catch (e) {
    if (e?.name === 'ZodError')
      return res.status(400).json({ ok: false, message: 'Bad input', issues: e.errors });
    if (e.code === 'P2002')
      return res.status(409).json({ ok: false, message: 'SKU sudah dipakai' });
    console.error('createProduct error:', e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
}

/** PUT /products/:id */
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const parsed = updateProductSchema.parse({
      ...req.body,
      price: req.body.price != null ? Number(req.body.price) : undefined,
      cost: req.body.cost != null ? Number(req.body.cost) : undefined,
      stock: req.body.stock != null ? Number(req.body.stock) : undefined,
      lowStockThreshold:
        req.body.lowStockThreshold != null ? Number(req.body.lowStockThreshold) : undefined,
    });

    const data = await prisma.product.update({ where: { id }, data: parsed });
    res.json({ ok: true, data });
  } catch (e) {
    if (e?.name === 'ZodError')
      return res.status(400).json({ ok: false, message: 'Bad input', issues: e.errors });
    if (e.code === 'P2025')
      return res.status(404).json({ ok: false, message: 'Produk tidak ditemukan' });
    if (e.code === 'P2002')
      return res.status(409).json({ ok: false, message: 'SKU sudah dipakai' });
    console.error('updateProduct error:', e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
}

/** DELETE /products/:id */
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ ok: false, message: 'Produk tidak ditemukan' });

    // Ganti sesuai model Anda. Umumnya: TransactionItem
    const usedInTx = await prisma.transactionItem.count({ where: { productId: id } });

    if (usedInTx > 0) {
      return res.status(400).json({
        ok: false,
        message: `Tidak dapat dihapus: produk dipakai pada ${usedInTx} transaksi`,
      });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ ok: true, message: 'Produk berhasil dihapus' });
  } catch (e) {
    console.error('deleteProduct error:', e);
    if (e.code === 'P2025') return res.status(404).json({ ok: false, message: 'Produk tidak ditemukan' });
    res.status(500).json({ ok: false, message: 'Server error' });
  }
}

/** GET /products/low-stock?n=10 (opsional) */
export async function listLowStock(req, res) {
  try {
    const nOverride = req.query.n ? Number(req.query.n) : null;

    const all = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      take: 500,
    });

    const data =
      nOverride != null
        ? all.filter((p) => p.stock <= nOverride)
        : all.filter((p) => p.stock <= (p.lowStockThreshold || 0));

    res.json({ ok: true, data });
  } catch (e) {
    console.error('listLowStock error:', e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
}
