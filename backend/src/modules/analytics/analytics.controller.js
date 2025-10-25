// import { prisma } from '../../config/prisma.js';
// import { DateTime } from 'luxon';

// /* =========================
//    Helpers (UTC-based)
//    ========================= */

// function parseRangeFromQuery(q = {}) {
//   const tryParse = (v) => {
//     if (!v) return null;
//     const d = new Date(v);
//     return Number.isNaN(d.getTime()) ? null : d;
//   };

//   const fromQ = tryParse(q.from);
//   const toQ   = tryParse(q.to);

//   if (fromQ && toQ) return { fromUtc: fromQ, toUtc: toQ };

//   // fallback: today in WIB
//   const todayWib = DateTime.now().setZone('Asia/Jakarta');
//   return {
//     fromUtc: todayWib.startOf('day').toUTC().toJSDate(),
//     toUtc:   todayWib.endOf('day').toUTC().toJSDate(),
//   };
// }

// const num = (v) => (typeof v === 'bigint' ? Number(v) : Number(v || 0));

// /* =========================
//    1) SUMMARY
//    ========================= */
// export async function analyticsSummary(req, res) {
//   try {
//     const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

//     const [agg, count] = await Promise.all([
//       prisma.transaction.aggregate({
//         _sum: { total: true, subtotal: true, mechanicFee: true },
//         where: { 
//           datetime: { gte: fromUtc, lte: toUtc },
//         },
//       }),
//       prisma.transaction.count({
//         where: { datetime: { gte: fromUtc, lte: toUtc },
//         },
//       }),
//     ]);

//     return res.json({
//       ok: true,
//       data: {
//         totalRevenue: num(agg._sum.total),
//         subtotal:     num(agg._sum.subtotal),
//         totalMechanic:num(agg._sum.mechanicFee),
//         count,
//       },
//     });
//   } catch (e) {
//     console.error('analyticsSummary error:', e);
//     res.status(500).json({ ok: false, message: 'server error' });
//   }
// }

// /* =========================
//    2) REVENUE DAILY (per tanggal WIB)
//    ========================= */
// export async function revenueDaily(req, res) {
//   try {
//     const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

//     const query = `
//       SELECT
//         to_char((datetime AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS date,
//         COUNT(*)::int AS count,
//         COALESCE(SUM(total), 0)::numeric AS total
//       FROM "Transaction"
//       WHERE datetime >= $1::timestamptz AND datetime <= $2::timestamptz
//       GROUP BY to_char((datetime AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD')
//       ORDER BY date ASC
//     `;

//     const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);

//     res.json({
//       ok: true,
//       data: rows.map(r => ({
//         date:  r.date,
//         count: Number(r.count || 0),
//         total: Number(r.total || 0),
//       })),
//     });
//   } catch (e) {
//     console.error('revenueDaily error:', e);
//     res.status(500).json({ ok: false, message: 'server error' });
//   }
// }

// /* =========================
//    3) MECHANICS DAILY
//    ========================= */
// export async function mechanicsDaily(req, res) {
//   try {
//     const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

//     const query = `
//       SELECT
//         to_char((datetime AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS date,
//         "mechanicId",
//         COALESCE("mechanicName", '-') AS "mechanicName",
//         COALESCE(SUM("mechanicFee"),0)::numeric AS total
//       FROM "Transaction"
//       WHERE datetime >= $1::timestamptz AND datetime <= $2::timestamptz
//         AND "mechanicFee" > 0
//         AND "mechanicId" IS NOT NULL
//       GROUP BY date, "mechanicId", "mechanicName"
//       ORDER BY date DESC, total DESC
//     `;

//     const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);

//     res.json({
//       ok: true,
//       data: rows.map(r => ({
//         date: r.date,
//         mechanicId: r.mechanicId,
//         mechanicName: r.mechanicName,
//         total: num(r.total),
//       })),
//     });
//   } catch (e) {
//     console.error('mechanicsDaily error:', e);
//     res.status(500).json({ ok: false, message: 'server error' });
//   }
// }

// /* =========================
//    3b) MECHANICS TODAY
//    ========================= */
// export async function mechanicsToday(req, res) {
//   try {
//     const nowWib = DateTime.now().setZone('Asia/Jakarta');
//     const from   = nowWib.startOf('day').toUTC().toJSDate();
//     const to     = nowWib.endOf('day').toUTC().toJSDate();

