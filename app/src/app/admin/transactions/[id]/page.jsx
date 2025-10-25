
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, Printer } from 'lucide-react';

function nf(n){ try { return new Intl.NumberFormat('id-ID').format(n || 0); } catch { return n; } }

export default function TxDetailPage() {
  return (
    <AuthGate allow={['ADMIN','CASHIER']}>
      <TxDetailInner />
    </AuthGate>
  );
}

function TxDetailInner() {
  const { id } = useParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr('');
      try {
        const res = await apiFetch(`/api/v1/transactions/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Gagal memuat transaksi');
        if (alive) setTx(data.data);
      } catch (e) {
        if (alive) setErr(e.message || 'Gagal memuat transaksi');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-40 rounded bg-white/10" />
          <div className="h-28 rounded bg-white/5" />
          <div className="h-40 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-red-400 text-sm">{err}</div>
        <Link
          href="/admin/transactions"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                     bg-white text-black font-medium hover:bg-white/90
                     focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <ArrowLeft size={18} />
          Kembali ke Riwayat
        </Link>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-slate-400 text-sm">Transaksi tidak ditemukan.</div>
        <Link
          href="/admin/transactions"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                     bg-white text-black font-medium hover:bg-white/90
                     focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <ArrowLeft size={18} />
          Kembali ke Riwayat
        </Link>
      </div>
    );
  }

  const dt = new Date(tx.datetime || tx.createdAt || Date.now());
  const waktu = dt.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="space-y-5">
      {/* Header + tombol kembali */}
      <div className="flex items-center justify-between">
        <div className="">
          <Link
            href="/admin/transactions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                       bg-orange-500/15 text-orange-500 border border-white/10 font-medium hover:bg-white/10
                       focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <ArrowLeft size={18} />
            Kembali
          </Link>
          
        </div>
        <div>
            <h1 className="text-xl font-semibold leading-tight">Detail Transaksi</h1>
            <div className="text-xs text-slate-400">Kode: <b>{tx.code}</b></div>
          </div>

        <button
          onClick={() => window.open(`/print/receipt/${tx.id}`, '_blank')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                     border border-white/10 bg-emerald-500/15 text-emerald-500 hover:bg-white/10"
        >
          <Printer size={18} />
          Cetak Nota
        </button>
      </div>

      {/* status chip jika void */}
      {tx.isCanceled && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        bg-red-500/15 text-red-300 ring-1 ring-red-500/30 text-xs font-medium">
          STATUS: Dibatalkan
          {tx.cancelReason ? <span className="opacity-80">• {tx.cancelReason}</span> : null}
        </div>
      )}

      {/* ringkasan */}
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <div><span className="text-slate-400">Waktu:</span> {waktu}</div>
          <div><span className="text-slate-400">Kasir:</span> {tx.cashier?.username || '-'}</div>
          {tx.mechanicName ? <div><span className="text-slate-400">Mekanik:</span> {tx.mechanicName}</div> : null}
        </div>
        <div className="space-y-1 text-right">
          {tx.customerName ? <div><span className="text-slate-400">Pelanggan:</span> {tx.customerName}</div> : null}
          {tx.vehiclePlate ? <div><span className="text-slate-400">No. Polisi:</span> {tx.vehiclePlate}</div> : null}
        </div>
      </div>

      {/* items */}
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
        <div className="font-medium mb-2">Item</div>
        {!tx.items?.length ? (
          <div className="text-sm text-slate-400">Tidak ada item (jasa saja)</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2">Nama</th>
                  <th className="text-right p-2 w-20">Qty</th>
                  <th className="text-right p-2 w-28">Harga</th>
                  <th className="text-right p-2 w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {tx.items.map((it, i) => (
                  <tr key={i} className="border-b border-white/10 last:border-0">
                    <td className="p-2">{it.nameSnapshot || it.name}</td>
                    <td className="p-2 text-right">{it.qty}</td>
                    <td className="p-2 text-right">Rp {nf(it.price)}</td>
                    <td className="p-2 text-right">Rp {nf(it.lineTotal || it.qty * it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* totals */}
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><b>Rp {nf(tx.subtotal)}</b></div>
        <div className="flex justify-between"><span>Ongkos Mekanik</span><b>Rp {nf(tx.mechanicFee)}</b></div>
        <div className="flex justify-between text-lg"><span>Total</span><b>Rp {nf(tx.total)}</b></div>
        <div className="flex justify-between text-slate-400"><span>Uang Diterima</span><span>Rp {nf(tx.cashReceived)}</span></div>
        <div className="flex justify-between text-slate-400"><span>Kembalian</span><span>Rp {nf(tx.change)}</span></div>
      </div>
    </div>
  );
}
