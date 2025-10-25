'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import { apiFetch } from '@/lib/api';

export default function StockPage() {
  return (
    <AuthGate allow={['ADMIN']}>
      <StockInner />
    </AuthGate>
  );
}

function StockInner() {
  const [from, setFrom] = useState(getToday());
  const [to, setTo] = useState(getToday());
  const [type, setType] = useState(''); // '', IN, OUT
  const [productQ, setProductQ] = useState('');
  const [productList, setProductList] = useState([]);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('RESTOCK');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // load produk untuk select (search)
  useEffect(() => {
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ page: '1', pageSize: '50' });
      if (productQ) params.set('q', productQ);
      const res = await apiFetch('/api/v1/products?' + params.toString());
      const data = await res.json();
      setProductList(data.data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [productQ]);

  async function loadLogs() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('from', new Date(`${from}T00:00:00`).toISOString());
    params.set('to', new Date(`${to}T23:59:59`).toISOString());
    if (type) params.set('type', type);
    const res = await apiFetch('/api/v1/stock-adjustments?' + params.toString());
    const data = await res.json();
    setRows(data.data || []);
    setLoading(false);
  }
  useEffect(() => { loadLogs(); }, []);
  useEffect(() => {
    const t = setTimeout(loadLogs, 300);
    return () => clearTimeout(t);
  }, [from, to, type]);

  async function submitAdj(e) {
    e.preventDefault();
    if (!productId || !qty) return;
    const body = {
      productId,
      type: type || 'IN',
      qty: Number(qty),
      reason,
      note: note || undefined,
    };
    const res = await apiFetch('/api/v1/stock-adjustments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.message || 'Gagal menyimpan'); return;
    }
    // clear form
    setQty(''); setNote(''); setProductId('');
    await loadLogs();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Stock Adjustments</h1>

      {/* form create */}
      <form onSubmit={submitAdj} className="rounded-xl border p-4 bg-black text-white grid md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs text-slate-400">Cari Produk</label>
          <input
            value={productQ}
            onChange={e=>setProductQ(e.target.value)}
            placeholder="Nama/SKU..."
            className="w-full rounded border px-3 py-2 bg-black text-white"
          />
          <select
            value={productId}
            onChange={e=>setProductId(e.target.value)}
            className="mt-2 w-full rounded border px-3 py-2 bg-black text-white"
          >
            <option value="">— pilih dari hasil pencarian —</option>
            {productList.map(p => (
              <option key={p.id} value={p.id}>{p.sku} — {p.name} (stok: {p.stock})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Tipe</label>
          <select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded border px-3 py-2 bg-black text-white">
            <option value="IN">IN (Tambah)</option>
            <option value="OUT">OUT (Kurangi)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Jumlah</label>
          <input value={qty} onChange={e=>setQty(e.target.value)} className="w-full rounded border px-3 py-2 bg-black text-white" />
        </div>

        <div className="md:col-span-5 grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400">Alasan</label>
            <select value={reason} onChange={e=>setReason(e.target.value)} className="w-full rounded border px-3 py-2 bg-black text-white">
              <option>RESTOCK</option>
              <option>CORRECTION</option>
              <option>WASTE</option>
              <option>RETURN</option>
              <option>OTHER</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-400">Catatan (opsional)</label>
            <input value={note} onChange={e=>setNote(e.target.value)} className="w-full rounded border px-3 py-2 bg-black text-white" />
          </div>
        </div>

        <div className="md:col-span-5 text-right">
          <button className="rounded px-4 py-2 bg-white/10 hover:bg-white/20">Simpan Adjustment</button>
        </div>
      </form>

      {/* filters */}
      <div className="grid md:grid-cols-[auto_auto_auto] gap-2 items-end">
        <div>
          <label className="text-xs text-slate-400">Dari</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="rounded border px-3 py-2 bg-black text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Sampai</label>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded border px-3 py-2 bg-black text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Tipe</label>
          <select value={type} onChange={e=>setType(e.target.value)} className="rounded border px-3 py-2 bg-black text-white">
            <option value="">Semua</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </div>
      </div>

      {/* table logs */}
      <div className="rounded-xl border bg-black text-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Waktu</th>
              <th className="text-left p-2">Produk</th>
              <th className="text-left p-2">Tipe</th>
              <th className="text-right p-2">Qty</th>
              <th className="text-right p-2">Before → After</th>
              <th className="text-left p-2">Alasan</th>
              <th className="text-left p-2">User</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2" colSpan={7}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-2" colSpan={7}>Tidak ada data</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-b last:border-none">
                <td className="p-2">{new Date(r.createdAt).toLocaleString('id-ID')}</td>
                <td className="p-2">{r.product?.sku} — {r.product?.name}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2 text-right">{r.qty}</td>
                <td className="p-2 text-right">{r.beforeStock} → {r.afterStock}</td>
                <td className="p-2">{r.reason || '-'}</td>
                <td className="p-2">{r.user?.username || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}