//     const rows = await prisma.$queryRawUnsafe(`
//       SELECT
//         "mechanicId",
//         COALESCE("mechanicName", '-') AS "mechanicName",
//         COALESCE(SUM("mechanicFee"),0)::numeric AS total
//       FROM "Transaction"
//       WHERE datetime >= $1::timestamptz AND datetime <= $2::timestamptz
//         AND "mechanicFee" > 0
//         AND "mechanicId" IS NOT NULL
//       GROUP BY "mechanicId", "mechanicName"
//       ORDER BY total DESC
//     `, from, to);

//     res.json({
//       ok: true,
//       data: rows.map(r => ({
//         mechanicId: r.mechanicId,
//         mechanicName: r.mechanicName,
//         total: num(r.total),
//       })),
//     });
//   } catch (e) {
//     console.error('mechanicsToday error:', e);
//     res.status(500).json({ ok: false, message: 'server error' });
//   }
// }

// /* =========================
//    4) TOP PRODUCTS
//    ========================= */
// export async function topProducts(req, res) {
//   try {
//     const { fromUtc, toUtc } = parseRangeFromQuery(req.query);
//     const by = String(req.query.by || 'qty').toLowerCase();

//     if (by === 'revenue') {
//       const query = `
//         SELECT p.name,
//                COALESCE(SUM(ti.qty * ti.price),0)::numeric AS revenue
//         FROM "Transaction" t
//         JOIN "TransactionItem" ti ON ti."transactionId" = t.id
//         JOIN "Product" p ON p.id = ti."productId"
//         WHERE t.datetime >= $1::timestamptz AND t.datetime <= $2::timestamptz
//         GROUP BY p.name
//         ORDER BY revenue DESC
//         LIMIT 5
//       `;
//       const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);
//       return res.json({
//         ok: true,
//         data: rows.map(r => ({ name: r.name, revenue: num(r.revenue) })),
//       });
//     }

//     // default by qty
//     const query = `
//       SELECT p.name,
//              COALESCE(SUM(ti.qty),0)::int AS qty
//       FROM "Transaction" t
//       JOIN "TransactionItem" ti ON ti."transactionId" = t.id
//       JOIN "Product" p ON p.id = ti."productId"
//       WHERE t.datetime >= $1::timestamptz AND t.datetime <= $2::timestamptz
//       GROUP BY p.name
//       ORDER BY qty DESC
//       LIMIT 5
//     `;
//     const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);
//     return res.json({
//       ok: true,
//       data: rows.map(r => ({ name: r.name, qty: Number(r.qty || 0) })),
//     });
//   } catch (e) {
//     console.error('topProducts error:', e);
//     res.status(500).json({ ok: false, message: 'server error' });
//   }
// }

// /* =========================
//    5) REVENUE BY CATEGORIES
//    ========================= */
// export async function byCategories(req, res) {
//   try {
//     const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

//     const query = `
//       SELECT c.name AS category,
//              COALESCE(SUM(ti.qty * ti.price),0)::numeric AS revenue
//       FROM "Transaction" t
//       JOIN "TransactionItem" ti ON ti."transactionId" = t.id
//       JOIN "Product" p ON p.id = ti."productId"
//       JOIN "Category" c ON c.id = p."categoryId"
//       WHERE t.datetime >= $1::timestamptz AND t.datetime <= $2::timestamptz
//       GROUP BY c.name
//       ORDER BY revenue DESC
//     `;

//     const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);

//     res.json({
//       ok: true,
//       data: rows.map(r => ({ category: r.category, revenue: num(r.revenue) })),
//     });
//   } catch (e) {
//     console.error('byCategories error:', e);
//     res.status(500).json({ ok: false, message: 'server error' });
//   }
// }

// /* =========================
//    6) Export CSV
//    ========================= */
// export async function exportMechanicsDailyCsv(req, res) {
//   try {
//     const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

//     const query = `
//       SELECT
//         to_char((datetime AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS date,
//         COALESCE("mechanicName", '-') AS "mechanicName",
//         COALESCE(SUM("mechanicFee"),0)::numeric AS total
//       FROM "Transaction"
//       WHERE datetime >= $1::timestamptz AND datetime <= $2::timestamptz
//         AND "mechanicFee" > 0
//         AND "mechanicId" IS NOT NULL
//       GROUP BY date, "mechanicName"
//       ORDER BY date DESC, total DESC
//     `;

//     const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);

//     const header = 'date,mechanicName,total';
//     const lines = [header, ...rows.map(r =>
//       `${r.date},${csvEsc(r.mechanicName)},${num(r.total)}`
//     )];

