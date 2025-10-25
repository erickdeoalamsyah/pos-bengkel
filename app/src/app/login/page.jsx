// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuthStore } from '@/stores/auth';

// export default function LoginPage() {
//   const router = useRouter();
//   const login = useAuthStore((s) => s.login);
//   const [username, setUsername] = useState('owner');
//   const [password, setPassword] = useState('admin123');
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setErr('');
//     setLoading(true);
//     try {
//       const data = await login(username, password);
//       // arahkan berdasarkan role
//       if (data?.user?.role === 'ADMIN') router.push('/admin');
//       else router.push('/pos');
//     } catch (e) {
//       setErr(e.message || 'Login gagal');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
//       <form
//         onSubmit={onSubmit}
//         className="w-full max-w-sm bg-white p-6 rounded-2xl shadow"
//       >
//         <h1 className="text-2xl font-semibold mb-6 text-slate-800">Masuk Bengkel Kasir</h1>

//         {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

//         <label className="block mb-2 text-sm text-slate-600">Username</label>
//         <input
//           className="mb-4 w-full text-black rounded-lg border px-3 py-2 outline-none focus:ring focus:ring-slate-200"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           autoFocus
//           placeholder="username"
//         />

//         <label className="block mb-2 text-sm text-slate-600">Password</label>
//         <input
//           type="password"
//           className="mb-6 w-full text-black rounded-lg border px-3 py-2 outline-none focus:ring focus:ring-slate-200"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="••••••••"
//         />

//         <button
//           disabled={loading}
//           className="w-full rounded-lg bg-black text-white py-2.5 hover:opacity-90 disabled:opacity-50"
//         >
//           {loading ? 'Masuk...' : 'Masuk'}
//         </button>

//         <p className="mt-4 text-center text-xs text-slate-500">
//           Gunakan akun: <b>fela / ferdilamotor</b> (seed).
//         </p>
//       </form>
//     </div>
//   );
// }
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PublicGate from '@/components/PublicGate';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage() {
  return (
    <PublicGate>
      <LoginInner />
    </PublicGate>
  );
}

function LoginInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const roleHint = (sp.get('role') || '').toLowerCase(); // 'cashier' | 'admin' | ''
  const { login } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (roleHint === 'admin') return 'Login Admin / Owner';
    if (roleHint === 'cashier') return 'Login Kasir';
    return 'Login';
  }, [roleHint]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await login(username.trim(), password);
      // setelah login, arahkan sesuai role dari server
      const role = res?.user?.role;
      if (role === 'ADMIN') router.replace('/admin');
      else router.replace('/pos');
    } catch (e) {
      setErr(e.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-emerald-600/15 text-white rounded-2xl border border-white/20 p-6">
        <h1 className="text-xl font-semibold mb-1 uppercase">{title}</h1>
        {roleHint && (
          <p className="text-xs text-slate-300 mb-4">
            {roleHint === 'admin'
              ? 'Gunakan akun admin / owner untuk mengelola data dan laporan.'
              : 'Gunakan akun kasir untuk melakukan transaksi harian.'}
          </p>
        )}

        {err && <div className="mb-3 text-sm text-red-500">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={username}
            onChange={e=>setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-2xl border border-white/20 px-3 py-2 bg-black text-white"
          />
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-white/20 px-3 py-2 bg-black text-white"
          />
          <button
            disabled={loading}
            className="w-full rounded-2xl border border-white/20 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-300">
          Bukan halaman yang Anda cari?
          {' '}<a href="/" className="underline text-emerald-600 hover:text-white">Kembali ke pilihan peran</a>
        </div>
      </div>
    </div>
  );
}
