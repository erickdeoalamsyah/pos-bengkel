'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getJSON, postJSON } from '@/lib/form';
import Swal from 'sweetalert2';

// ===== Utilities =====
const nf = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
const onlyDigits = (s) => String(s ?? '').replace(/\D/g, '');
const toNum = (s) => Number(onlyDigits(s)) || 0;

// Simple currency input that keeps raw number, shows with dots
function CurrencyInput({ value, onChange, placeholder = 'contoh: 50.000', ...rest }) {
  const display = value === '' ? '' : nf(Number(onlyDigits(value)));
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 bg-black text-white focus-within:ring-2 focus-within:ring-white/20">
      <span className="text-slate-400 select-none">Rp</span>
      <input
        {...rest}
        inputMode="numeric"
        value={display}
        onChange={(e) => onChange(onlyDigits(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none"
      />
    </div>
  );
}

export default function ProductNewPage() {
  const router = useRouter();

  const [cats, setCats] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sku: '',
    name: '',
    categoryId: '',
    unit: 'pcs',
    price: '',
    cost: '',
    stock: '',
    lowStockThreshold: '',
  });

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    (async () => {
      const cs = await getJSON('/api/v1/categories?active=true');
      setCats(cs.data || []);
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        categoryId: form.categoryId,
        unit: form.unit || 'pcs',
        price: toNum(form.price),
        cost: form.cost ? toNum(form.cost) : undefined,
        stock: form.stock ? toNum(form.stock) : 0,
        lowStockThreshold: form.lowStockThreshold ? toNum(form.lowStockThreshold) : 0,
      };

      if (!body.sku || !body.name || !body.categoryId) {
        throw new Error('Lengkapi SKU, Nama, dan Kategori.');
      }

      await postJSON('/api/v1/products', body);
      await Swal.fire({
        icon: 'success',
        title: 'Produk dibuat',
        timer: 1200,
        showConfirmButton: false,
        background: '#0b0b0c',
        color: '#fff',
      });
      router.push('/admin/products');
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: e?.message || 'Gagal membuat produk',
        background: '#0b0b0c',
        color: '#fff',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Tambah Produk</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="grid lg:grid-cols-2 gap-4">
        {/* Kartu kiri: info utama */}
        <section className="rounded-2xl border border-white/20 bg-black text-white p-4 space-y-3 pb-10">
          <div className="font-medium mb-2">Info Utama</div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => onChange('sku', e.target.value)}
                placeholder="contoh: YTZ7S"
                className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Nama Produk</label>
              <input
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="contoh: Aki Yuasa YTZ7S"
                className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Kategori</label>
              <select
                value={form.categoryId}
                onChange={(e) => onChange('categoryId', e.target.value)}
                className="rounded-full border border-white/20 px-3 py-2 bg-black text-white"
              >
                <option value="">pilih kategori</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Satuan</label>
              <input
                value={form.unit}
                onChange={(e) => onChange('unit', e.target.value)}
                placeholder="pcs / botol / set"
                className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Kartu kanan: harga & stok */}
        <section className="rounded-2xl border border-white/20 bg-black text-white p-4 space-y-3">
          <div className="font-medium mb-2">Harga & Stok</div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Harga Jual</label>
              <CurrencyInput
                value={form.price}
                onChange={(v) => onChange('price', v)}
                placeholder="contoh: 125.000"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Harga Pokok (opsional)</label>
              <CurrencyInput
                value={form.cost}
                onChange={(v) => onChange('cost', v)}
                placeholder="contoh: 95.000"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Stok Awal</label>
              <input
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => onChange('stock', onlyDigits(e.target.value))}
                placeholder="contoh: 10"
                className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Batas Stok Minim (opsional)</label>
              <input
                inputMode="numeric"
                value={form.lowStockThreshold}
                onChange={(e) => onChange('lowStockThreshold', onlyDigits(e.target.value))}
                placeholder="contoh: 3"
                className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </section>
      </form>

      {/* Footer action (mobile friendly) */}
      <div className="flex justify-end gap-2">
        <Link href="/admin/products" className="rounded-full border border-white/20 px-4 py-2 bg-red-600/15 text-red-600 hover:bg-white/10">
          Batal
        </Link>
        <button
          onClick={onSubmit}
          disabled={saving}
          className="rounded-full border border-white/20 px-4 py-2 bg-emerald-500/15 text-emerald-500 hover:bg-white/20 disabled:opacity-60"
        >
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}