//     res.setHeader('Content-Type', 'text/csv; charset=utf-8');
//     res.setHeader('Content-Disposition', 'attachment; filename="mechanics_daily.csv"');
//     res.send(lines.join('\n'));
//   } catch (e) {
//     console.error('exportMechanicsDailyCsv error:', e);
//     res.status(500).json({ ok: false, message: 'server error' });
//   }
// }

// function csvEsc(s) {
//   s = String(s ?? '');
//   return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
// }

import { prisma } from '../../config/prisma.js';
import { DateTime } from 'luxon';

/* =========================
   Helpers (UTC-based)
   ========================= */

function parseRangeFromQuery(q = {}) {
  const tryParse = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const fromQ = tryParse(q.from);
  const toQ   = tryParse(q.to);

  if (fromQ && toQ) return { fromUtc: fromQ, toUtc: toQ };

  // fallback: today in WIB
  const todayWib = DateTime.now().setZone('Asia/Jakarta');
  return {
    fromUtc: todayWib.startOf('day').toUTC().toJSDate(),
    toUtc:   todayWib.endOf('day').toUTC().toJSDate(),
  };
}

const num = (v) => (typeof v === 'bigint' ? Number(v) : Number(v || 0));

/* =========================
   1) SUMMARY (EXCLUDE CANCELED)
   ========================= */
