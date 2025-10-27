"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { cancelTransaction } from "@/lib/tx";
import Link from "next/link";
import WibDatePicker from "@/components/WibDatePicker";

function nf(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n || 0);
  } catch {
    return n;
  }
}
function todayWibISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
} // yyyy-mm-dd

export default function TxHistoryPage() {
  return (
    <AuthGate allow={["ADMIN", "CASHIER"]}>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const [day, setDay] = useState(todayWibISO());
  const [q, setQ] = useState("");
  const [includeCanceled, setIncludeCanceled] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  async function load(p = page) {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        date: day,
        page: String(p),
        pageSize: String(pageSize),
        q,
        ...(includeCanceled ? { includeCanceled: "true" } : {}),
        _t: String(Date.now()),
      }).toString();

      const res = await apiFetch("/api/v1/transactions?" + qs);
      const data = await res.json();
      setRows(data?.data || []);
      setTotal(data?.total || 0);
      setPage(data?.page || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1); /* eslint-disable-next-line */
  }, [day, includeCanceled]);
  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  async function onCancel(row) {
    if (row.isCanceled) {
      await Swal.fire({
        icon: "info",
        title: "Sudah dibatalkan",
        text: "Transaksi ini sudah berstatus void.",
        confirmButtonText: "OK",
        background: "#0b0b0c",
        color: "#fff",
      });
      return;
    }

    const ask = await Swal.fire({
      icon: "warning",
      title: "Batalkan transaksi?",
      html: `
        <div class="text-left">
          <div class="text-sm opacity-80 mb-2">Kode: <b>${row.code}</b></div>
          <input id="void-reason" class="swal2-input" placeholder="Alasan pembatalan (opsional)" />
          <p class="text-xs opacity-70 mt-1">Stok produk akan dikembalikan.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Ya, batalkan",
      cancelButtonText: "Batal",
      background: "#0b0b0c",
      color: "#fff",
      focusConfirm: false,
      preConfirm: () => {
        const el = document.getElementById("void-reason");
        return el ? el.value : "";
      },
    });

    if (!ask.isConfirmed) return;

    try {
      await cancelTransaction(row.id, ask.value || "");
      await Swal.fire({
        icon: "success",
        title: "Dibatalkan",
        text: "Transaksi berhasil dibatalkan.",
        confirmButtonText: "OK",
        background: "#0b0b0c",
        color: "#fff",
      });
      load(page);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal membatalkan transaksi",
        confirmButtonText: "OK",
        background: "#0b0b0c",
        color: "#fff",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-xl font-semibold">Riwayat Transaksi</div>
        
        <div className="flex gap-2">
            <WibDatePicker
              value={day}
              onChange={setDay}
              className="w-full sm:w-[200px]"
            />
          
          <input
            placeholder="Cari (kode/nama/plat)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-white/10 bg-black placeholder:text-slate-500"
          />
          
          <label className="group inline-flex select-none items-center gap-2 text-sm whitespace-nowrap">
            <input
              type="checkbox"
              checked={includeCanceled}
              onChange={(e) => setIncludeCanceled(e.target.checked)}
              className="peer sr-only"
            />
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-emerald-400/40 bg-white/5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-400 peer-checked:bg-emerald-500/20 peer-checked:border-emerald-400 peer-checked:[&>svg]:opacity-100 transition-colors">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 opacity-0 transition-opacity" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 10l3 3 7-7" />
              </svg>
            </span>
            <span className="text-slate-300">
              Tampilkan <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">void</span>
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/60 p-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-2 text-left">Kode</th>
              <th className="p-2 text-left">Waktu</th>
              <th className="p-2 text-left">Pelanggan</th>
              <th className="p-2 text-left">Mekanik</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2 text-left">Kasir</th>
              <th className="p-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-3 text-slate-400">
                  Memuat…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-3 text-slate-400">
                  Tidak ada transaksi
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const dt = r.datetime ? new Date(r.datetime) : null;
                const t = dt
                  ? dt.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";
                return (
                  <tr
                    key={r.id}
                    className="border-b border-white/10 last:border-0"
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.code}</span>
                        {r.isCanceled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 ring-1 ring-red-500/30">
                            VOID
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{t}</td>
                    <td className="p-2">
                      {r.customerName || "-"}
                      {r.vehiclePlate ? ` / ${r.vehiclePlate}` : ""}
                    </td>
                    <td className="p-2">{r.mechanicName || "-"}</td>
                    <td
                      className={`p-2 text-right ${
                        r.isCanceled ? "line-through text-slate-400" : ""
                      }`}
                    >
                      Rp {nf(r.total)}
                    </td>
                    <td className="p-2">{r.cashier?.username}</td>
                    <td className="p-2 text-right">
                      <div className="inline-flex gap-2">
                        <Link
                          href={`/admin/transactions/${r.id}`}
                          className="px-2 py-1 bg-emerald-600/15 text-emerald-600 rounded-full border border-white/10 hover:bg-white/10"
                        >
                          Detail
                        </Link>
                        {!r.isCanceled && (
                          <button
                            onClick={() => onCancel(r)}
                            className="px-2 py-1 bg-red-600/15 text-red-600 rounded-full border border-white/10 hover:bg-white/10"
                          >
                            Batalkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>Total: {nf(total)}</div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded border border-white/10 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              load(p);
            }}
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded border border-white/10 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => {
              const p = Math.min(totalPages, page + 1);
              setPage(p);
              load(p);
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}