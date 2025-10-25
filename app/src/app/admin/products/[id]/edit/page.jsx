'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getJSON, putJSON } from '@/lib/form';
import Swal from 'sweetalert2';

// ===== Utilities & currency input =====
const nf = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
const onlyDigits = (s) => String(s ?? '').replace(/\D/g, '');
const toNum = (s) => Number(onlyDigits(s)) || 0;

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

export default function ProductEditPage(props) {
  // Next 15: params adalah Promise
  const { id } = use(props.params);

  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
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
    active: true,
  });

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const [cs, pd] = await Promise.all([
          getJSON('/api/v1/categories?active=true'),
          getJSON(`/api/v1/products/${id}`),
        ]);
        setCats(cs.data || []);

        const p = pd.data;
        setForm({
          sku: p.sku || '',
          name: p.name || '',
          categoryId: p.categoryId || '',
          unit: p.unit || 'pcs',
          price: String(p.price ?? ''),
          cost: String(p.cost ?? ''),
          stock: String(p.stock ?? ''),
          lowStockThreshold: String(p.lowStockThreshold ?? ''),
          active: !!p.active,
        });
      } catch (e) {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal memuat data produk',
          text: e?.message || 'Not found',
          background: '#0b0b0c',
          color: '#fff',
        });
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        categoryId: form.categoryId || undefined,
        unit: form.unit || 'pcs',
        price: toNum(form.price),
        cost: form.cost ? toNum(form.cost) : undefined,
        stock: form.stock ? toNum(form.stock) : undefined,
        lowStockThreshold: form.lowStockThreshold ? toNum(form.lowStockThreshold) : undefined,
        active: !!form.active,
      };

      await putJSON(`/api/v1/products/${id}`, body);
      await Swal.fire({
        icon: 'success',
        title: 'Perubahan disimpan',
        timer: 1200,
        showConfirmButton: false,
        background: '#0b0b0c',
        color: '#fff',
      });
      router.push('/admin/products');
    } catch (e) {
      await Swal.fire({
        icon: 'error',
        title: 'Gagal menyimpan',
        text: e?.message || 'Error',
        background: '#0b0b0c',
        color: '#fff',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {/* <div className="text-xs text-slate-400">
            <Link href="/admin/products" className="hover:underline">
              Produk
            </Link>{' '}
            / Edit
          </div> */}
          <h1 className="text-2xl font-semibold">Edit Produk</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="grid lg:grid-cols-2 gap-4">
        {/* Info Utama */}
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
                <option value="">(tetap) kategori sekarang</option>
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

          {/* <div className="flex items-center gap-2 pt-2">
            <input
              id="active"
              type="checkbox"
              checked={!!form.active}
              onChange={(e) => onChange('active', e.target.checked)}
            />
            <label htmlFor="active" className="text-sm">
              Aktif
            </label>
          </div> */}
        </section>

        {/* Harga & Stok */}
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
              {/* <p className="text-[11px] text-slate-500">Nilai yang disimpan berupa angka murni.</p> */}
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
              <label className="text-xs text-slate-400">Stok</label>
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

      {/* Footer action */}
      <div className="flex justify-end gap-2">
        <Link href="/admin/products" className="rounded-full border border-white/20 bg-red-600/15 text-red-600 px-4 py-2 hover:bg-white/10">
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
