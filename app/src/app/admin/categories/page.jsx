'use client';

import { useEffect, useMemo, useState } from 'react';
import { getJSON, postJSON, putJSON } from '@/lib/form';

export default function CategoriesPage() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [err, setErr] = useState('');

  // form create
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (onlyActive) params.set('active', 'true');
      const data = await getJSON(`/api/v1/categories?${params.toString()}`);
      setList(data.data || []);
    } catch (e) {
      setErr('Gagal load kategori');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // initial
  // live search (tanpa tombol)
  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [q, onlyActive]);

  function autoSlug(v) {
    return v.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function onCreate(e) {
    e.preventDefault();
    setErr('');
    try {
      const body = { name: name.trim(), slug: (slug || autoSlug(name)) };
      if (!body.name || !body.slug) throw new Error('Nama/slug wajib');
      await postJSON('/api/v1/categories', body);
      setName(''); setSlug('');
      await load();
    } catch (e) {
      setErr(e.message || 'Gagal membuat kategori');
    }
  }

  async function toggleActive(item) {
    try {
      await putJSON(`/api/v1/categories/${item.id}`, { active: !item.active });
      await load();
    } catch {
      alert('Gagal update status');
    }
  }

  async function rename(item, newName) {
    try {
      await putJSON(`/api/v1/categories/${item.id}`, { name: newName });
      await load();
    } catch {
      alert('Gagal rename');
    }
  }

  const filtered = useMemo(() => list, [list]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Categories</h1>

      <div className="mb-4 grid md:grid-cols-[1fr_auto_auto] gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Cari nama/slug..."
          className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-400"
        />
        {/* tombol search dihapus, karena live search */}
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyActive} onChange={e=>setOnlyActive(e.target.checked)} />
          Hanya yang aktif
        </label>
      </div>

      {err && <div className="mb-2 text-sm text-red-500">{err}</div>}
      
      

      <div className="bg-black text-gray-400 rounded-2xl border border-white/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/20 text-gray-200">
              <th className="text-left p-3">Nama</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan="4">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-3" colSpan="4">Belum ada kategori</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} className="border-b border-white/20 last:border-none">
                <td className="p-3">
                  <InlineEditText
                    value={item.name}
                    onSave={(v)=>rename(item, v)}
                  />
                </td>
                <td className="p-3">{item.slug}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ring-1 ${item.active ? 'bg-green-900/30 text-green-300 ring-green-700/50' : 'bg-slate-800 text-slate-300 ring-slate-600/60'}`}>
                    {item.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={()=>toggleActive(item)}
                    className="rounded-full border border-white/20 bg-red-600/15 text-red-600 px-3 py-1.5 hover:bg-white/10"
                  >
                    {item.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='py-4 text-xl'>Tambah Category </div>
      <form onSubmit={onCreate} className="mb-6 bg-black text-white rounded-full border border-white/20 p-4 grid md:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          value={name}
          onChange={e=>setName(e.target.value)}
          placeholder="Nama kategori (mis. Oli)"
          className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-400"
        />
        <input
          value={slug}
          onChange={e=>setSlug(e.target.value)}
          placeholder="Slug (otomatis jika kosong)"
          className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-400"
        />
        <button className="rounded-full bg-black text-white ring-1 ring-white/20 px-4 hover:bg-white/10">
          Tambah
        </button>
      </form>
    </div>
  );
}

function InlineEditText({ value, onSave }) {
  const [val, setVal] = useState(value);
  const [editing, setEditing] = useState(false);

  useEffect(()=>setVal(value), [value]);

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span>{value}</span>
        <button onClick={()=>setEditing(true)} className="text-xs rounded-full  border border-white/20 bg-emerald-500/15 text-emerald-500 px-2 py-0.5 hover:bg-white/10">Edit</button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input
        value={val}
        onChange={e=>setVal(e.target.value)}
        className="rounded-full border border-white/20 px-2 py-1 bg-black text-white"
      />
      <button
        onClick={()=>{ setEditing(false); if(val && val!==value) onSave(val); }}
        className="text-xs rounded-full bg-black text-white ring-1 ring-white/20 px-2 py-1 hover:bg-white/10"
      >
        Simpan
      </button>
      <button
        onClick={()=>{ setVal(value); setEditing(false); }}
        className="text-xs rounded-full border border-white/20 px-2 py-1"
      >
        Batal
      </button>
    </div>
  );
}
