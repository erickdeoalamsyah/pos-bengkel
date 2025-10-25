'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import { apiFetch } from '@/lib/api';

export default function SettingsPage() {
  return (
    <AuthGate allow={['ADMIN']}>
      <SettingsInner />
    </AuthGate>
  );
}

function SettingsInner() {
  const [form, setForm] = useState({ name:'', address:'', phone:'', paperWidth:58 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/v1/settings');
      const data = await res.json();
      setForm({
        name: data?.data?.name || '',
        address: data?.data?.address || '',
        phone: data?.data?.phone || '',
        paperWidth: data?.data?.paperWidth || 58,
      });
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const res = await apiFetch('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify({
        ...form,
        paperWidth: Number(form.paperWidth),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data?.message || 'Gagal menyimpan'); return; }
    setMsg('Tersimpan ✔');
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: name === 'paperWidth' ? Number(value) : value }));
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Store Nota Settings</h1>

      {msg && <div className="mb-3 text-sm">{msg}</div>}

      <form onSubmit={onSubmit} className="space-y-3 bg-black text-white rounded-2xl border border-white/20 p-4">
        <div>
          <label className="text-xs text-slate-400">Nama Bengkel</label>
          <input name="name" value={form.name} onChange={onChange}
                 className="w-full rounded-full border border-white/20 px-3 py-2 bg-black text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Alamat</label>
          <input name="address" value={form.address} onChange={onChange}
                 className="w-full rounded-full border border-white/20 px-3 py-2 bg-black text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Telepon</label>
          <input name="phone" value={form.phone} onChange={onChange}
                 className="w-full rounded-full border border-white/20 px-3 py-2 bg-black text-white" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Lebar Kertas Nota (mm)</label>
          <select name="paperWidth" value={form.paperWidth} onChange={onChange}
                  className="w-full rounded-full border border-white/20 px-3 py-2 bg-black text-white">
            <option value={58}>58</option>
            <option value={80}>80</option>
          </select>
        </div>

        <button disabled={saving} className="rounded-full border border-white/20 px-4 py-2 bg-emerald-500/15 text-emerald-500 hover:bg-white/20 disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}
