'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import { apiFetch } from '@/lib/api';

export default function ReportsPage() {
  return (
    <AuthGate allow={['ADMIN']}>
      <ReportsInner />
    </AuthGate>
  );
}

function ReportsInner() {
  const [from, setFrom] = useState(getToday());  // 'YYYY-MM-DD'
  const [to, setTo] = useState(getToday());      // 'YYYY-MM-DD'
  const [q, setQ] = useState('');

  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const qs = buildQuery({ from, to, q });

      const [sRes, lRes] = await Promise.all([
        apiFetch('/api/v1/transactions/summary?' + qs),
        apiFetch('/api/v1/transactions?' + qs),
      ]);

      const sData = await sRes.json();
      const lData = await lRes.json();

      setSummary(sData?.data || { count: 0, totalRevenue: 0, totalMechanic: 0, avgTxn: 0 });
      setRows(lData?.data || []);
    } catch {
      // biarkan kosong, tampilkan default
      setSummary({ count: 0, totalRevenue: 0, totalMechanic: 0, avgTxn: 0 });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // initial

  // live refresh saat filter berubah (debounce sederhana)
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, q]);

  async function downloadCsv() {
    try {
      const qs = buildQuery({ from, to, q });
      const res = await apiFetch('/api/v1/transactions/export?' + qs, { method: 'GET' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // abaikan error download
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>

      {/* Filters */}
      <div className="grid md:grid-cols-[auto_auto_1fr_auto] gap-2 items-end">
        <div>
          <label className="text-xs text-slate-400">Dari</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="block rounded border px-3 py-2 bg-black text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Sampai</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="block rounded border px-3 py-2 bg-black text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Cari (kode/nama/plat)</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="cth: BK-2025 / Budi / D 1234"
            className="block rounded border px-3 py-2 bg-black text-white placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={downloadCsv}
          className="rounded border px-3 py-2 hover:bg-white/10"
        >
          Download CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Jumlah Transaksi" value={loading ? '...' : (summary?.count ?? 0)} />
        <Card title="Pendapatan" value={loading ? '...' : `Rp ${fmt(summary?.totalRevenue)}`} />
        <Card title="Ongkos Mekanik" value={loading ? '...' : `Rp ${fmt(summary?.totalMechanic)}`} />
        {/* <Card title="Rata-rata/Transaksi" value={loading ? '...' : `Rp ${fmt(summary?.avgTxn)}`} /> */}
      </div>

      {/* Mechanic fees by mechanic */}
<div className="rounded-xl border bg-black text-white p-3">
  <div className="font-semibold mb-2">Ongkos Mekanik per Mekanik</div>
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b">
        <th className="text-left p-2">Mekanik</th>
        <th className="text-right p-2">Total Ongkos</th>
      </tr>
    </thead>
    <tbody>
      {(!summary?.byMechanic || summary.byMechanic.length === 0) ? (
        <tr><td className="p-2" colSpan={2}>Tidak ada data</td></tr>
      ) : summary.byMechanic
          .slice()
          .sort((a,b)=> (b.total||0) - (a.total||0))
          .map(m => (
        <tr key={m.mechanicId || m.mechanicName} className="border-b last:border-none">
          <td className="p-2">{m.mechanicName || '-'}</td>
          <td className="p-2 text-right">Rp {fmt(m.total)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      {/* Table */}
      <div className="rounded-xl border overflow-x-auto bg-black text-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Waktu</th>
              <th className="text-left p-2">Kode</th>
              <th className="text-right p-2">Total</th>
              <th className="text-left p-2">Kasir</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2" colSpan={4}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-2" colSpan={4}>Tidak ada data</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-b last:border-none">
                <td className="p-2">{formatDateTime(r.datetime)}</td>
                <td className="p-2">{r.code}</td>
                <td className="p-2 text-right">Rp {fmt(r.total)}</td>
                <td className="p-2">{r.cashier?.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function Card({ title, value }) {
  return (
    <div className="rounded-xl border p-4 bg-black text-white">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function fmt(n) {
  try { return new Intl.NumberFormat('id-ID').format(n || 0); }
  catch { return n; }
}

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(s) {
  try { return new Date(s).toLocaleString('id-ID'); }
  catch { return s; }
}

function buildQuery({ from, to, q }) {
  const p = new URLSearchParams();
  if (from) {
    const isoFrom = new Date(`${from}T00:00:00`).toISOString();
    p.set('from', isoFrom);
  }
  if (to) {
    const isoTo = new Date(`${to}T23:59:59`).toISOString();
    p.set('to', isoTo);
  }
  if (q) p.set('q', q);
  return p.toString();
}
