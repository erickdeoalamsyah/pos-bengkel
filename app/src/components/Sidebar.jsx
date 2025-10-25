// "use client";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useAuthStore } from "@/stores/auth";
// import { useState } from "react";
// import { Menu, X, LogOut } from "lucide-react"; // kalau belum punya lucide, hapus & pakai teks.

// function NavItem({ href, label, icon, active, onClick }) {
//   return (
//     <Link
//       href={href}
//       onClick={onClick}
//       className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm
//         ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"}`}
//     >
//       {icon ? icon : null}
//       <span>{label}</span>
//     </Link>
//   );
// }

// export default function Sidebar() {
//   const pathname = usePathname();
//   const user = useAuthStore((s) => s.user);
//   const logout = useAuthStore((s) => s.logout);
//   const [open, setOpen] = useState(false);

//   const common = [
//     { href: "/pos", label: "POS" },
//     { href: "/admin/transactions", label: "Riwayat" },
//   ];
//   const adminOnly = [
//     { href: "/admin/dashboard", label: "Dashboard" },
//     { href: "/admin/products", label: "Produk" },
//     { href: "/admin/categories", label: "Kategori" },
//     { href: "/admin/mechanics", label: "Mekanik" },
//     { href: "/admin/settings", label: "Settings" },
//   ];

//   const links = user?.role === "ADMIN" ? [...adminOnly, ...common] : common;

//   return (
//     <>
//       {/* mobile top bar */}
//       <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14
//                       bg-black/80 backdrop-blur border-b border-white/10">
//         <button onClick={() => setOpen(true)} className="p-2 rounded-lg border border-white/10"> <Menu size={18}/></button>
//         <div className="font-semibold">Arda Garage</div>
//         <button
//           onClick={() => { try { logout?.(); } catch {} localStorage.removeItem("token"); location.href="/login"; }}
//           className="px-3 py-1.5 rounded-lg border border-white/10"
//         >Logout</button>
//       </div>

//       {/* sidebar */}
//       <aside className={`fixed z-40 inset-y-0 left-0 w-54 bg-[#0B0B0B] border-r border-white/10
//                          lg:translate-x-0 transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
//         <div className="h-14 hidden lg:flex items-center px-4 border-b border-white/10">
//           <div className="font-semibold">Arda Garage</div>
//         </div>
//         <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/10">
//           <div className="font-semibold">Menu</div>
//           <button onClick={() => setOpen(false)} className="p-2 rounded-lg border border-white/10"><X size={18}/></button>
//         </div>

//         <div className="px-3 py-3 space-y-1">
//           {links.map((l) => (
//             <NavItem
//               key={l.href}
//               href={l.href}
//               label={l.label}
//               active={pathname.startsWith(l.href)}
//               onClick={() => setOpen(false)}
//             />
//           ))}
//         </div>

//         <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3">
//           <div className="text-xs text-gray-200 font-semibold uppercase mb-2">
//             {user ? `Hi, ${user.username || user.name} (${user.role})` : ""}
//           </div>
//           <button
//             onClick={() => { try { logout?.(); } catch {} localStorage.removeItem("token"); location.href="/login"; }}
//             className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-600 border border-white/10 hover:bg-red-700 text-sm"
//           >
//             <LogOut size={16}/> Logout
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// }
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { useState, useMemo } from "react";
import {
  Menu, X, LogOut, LayoutDashboard, ShoppingCart, ReceiptText,
  Package, FolderTree, Wrench, Settings, ChevronRight
} from "lucide-react";

/* ========== kecil2 UI ========== */

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-xl bg-white/10 flex items-center justify-center">
        <Wrench size={16} />
      </div>
      <div className="font-semibold text-sm tracking-wide">FERDILA GARAGE</div>
    </div>
  );
}

function NavItem({ href, label, icon, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
        active
          ? "bg-blue-900 text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
          active
            ? "border-white/20 bg-white/10"
            : "border-white/10 bg-white/5 group-hover:border-white/20",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {active && <ChevronRight size={16} className="opacity-70" />}
    </Link>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </div>
  );
}

/* ========== Sidebar ========== */

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  // daftar link (ADMIN dapat semua, CASHIER hanya sebagian)
  const common = [
    { href: "/pos", label: "POS", icon: <ShoppingCart size={16} /> },
    { href: "/admin/transactions", label: "Riwayat", icon: <ReceiptText size={16} /> },
  ];

  const adminOnly = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/admin/products", label: "Produk", icon: <Package size={16} /> },
    { href: "/admin/categories", label: "Kategori", icon: <FolderTree size={16} /> },
    { href: "/admin/mechanics", label: "Mekanik", icon: <Wrench size={16} /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  const links = useMemo(
    () => (user?.role === "ADMIN" ? [...adminOnly, ...common] : common),
    [user?.role]
  );

  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  function doLogout() {
    try { logout?.(); } catch {}
    try { localStorage.removeItem("token"); } catch {}
    location.href = "/login";
  }

  return (
    <>
      {/* Top bar mobile */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14
                      bg-black/80 backdrop-blur border-b border-white/10">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/5"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <Brand />
        <button
          onClick={doLogout}
          className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-sm"
        >
          Logout
        </button>
      </div>

      {/* Overlay (mobile) */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={[
          "fixed z-50 inset-y-0 left-0 w-54 bg-[#0B0B0B] border-r border-white/10",
          "lg:translate-x-0 transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Brand */}
        <div className="h-14 hidden lg:flex items-center px-4 border-b border-white/10">
          <Brand />
        </div>

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/10">
          <Brand />
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="py-3 space-y-2 overflow-y-auto h-[calc(100vh-7rem)]">
          {user?.role === "ADMIN" && (
            <>
              <SectionTitle>Admin</SectionTitle>
              <div className="px-3 space-y-1">
                {adminOnly.map((l) => (
                  <NavItem
                    key={l.href}
                    href={l.href}
                    label={l.label}
                    icon={l.icon}
                    active={isActive(l.href)}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            </>
          )}

          <SectionTitle>Kasir</SectionTitle>
          <div className="px-3 space-y-1">
            {common.map((l) => (
              <NavItem
                key={l.href}
                href={l.href}
                label={l.label}
                icon={l.icon}
                active={isActive(l.href)}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3 bg-[#0B0B0B]">
          <div className="px-1 mb-2">
            {user ? (
              <div className="text-xs">
                <div className=" text-slate-400">Masuk sebagai</div>
                <div className="flex justify-between mt-0.5 font-medium">
                  <div className="uppercase">{user.username || user.name}{" "}</div>
                  <div><span className=" text-emerald-600 rounded-md border border-white/10 bg-emerald-600/20 px-1.5 py-0.5 text-[10px] uppercase">
                    {user.role}
                  </span></div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Tidak ada sesi</div>
            )}
          </div>

          <button
            onClick={doLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                       bg-red-600/90 hover:bg-red-600 text-white text-sm transition
                       border border-white/10"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
