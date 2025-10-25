'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import { getJSON, postJSON, putJSON } from '@/lib/form';
import { apiFetch } from '@/lib/api';

export default function MechanicsPage() {
  return (
    <AuthGate allow={['ADMIN']}>
      <MechanicsInner />
    </AuthGate>
  );
}

function MechanicsInner() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // form create
  const [name, setName] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const data = await getJSON(`/api/v1/mechanics?${params.toString()}`);
      setList(data.data || []);
    } catch {
      setErr('Gagal memuat mekanik');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  // live search
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);

  async function onCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await postJSON('/api/v1/mechanics', { name: name.trim() });
      setName('');
      await load();
    } catch (e) {
      alert(e?.message || 'Gagal menambah mekanik');
    }
  }

  async function toggleActive(m) {
    try {
      await putJSON(`/api/v1/mechanics/${m.id}`, { active: !m.active });
      await load();
    } catch {
      alert('Gagal mengubah status');
    }
  }

  async function remove(m) {
    if (!confirm(`Hapus mekanik "${m.name}"? (soft delete)`)) return;
    try {
      await apiFetch(`/api/v1/mechanics/${m.id}`, { method: 'DELETE' });
      await load();
    } catch {
      alert('Gagal menghapus');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Mechanics</h1>

      {/* search + form */}
      <div className="mb-4 grid md:grid-cols-[1fr_auto] gap-2">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Cari mekanik..."
          className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-400"
        />
      </div>

      

      {err && <div className="mb-3 text-sm text-red-500">{err}</div>}

      {/* table */}
      <div className="bg-black text-white rounded-2xl border border-white/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left p-3">Nama</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan="3">Loading...</td></tr>
            ) : list.length === 0 ? (
              <tr><td className="p-3" colSpan="3">Belum ada mekanik</td></tr>
            ) : list.map(m => (
              <tr key={m.id} className="border-b border-white/20 last:border-none">
                <td className="p-3">{m.name}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ring-1 ${m.active ? 'bg-green-900/30 text-green-300 ring-green-700/50' : 'bg-slate-800 text-slate-300 ring-slate-600/60'}`}>
                    {m.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={()=>toggleActive(m)}
                    className="rounded-full border border-white/20 bg-emerald-600/15 text-emerald-600 px-3 py-1.5 hover:bg-white/10"
                  >
                    {m.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    onClick={()=>remove(m)}
                    className="rounded-full border border-white/20 bg-red-600/15 text-red-600 px-3 py-1.5 hover:bg-white/10"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='text-xl py-3 '> Tambah Mechanic</div>
      <form onSubmit={onCreate} className="mb-6 bg-black text-white rounded-2xl border border-white/20 p-4 grid md:grid-cols-[1fr_auto] gap-3">
        <input
          value={name}
          onChange={e=>setName(e.target.value)}
          placeholder="Nama mekanik (mis. Dedi)"
          className="rounded-full border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-400"
        />
        <button className="rounded-full bg-emerald-500/15 text-emerald-500 border border-white/20 px-4 hover:bg-white/10">
          Tambah
        </button>
      </form>
    </div>
  );
}
