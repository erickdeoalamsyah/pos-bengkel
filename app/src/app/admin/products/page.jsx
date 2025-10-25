"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJSON, deleteJSON } from "@/lib/form";
import Swal from "sweetalert2";

function nf(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n || 0);
  } catch {
    return n;
  }
}

export default function ProductsPage() {
  const [cats, setCats] = useState([]);
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadCats() {
    const data = await getJSON("/api/v1/categories?active=true");
    setCats(data.data || []);
  }
  async function loadProducts(p = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", p);
      params.set("pageSize", pageSize);
      if (q) params.set("q", q);
      if (categoryId) params.set("categoryId", categoryId);
      const data = await getJSON(`/api/v1/products?${params.toString()}`);
      setList(data.data || []);
      setPage(data.page || 1);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCats();
    loadProducts(1);
  }, []);
  useEffect(() => {
    loadProducts(1);
  }, [categoryId]);
  useEffect(() => {
    const t = setTimeout(() => loadProducts(1), 300);
    return () => clearTimeout(t);
  }, [q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function onDelete(item) {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Hapus produk?",
      text: `Anda yakin ingin menghapus "${item.name}"? Aksi ini tidak dapat dibatalkan.`,
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      background: "#0b0b0c",
      color: "#fff",
    }).then((r) => r.isConfirmed);
    if (!ok) return;

    try {
      await deleteJSON(`/api/v1/products/${item.id}`);
      await Swal.fire({
        icon: "success",
        title: "Terhapus",
        timer: 1200,
        showConfirmButton: false,
        background: "#0b0b0c",
        color: "#fff",
      });
      loadProducts(page);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Gagal menghapus",
        text: e?.message || "Produk sudah pernah dipakai pada transaksi",
        background: "#0b0b0c",
        color: "#fff",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produk</h1>
        <Link
          href="/admin/products/new"
          className="rounded-xl text-sm border border-white/10 px-3 py-2 bg-emerald-500/15 text-emerald-400 hover:bg-white/10"
        >
          + Tambah Produk
        </Link>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-2">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl border border-white/20 px-3 py-2 bg-black text-gray-400"
        >
          <option value="">Semua kategori</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama / item / motor..."
          className="rounded-xl border border-white/20 px-3 py-2 bg-black placeholder:text-slate-400"
        />
      </div>

      <div className="bg-black text-gray-400 rounded-xl border border-white/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left p-3">SKU</th>
              <th className="text-left p-3">Nama</th>
              <th className="text-left p-3">Kategori</th>
              <th className="text-right p-3">Harga</th>
              <th className="text-right p-3">Stok</th>
              <th className="text-left p-3">Unit</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={8}>
                  Loading…
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={8}>
                  Tidak ada data
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="border-b border-white/20 last:border-none">
                  <td className="p-3">{item.sku}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.category?.name}</td>
                  <td className="p-3 text-right">Rp {nf(item.price)}</td>
                  {/* <td className="p-3 text-right">{item.stock}</td> */}
                  <td className="p-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span> {item.stock} </span>
                      {(item.stock ?? 0) <= (item.lowStockThreshold ?? 3) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 ring-1 ring-red-500/30">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{item.unit}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-3 py-2 rounded-full ring-1 ${
                        item.active
                          ? "bg-green-900/30 text-green-300 ring-green-700/50"
                          : "bg-slate-800 text-slate-300 ring-slate-600/60"
                      }`}
                    >
                      {item.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <Link
                      href={`/admin/products/${item.id}/edit`}
                      className="rounded-full bg-emerald-500/15 text-emerald-500 border border-white/20 px-3 px-3 py-2 hover:bg-white/10"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => onDelete(item)}
                      className="rounded-full bg-red-600/15 text-red-600 border border-white/20 px-3 px-3 px-3 py-1.5 hover:bg-white/10"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className=" flex items-center justify-between text-sm">
        <div>Total: {total}</div>
        <div className="flex items-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              loadProducts(p);
            }}
            className="rounded-full bg-emerald-500/15 border border-white/10 px-3 py-1 disabled:opacity-50 disabled:bg-red-600/15"
          >
            Prev
          </button>
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              const p = Math.min(totalPages, page + 1);
              setPage(p);
              loadProducts(p);
            }}
            className="rounded-full bg-emerald-500/15 border border-white/10 px-3 py-1 disabled:opacity-50 disabled:bg-red-600/15"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