export async function analyticsSummary(req, res) {
  try {
    const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

    const [agg, count] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { total: true, subtotal: true, mechanicFee: true },
        where: { 
          datetime: { gte: fromUtc, lte: toUtc },
          canceledAt: null  // ✅ EXCLUDE CANCELED
        },
      }),
      prisma.transaction.count({
        where: { 
          datetime: { gte: fromUtc, lte: toUtc },
          canceledAt: null  // ✅ EXCLUDE CANCELED
        },
      }),
    ]);

    return res.json({
      ok: true,
      data: {
        totalRevenue: num(agg._sum.total),
        subtotal:     num(agg._sum.subtotal),
        totalMechanic:num(agg._sum.mechanicFee),
        count,
      },
    });
  } catch (e) {
    console.error('analyticsSummary error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

/* =========================
   2) REVENUE DAILY (EXCLUDE CANCELED)
   ========================= */
export async function revenueDaily(req, res) {
  try {
    const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

    const query = `
      SELECT
        to_char((datetime AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count,
        COALESCE(SUM(total), 0)::numeric AS total
      FROM "Transaction"
      WHERE datetime >= $1::timestamptz 
        AND datetime <= $2::timestamptz
        AND "canceledAt" IS NULL
      GROUP BY to_char((datetime AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);

    res.json({
      ok: true,
      data: rows.map(r => ({
        date:  r.date,
        count: Number(r.count || 0),
        total: Number(r.total || 0),
      })),
    });
  } catch (e) {
    console.error('revenueDaily error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

/* =========================
   3) MECHANICS DAILY (EXCLUDE CANCELED)
   ========================= */
export async function mechanicsDaily(req, res) {
  try {
    const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

    const query = `
      SELECT
        to_char((datetime AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS date,
        "mechanicId",
        COALESCE("mechanicName", '-') AS "mechanicName",
        COALESCE(SUM("mechanicFee"),0)::numeric AS total
      FROM "Transaction"
      WHERE datetime >= $1::timestamptz 
        AND datetime <= $2::timestamptz
        AND "canceledAt" IS NULL
        AND "mechanicFee" > 0
        AND "mechanicId" IS NOT NULL
      GROUP BY date, "mechanicId", "mechanicName"
      ORDER BY date DESC, total DESC
    `;

    const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);

    res.json({
      ok: true,
      data: rows.map(r => ({
        date: r.date,
        mechanicId: r.mechanicId,
        mechanicName: r.mechanicName,
        total: num(r.total),
      })),
    });
  } catch (e) {
    console.error('mechanicsDaily error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

/* =========================
   3b) MECHANICS TODAY (EXCLUDE CANCELED)
   ========================= */
export async function mechanicsToday(req, res) {
  try {
    const nowWib = DateTime.now().setZone('Asia/Jakarta');
    const from   = nowWib.startOf('day').toUTC().toJSDate();
    const to     = nowWib.endOf('day').toUTC().toJSDate();

    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        "mechanicId",
        COALESCE("mechanicName", '-') AS "mechanicName",
        COALESCE(SUM("mechanicFee"),0)::numeric AS total
      FROM "Transaction"
      WHERE datetime >= $1::timestamptz 
        AND datetime <= $2::timestamptz
        AND "canceledAt" IS NULL
        AND "mechanicFee" > 0
        AND "mechanicId" IS NOT NULL
      GROUP BY "mechanicId", "mechanicName"
      ORDER BY total DESC
    `, from, to);

    res.json({
      ok: true,
      data: rows.map(r => ({
        mechanicId: r.mechanicId,
        mechanicName: r.mechanicName,
        total: num(r.total),
      })),
    });
  } catch (e) {
    console.error('mechanicsToday error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

/* =========================
   4) TOP PRODUCTS (EXCLUDE CANCELED)
   ========================= */
export async function topProducts(req, res) {
  try {
    const { fromUtc, toUtc } = parseRangeFromQuery(req.query);
    const by = String(req.query.by || 'qty').toLowerCase();

    if (by === 'revenue') {
      const query = `
        SELECT p.name,
               COALESCE(SUM(ti.qty * ti.price),0)::numeric AS revenue
        FROM "Transaction" t
        JOIN "TransactionItem" ti ON ti."transactionId" = t.id
        JOIN "Product" p ON p.id = ti."productId"
        WHERE t.datetime >= $1::timestamptz 
          AND t.datetime <= $2::timestamptz
          AND t."canceledAt" IS NULL
        GROUP BY p.name
        ORDER BY revenue DESC
        LIMIT 5
      `;
      const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);
      return res.json({
        ok: true,
        data: rows.map(r => ({ name: r.name, revenue: num(r.revenue) })),
      });
    }

    // default by qty
    const query = `
      SELECT p.name,
             COALESCE(SUM(ti.qty),0)::int AS qty
      FROM "Transaction" t
      JOIN "TransactionItem" ti ON ti."transactionId" = t.id
      JOIN "Product" p ON p.id = ti."productId"
      WHERE t.datetime >= $1::timestamptz 
        AND t.datetime <= $2::timestamptz
        AND t."canceledAt" IS NULL
      GROUP BY p.name
      ORDER BY qty DESC
      LIMIT 5
    `;
    const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);
    return res.json({
      ok: true,
      data: rows.map(r => ({ name: r.name, qty: Number(r.qty || 0) })),
    });
  } catch (e) {
    console.error('topProducts error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

/* =========================
   5) REVENUE BY CATEGORIES (EXCLUDE CANCELED)
   ========================= */
export async function byCategories(req, res) {
  try {
    const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

    const query = `
      SELECT c.name AS category,
             COALESCE(SUM(ti.qty * ti.price),0)::numeric AS revenue
      FROM "Transaction" t
      JOIN "TransactionItem" ti ON ti."transactionId" = t.id
      JOIN "Product" p ON p.id = ti."productId"
      JOIN "Category" c ON c.id = p."categoryId"
      WHERE t.datetime >= $1::timestamptz 
        AND t.datetime <= $2::timestamptz
        AND t."canceledAt" IS NULL
      GROUP BY c.name
      ORDER BY revenue DESC
    `;

    const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);

    res.json({
      ok: true,
      data: rows.map(r => ({ category: r.category, revenue: num(r.revenue) })),
    });
  } catch (e) {
    console.error('byCategories error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

/* =========================
   6) Export CSV (EXCLUDE CANCELED)
   ========================= */
export async function exportMechanicsDailyCsv(req, res) {
  try {
    const { fromUtc, toUtc } = parseRangeFromQuery(req.query);

    const query = `
      SELECT
        to_char((datetime AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS date,
        COALESCE("mechanicName", '-') AS "mechanicName",
        COALESCE(SUM("mechanicFee"),0)::numeric AS total
      FROM "Transaction"
      WHERE datetime >= $1::timestamptz 
        AND datetime <= $2::timestamptz
        AND "canceledAt" IS NULL
        AND "mechanicFee" > 0
        AND "mechanicId" IS NOT NULL
      GROUP BY date, "mechanicName"
      ORDER BY date DESC, total DESC
    `;

    const rows = await prisma.$queryRawUnsafe(query, fromUtc, toUtc);

    const header = 'date,mechanicName,total';
    const lines = [header, ...rows.map(r =>
      `${r.date},${csvEsc(r.mechanicName)},${num(r.total)}`
    )];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mechanics_daily.csv"');
    res.send(lines.join('\n'));
  } catch (e) {
    console.error('exportMechanicsDailyCsv error:', e);
    res.status(500).json({ ok: false, message: 'server error' });
  }
}

function csvEsc(s) {
  s = String(s ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}