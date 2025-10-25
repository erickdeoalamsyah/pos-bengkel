// backend/src/modules/transactions/transactions.controller.js
import { prisma } from '../../config/prisma.js';
import { createTxnSchema } from './transactions.schemas.js';
import { DateTime } from 'luxon';

/* ===== Helpers ===== */

function nowUtcFromWib() {
  return DateTime.now().setZone('Asia/Jakarta').toUTC().toJSDate();
}

/** Range 1 hari berbasis WIB (mis. untuk ?date=YYYY-MM-DD pada list/history) */
function dayRangeWibToUtc(dateStr) {
  const base = dateStr
    ? DateTime.fromISO(dateStr, { zone: 'Asia/Jakarta' })
    : DateTime.now().setZone('Asia/Jakarta');

  return {
    fromUtc: base.startOf('day').toUTC().toJSDate(),
    toUtc:   base.endOf('day').toUTC().toJSDate(),
  };
}

/** Generator kode transaksi mengikuti tanggal WIB */
function genCodeWib() {
  const wib = DateTime.now().setZone('Asia/Jakarta');
  const y = wib.year;
  const m = String(wib.month).padStart(2, '0');
  const d = String(wib.day).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK-${y}${m}${d}-${rand}`;
}

/** Cast BigInt/Decimal ke Number aman */
function num(v) {
  if (typeof v === 'bigint') return Number(v);
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ===== Controllers ===== */

/**
 * LIST transaksi harian (default exclude canceled).
 * Query:
 *   - date=YYYY-MM-DD (WIB bucket)
 *   - q=string
 *   - page, pageSize
 *   - includeCanceled=true (opsional) → kalau mau ikut tampilkan yg dibatalkan
 */
export async function listTransactions(req, res) {
  try {
    const { fromUtc, toUtc } = dayRangeWibToUtc(req.query.date);
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const includeCanceled = String(req.query.includeCanceled || 'false') === 'true';

    const where = {
      datetime: { gte: fromUtc, lte: toUtc },
      ...(includeCanceled ? {} : { canceledAt: null }),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { customerName: { contains: q, mode: 'insensitive' } },
              { vehiclePlate: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rowsRaw] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { datetime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          code: true,
          datetime: true,
          customerName: true,
          vehiclePlate: true,
          mechanicName: true,
          subtotal: true,
          mechanicFee: true,
          total: true,
          cashReceived: true,
          change: true,
          canceledAt: true,
          cancelReason: true,
          cashier: { select: { username: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    const data = rowsRaw.map((r) => ({
      ...r,
      subtotal: num(r.subtotal),
      mechanicFee: num(r.mechanicFee),
      total: num(r.total),
      cashReceived: num(r.cashReceived),
      change: num(r.change),
      isCanceled: !!r.canceledAt,
    }));

    res.json({ ok: true, data, total, page, pageSize });
  } catch (e) {
    console.error('listTransactions error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}



export async function getTransaction(req, res) {
  try {
    const { id } = req.params;
    const t = await prisma.transaction.findUnique({
      where: { id },
      include: {
        cashier: { select: { username: true } },
        items: {
          select: {
            id: true,
            productId: true,
            nameSnapshot: true,
            price: true,
            qty: true,
            lineTotal: true,
          },
        },
      },
    });

    if (!t) return res.status(404).json({ ok: false, message: 'Not found' });

    t.subtotal = num(t.subtotal);
    t.mechanicFee = num(t.mechanicFee);
    t.total = num(t.total);
    t.cashReceived = num(t.cashReceived);
    t.change = num(t.change);
    t.items = (t.items || []).map((it) => ({
      ...it,
      price: num(it.price),
      lineTotal: num(it.lineTotal),
    }));

    // flag cancel
    t.isCanceled = !!t.canceledAt;

    res.json({ ok: true, data: t });
  } catch (e) {
    console.error('getTransaction error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

export async function createTransaction(req, res) {
  try {
    // Validasi & normalisasi tipe angka
    const body = createTxnSchema.parse({
      ...req.body,
      mechanicFee: Number(req.body.mechanicFee ?? 0),
      cashReceived: Number(req.body.cashReceived ?? 0),
      items: (req.body.items || []).map((it) => ({
        ...it,
        qty: Number(it.qty),
        price: Number(it.price),
      })),
    });

    // Jika jasa saja, mekanik wajib valid & aktif
    let mechanicSnapshotName = null;
    if (body.mechanicId) {
      const mech = await prisma.mechanic.findUnique({
        where: { id: body.mechanicId },
        select: { id: true, name: true, active: true },
      });
      if (!mech || !mech.active) {
        return res.status(400).json({ ok: false, message: 'Mekanik tidak valid/aktif' });
      }
      mechanicSnapshotName = mech.name;
    }

    // Muat produk (jika ada item)
    let products = [];
    if (body.items.length > 0) {
      const ids = body.items.map((i) => i.productId);
      products = await prisma.product.findMany({
        where: { id: { in: ids }, active: true },
        select: { id: true, name: true, price: true, stock: true },
      });
      if (products.length !== ids.length) {
        return res.status(400).json({ ok: false, message: 'Produk tidak valid/aktif' });
      }
    }

    // Hitung subtotal & siapkan item rows
    let subtotal = 0;
    const itemRows = body.items.map((it) => {
      const p = products.find((x) => x.id === it.productId);
      const price = Number.isFinite(it.price) ? it.price : num(p?.price);
      const lineTotal = price * it.qty;
      subtotal += lineTotal;
      return {
        productId: p.id,
        nameSnapshot: p.name,
        price,
        qty: it.qty,
        lineTotal,
      };
    });

    const total = subtotal + (body.mechanicFee || 0);
    if (body.cashReceived < total) {
      return res.status(400).json({ ok: false, message: 'Uang diterima kurang dari total' });
    }
    const change = body.cashReceived - total;

    const userId = req.user?.sub || null;
    const code = genCodeWib();

    const created = await prisma.$transaction(async (tx) => {
      // Kurangi stok + log (bila ada item)
      for (const it of body.items) {
        const p = products.find((x) => x.id === it.productId);
        if (p.stock < it.qty) throw new Error(`Stok ${p.name} tidak cukup (stok: ${p.stock})`);
        const before = p.stock;
        const after = before - it.qty;

        await tx.product.update({
          where: { id: p.id },
          data: { stock: { decrement: it.qty } },
        });

        await tx.stockAdjustment.create({
          data: {
            productId: p.id,
            userId,
            type: 'OUT',
            qty: it.qty,
            reason: 'SALE',
            note: code,
            beforeStock: before,
            afterStock: after,
          },
        });

        p.stock = after; // update cache lokal
      }

      // SIMPAN TRANSAKSI (WIB sekarang → simpan UTC)
      const t = await tx.transaction.create({
        data: {
          code,
          cashierId: userId,
          datetime: nowUtcFromWib(),

          customerName: body.customerName || null,
          vehiclePlate: body.vehiclePlate || null,

          mechanicId: body.mechanicId || null,
          mechanicName: mechanicSnapshotName,
          mechanicFee: body.mechanicFee || 0,

          subtotal,
          total,
          cashReceived: body.cashReceived,
          change,
          paymentMethod: 'CASH',

          ...(itemRows.length ? { items: { createMany: { data: itemRows } } } : {}),
        },
        include: { items: true, cashier: { select: { username: true } } },
      });

      return t;
    });

    // Normalisasi angka di response
    created.subtotal = num(created.subtotal);
    created.mechanicFee = num(created.mechanicFee);
    created.total = num(created.total);
    created.cashReceived = num(created.cashReceived);
    created.change = num(created.change);
    if (Array.isArray(created.items)) {
      created.items = created.items.map((it) => ({ ...it, price: num(it.price), lineTotal: num(it.lineTotal) }));
    }

    return res.status(201).json({ ok: true, data: created });
  } catch (e) {
    if (e?.name === 'ZodError') {
      return res.status(400).json({ ok: false, message: 'Bad input', issues: e.errors });
    }
    if (String(e).includes('Stok')) {
      return res.status(400).json({ ok: false, message: String(e) });
    }
    console.error('createTransaction error:', e);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}

/**
 * CANCEL/VOID transaksi:
 * - Tandai canceledAt, canceledById, cancelReason
 * - Kembalikan stok item (StockAdjustment IN, reason=VOID, note=code)
 */
export async function cancelTransaction(req, res) {
  try {
    const { id } = req.params;
    const reason = (req.body?.reason || '').trim() || null;
    const userId = req.user?.sub || null;

    // Muat transaksi + items
    const t = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: { select: { productId: true, qty: true } },
      },
    });
    if (!t) return res.status(404).json({ ok: false, message: 'Not found' });
    if (t.canceledAt) return res.status(400).json({ ok: false, message: 'Transaksi sudah dibatalkan' });

    await prisma.$transaction(async (tx) => {
      // Kembalikan stok bila ada item
      if (t.items && t.items.length > 0) {
        // Agregasi qty per productId (kalau ada item yang sama)
        const agg = new Map();
        for (const it of t.items) {
          agg.set(it.productId, (agg.get(it.productId) || 0) + it.qty);
        }

        for (const [productId, qty] of agg) {
          const p = await tx.product.findUnique({ where: { id: productId }, select: { stock: true } });
          const before = p?.stock ?? 0;
          const after = before + qty;

          await tx.product.update({
            where: { id: productId },
            data: { stock: { increment: qty } },
          });

          await tx.stockAdjustment.create({
            data: {
              productId,
              userId,
              type: 'IN',
              qty,
              reason: 'VOID',
              note: t.code,
              beforeStock: before,
              afterStock: after,
            },
          });
        }
      }

      // Tandai canceled pada transaksi
      await tx.transaction.update({
        where: { id: t.id },
        data: {
          canceledAt: nowUtcFromWib(),
          canceledById: userId,
          cancelReason: reason,
        },
      });
    });

    return res.json({ ok: true, message: 'Transaksi dibatalkan' });
  } catch (e) {
    console.error('cancelTransaction error:', e);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}

/**
 * SUMMARY pendapatan (exclude canceled)
 * Query: from (UTC ISO), to (UTC ISO), q
 */
export async function summaryTransactions(req, res) {
  try {
    const where = { canceledAt: null };
    if (req.query.from) where.datetime = { gte: new Date(req.query.from) };
    if (req.query.to) {
      where.datetime = where.datetime || {};
      where.datetime.lte = new Date(req.query.to);
    }
    const q = (req.query.q || '').trim();
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { vehiclePlate: { contains: q, mode: 'insensitive' } },
      ];
    }

    const txns = await prisma.transaction.findMany({
      where,
      select: { total: true, mechanicFee: true },
    });

    const count = txns.length;
    const totalRevenue = txns.reduce((s, t) => s + num(t.total), 0);
    const totalMechanic = txns.reduce((s, t) => s + num(t.mechanicFee), 0);
    const avgTxn = count ? Math.round(totalRevenue / count) : 0;

    res.json({ ok: true, data: { count, totalRevenue, totalMechanic, avgTxn } });
  } catch (e) {
    console.error('summaryTransactions error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

/**
 * EXPORT CSV transaksi harian (exclude canceled)
 * Query: date=YYYY-MM-DD (WIB)
 */
export async function exportTransactionsCsv(req, res) {
  try {
    const { fromUtc, toUtc } = dayRangeWibToUtc(req.query.date);

    const data = await prisma.transaction.findMany({
      where: { datetime: { gte: fromUtc, lte: toUtc }, canceledAt: null },
      orderBy: { datetime: 'asc' },
      select: {
        code: true,
        datetime: true,
        customerName: true,
        vehiclePlate: true,
        mechanicName: true,
        subtotal: true,
        mechanicFee: true,
        total: true,
        cashier: { select: { username: true } },
      },
    });

    const rows = data.map((r) => ({
      code: r.code,
      // simpan UTC di DB; tampilkan ISO (UTC) di CSV.
      datetime: new Date(r.datetime).toISOString(),
      cashier: r.cashier?.username || '',
      customer: r.customerName || '',
      plate: r.vehiclePlate || '',
      mechanic: r.mechanicName || '',
      subtotal: num(r.subtotal),
      mechanicFee: num(r.mechanicFee),
      total: num(r.total),
    }));

    const header = [
      'Kode',
      'Datetime(UTC)',
      'Kasir',
      'Pelanggan',
      'NoPol',
      'Mekanik',
      'Subtotal',
      'OngkosMekanik',
      'Total',
    ];

    const csv =
      header.join(',') +
      '\n' +
      rows
        .map((r) =>
          [r.code, r.datetime, r.cashier, r.customer, r.plate, r.mechanic, r.subtotal, r.mechanicFee, r.total]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${req.query.date || 'today'}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('exportTransactionsCsv error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}
