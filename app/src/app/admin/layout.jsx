// 'use client';
// import Link from 'next/link';
// import { useAuthStore } from '@/stores/auth';
// import AuthGate from '@/components/AuthGate';

// export default function AdminLayout({ children }) {
//   const user = useAuthStore(s => s.user);
//   const logout = useAuthStore(s => s.logout);

//   return (
//     <AuthGate allow={['ADMIN']}>
//       <div className="min-h-screen grid grid-rows-[auto_1fr]">
//         <header className="border-b bg-black">
//           <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
//             <nav className="flex items-center gap-4 text-sm">
//               <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
//               <Link href="/admin/categories" className="hover:underline">Categories</Link>
//               <Link href="/admin/products" className="hover:underline">Products</Link>
//               <Link href="/admin/reports" className="hover:underline">Reports</Link>
//               <Link href="/admin/mechanics" className="hover:underline">Mechanics</Link>
//               <Link href="/admin/stock" className="hover:underline">Stock</Link>
//               <Link href="/admin/settings" className="hover:underline">Settings</Link>
//               <Link href="/admin/transactions" className="hover:underline">history Transaction</Link>


//             </nav>
//             <div className="text-sm flex items-center gap-3">
//               <span className="text-slate-600">{user?.username} ({user?.role})</span>
//               <button onClick={logout} className="rounded border px-2 py-1 hover:bg-slate-50">Logout</button>
//             </div>
//           </div>
//         </header>
//         <main className="max-w-5xl mx-auto w-full px-4 py-6">
//           {children}
//         </main>
//       </div>
//     </AuthGate>
//   );
// }
// import "./globals.css";
// src/app/admin/layout.jsx
import Sidebar from "@/components/Sidebar";
import "@/lib/charts"; // <- perbaikan: pakai 'charts'
import LowStockWatcher from "@/components/LowStockWatcher";

export default function AdminLayout({ children }) {
  return (
    <>
      <Sidebar />
      <LowStockWatcher n={3} everyMs={180000} />
      {/* content wrapper: left padding = sidebar width */}
      <div className="lg:pl-54">
        <main className="px-4 md:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </>
  );
}

