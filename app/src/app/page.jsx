'use client';

import Link from 'next/link';
import PublicGate from '@/components/PublicGate';

export default function Landing() {
  return (
    <PublicGate>
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-2xl font-bold mb-2">Selamat datang di POS Bengkel Ferdila Motor</h1>
          <p className="text-slate-400 mb-6">Pilih peran untuk mulai menggunakan aplikasi.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* KASIR */}
            <Link
              href="/login?role=cashier"
              className="rounded-full border border-white/20 p-6 bg-emerald-600/15 text-emerald-500 hover:bg-white/10"
            >
              <div className="text-lg text-gray-300 font-semibold mb-1 uppercase">Login Kasir</div>
              <div className="text-sm">
                Untuk melakukan transaksi, menambah item ke keranjang, dan mencetak nota.
              </div>
            </Link>

            {/* ADMIN */}
            <Link
              href="/login?role=admin"
              className="rounded-full border border-white/20 p-6 bg-emerald-600/15 text-emerald-500 hover:bg-white/10"
            >
              <div className="text-lg text-gray-300 font-semibold mb-1 uppercase">Login Admin / Owner</div>
              <div className="text-sm">
                Kelola produk, kategori, mekanik, dan lihat laporan.
              </div>
            </Link>
          </div>

          <div className="mt-6 text-sm text-gray-300">
            Butuh bantuan? Hubungi owner. Akun kasir & admin dibuat oleh admin.
          </div>
        </div>
      </div>
    </PublicGate>
  );
}
