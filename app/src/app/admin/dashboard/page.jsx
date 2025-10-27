"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import DailyRevenueChart from "@/components/charts/DailyRevenueChart";
import DoughnutCategories from "@/components/charts/DoughnutCategories";
import WibDatePicker from "@/components/WibDatePicker";

/* ========== helpers ========== */
function nf(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n || 0);
  } catch {
    return n;
  }
}

// WIB range helper
function makeRangeWIB(dayISO, mode) {
  const base = DateTime.fromISO(dayISO, { zone: "Asia/Jakarta" });
  const endWib = base.endOf("day");
  let startWib = base.startOf("day");

  if (mode === "7d") startWib = base.minus({ days: 6 }).startOf("day");
  if (mode === "30d") startWib = base.minus({ days: 29 }).startOf("day");

  return {
    from: startWib.toUTC().toISO(),
    to: endWib.toUTC().toISO(),
    dateWib: base.toISODate(),
  };
}

function qsRange({ from, to }, extra = {}) {
  const params = new URLSearchParams({ from, to, ...extra });
  return params.toString();
}

/* ========== Page ========== */

export default function DashboardPage() {
  return (
    <AuthGate allow={["ADMIN"]}>
      <DashboardInner />
    </AuthGate>
  );
}

function DashboardInner() {
  /* filters */
  const todayWIB = useMemo(
    () => DateTime.now().setZone("Asia/Jakarta").toISODate(),
    []
  );
  const [mode, setMode] = useState("today");
  const [day, setDay] = useState(todayWIB);
  const [q, setQ] = useState("");

  const range = useMemo(() => makeRangeWIB(day, mode), [day, mode]);

  /* data states */
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    subtotal: 0,
    totalMechanic: 0,
    count: 0,
  });
  const [revDaily, setRevDaily] = useState([]);
  const [topQty, setTopQty] = useState([]);
  const [topRevenue, setTopRevenue] = useState([]);
  const [byCat, setByCat] = useState([]);
  const [mechDaily, setMechDaily] = useState([]);
  const [recent, setRecent] = useState([]);

  async function load() {
    setLoading(true);

    // 🔍 DEBUG: Log range yang dikirim ke backend
    console.log("🌍 DASHBOARD LOAD - Mode:", mode);
    console.log("🌍 DASHBOARD LOAD - Day:", day);
    console.log("🌍 DASHBOARD LOAD - Range:", {
      from: range.from,
      to: range.to,
      dateWib: range.dateWib,
    });

    try {
      const qs = qsRange(range, { _t: String(Date.now()) });
      console.log("🌍 DASHBOARD LOAD - Query String:", qs);

      const [s, r, md, tq, tr, bc, rc] = await Promise.all([
        (await apiFetch(`/api/v1/analytics/summary?${qs}`)).json(),
        (await apiFetch(`/api/v1/analytics/revenue-daily?${qs}`)).json(),
        (await apiFetch(`/api/v1/analytics/mechanics/daily?${qs}`)).json(),
        (
          await apiFetch(
            `/api/v1/analytics/products/top?${qsRange(range, { by: "qty" })}`
          )
        ).json(),
        (
          await apiFetch(
            `/api/v1/analytics/products/top?${qsRange(range, {
              by: "revenue",
            })}`
          )
        ).json(),
        (await apiFetch(`/api/v1/analytics/categories?${qs}`)).json(),
        (
          await apiFetch(
            `/api/v1/transactions?${new URLSearchParams({
              date: range.dateWib,
              page: "1",
              pageSize: "5",
              q,
            })}`
          )
        ).json(),
      ]);

      setSummary(
        s?.data || { totalRevenue: 0, subtotal: 0, totalMechanic: 0, count: 0 }
      );
      setRevDaily(r?.data || []);
      setMechDaily(md?.data || []);
      setTopQty(tq?.data || []);
      setTopRevenue(tr?.data || []);
      setByCat(bc?.data || []);
      setRecent(rc?.data || []);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }

  // Load on mount & when range changes
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [range.from, range.to, range.dateWib]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  function exportMechCsv() {
    window.open(
      "/api/v1/analytics/mechanics/daily.csv?" + qsRange(range),
      "_blank"
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Overview dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="rounded-xl border border-white/10 p-1 bg-black/60">
            {["today", "7d", "30d"].map((k) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  mode === k
                    ? "bg-blue-900 text-white"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {k === "today" ? "Today" : k === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
          <div className="w-[220px]">
            <WibDatePicker
              value={day}
              onChange={setDay}
              label="Tanggal (WIB)"
            />
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari (kode/nama/plat)"
            className="px-3 py-2 text-sm rounded-xl border border-white/10 bg-black text-white placeholder:text-slate-500"
          />

          <button
            onClick={exportMechCsv}
            className="px-3 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/10"
          >
            Export Gajian (CSV)
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-300 text-sm px-3 py-2">
          Loading data...
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Pendapatan" value={"Rp " + nf(summary?.totalRevenue)} />
        <Card title="Jumlah Transaksi" value={nf(summary?.count)} />
        <Card title="Subtotal Barang" value={"Rp " + nf(summary?.subtotal)} />
        <Card
          title="Total Ongkos Mekanik"
          value={"Rp " + nf(summary?.totalMechanic)}
        />
      </div>

      {/* Revenue + Top Produk */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Pendapatan Harian">
          <DailyRevenueChart rows={revDaily} />
        </Panel>

        <Panel title="Top Produk">
          <div className="grid md:grid-cols-2 gap-4">
            <TopList title="By Qty" rows={topQty} colKey="qty" />
            <TopList
              title="By Revenue"
              rows={topRevenue}
              colKey="revenue"
              money
            />
          </div>
        </Panel>
      </div>

      {/* Kategori + Aktivitas */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Pendapatan per Kategori">
          <DoughnutCategories rows={byCat} />
        </Panel>
        <Panel title={`Aktivitas Terbaru (${range.dateWib})`}>
          <RecentList rows={recent} />
        </Panel>
      </div>

      {/* Ongkos Mekanik per Hari */}
      <Panel title="Ongkos Mekanik per Hari">
        <MechTable rows={mechDaily} />
      </Panel>
    </div>
  );
}

/* ========== small UI ========== */

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-4">
      <div className="font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-4">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value ?? "-"}</div>
    </div>
  );
}

function TopList({ title, rows, colKey, money = false }) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <div className="font-medium mb-2">{title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-2">Produk</th>
            <th className="text-right p-2">
              {title.includes("Qty") ? "Qty" : "Nilai"}
            </th>
          </tr>
        </thead>
        <tbody>
          {!rows?.length ? (
            <tr>
              <td className="p-2" colSpan={2}>
                Tidak ada data
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-white/10 last:border-0">
                <td className="p-2">{r.name}</td>
                <td className="p-2 text-right">
                  {money ? "Rp " + nf(r[colKey]) : nf(r[colKey])}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function MechTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-2">Tanggal</th>
            <th className="text-left p-2">Mekanik</th>
            <th className="text-right p-2">Total Ongkos</th>
          </tr>
        </thead>
        <tbody>
          {!rows?.length ? (
            <tr>
              <td className="p-2" colSpan={3}>
                Tidak ada data
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-white/10 last:border-0">
                <td className="p-2">{r.date}</td>
                <td className="p-2">{r.mechanicName || "-"}</td>
                <td className="p-2 text-right">Rp {nf(r.total)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function RecentList({ rows }) {
  return (
    <div className="space-y-2">
      {!rows?.length ? (
        <div className="text-sm text-slate-400">Tidak ada transaksi.</div>
      ) : (
        rows.map((r) => {
          const dt = r.datetime ? new Date(r.datetime) : null;
          const time = dt
            ? dt.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";
          return (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-white/10 p-3"
            >
              <div className="text-sm">
                <div className="font-medium">
                  {r.code} • Rp {nf(r.total)}
                </div>
                <div className="text-xs text-slate-400">
                  {time} — {r.customerName || "-"}
                  {r.vehiclePlate ? ` / ${r.vehiclePlate}` : ""} — Mekanik:{" "}
                  {r.mechanicName || "-"}
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {r.cashier?.username || ""}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
