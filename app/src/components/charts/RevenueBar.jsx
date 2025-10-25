'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useMemo } from 'react';

const fmtMoney = (n) =>
  new Intl.NumberFormat('id-ID').format(Number.isFinite(+n) ? +n : 0);

// Axis pakai notasi compact supaya rapi di layar kecil
const fmtAxis = (n) =>
  new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })
    .format(Number.isFinite(+n) ? +n : 0);

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: '#0B0B0C',
        border: '1px solid #2A2A2E',
        color: 'white',
        padding: '8px 10px',
        fontSize: 12,
        borderRadius: 10,
      }}
    >
      <div style={{ opacity: 0.8, marginBottom: 4 }}>{p.full}</div>
      <div><b>Pendapatan:</b> Rp {fmtMoney(p.total)}</div>
      {p.count != null && <div><b>Transaksi:</b> {p.count}</div>}
    </div>
  );
}

/**
 * Props:
 *  - rows: [{ date: 'YYYY-MM-DD', total: number, count?: number }]
 *  - height?: number (default 260)
 */
export default function RevenueBar({ rows = [], height = 260 }) {
  const data = useMemo(
    () =>
      (rows || []).map((r) => ({
        name: r.date?.slice(5),         // tampil MM-DD
        full: r.date,
        total: Number(r.total || 0),
        count: Number(r.count || 0),
      })),
    [rows]
  );

  if (data.length === 0) {
    return (
      <div className="w-full h-64 border rounded-xl flex items-center justify-center text-xs text-slate-400">
        Tidak ada data dalam rentang tanggal ini
      </div>
    );
  }

  // Skala Y nyaman + headroom
  const max = Math.max(1, ...data.map((d) => d.total));
  const yMax = Math.ceil(max * 1.15);

  // Jika banyak bar, miringkan label X biar tidak menumpuk
  const manyBars = data.length > 8;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 6, right: 12, bottom: manyBars ? 24 : 8, left: 6 }}
          barSize={Math.max(18, 36 - Math.max(0, data.length - 8))}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
          <XAxis
            dataKey="name"
            stroke="#E5E7EB"
            tick={{ fontSize: 11 }}
            angle={manyBars ? -45 : 0}
            textAnchor={manyBars ? 'end' : 'middle'}
            height={manyBars ? 40 : 24}
          />
          <YAxis
            stroke="#E5E7EB"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `Rp ${fmtAxis(v)}`}
            domain={[0, yMax]}
            width={56}
          />
          <Tooltip content={<Tip />} />
          <Legend
            verticalAlign="top"
            height={20}
            wrapperStyle={{ fontSize: 11, color: '#E5E7EB' }}
          />
          {/* warna bar: biru lembut, rounded top */}
          <Bar dataKey="total" name="Pendapatan" fill="#60A5FA" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
