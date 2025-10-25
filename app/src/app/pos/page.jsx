"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";

export default function PosPage() {
  return (
    <AuthGate allow={["ADMIN", "CASHIER"]}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <POSInner />
      </div>
    </AuthGate>
  );
}

function POSInner() {
  // ===== auth =====
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  function doLogout() {
    try {
      logoutStore?.();
    } catch {}
    try {
      localStorage.removeItem("token");
    } catch {}
    window.location.href = "/";
  }

  // ===== cart store (logic sama persis) =====
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const total = useCartStore((s) => s.total());
  const change = useCartStore((s) => s.change());
  const {
    addItem,
    inc,
    dec,
    remove,
    reset,
    mechanicName,
    mechanicFee,
    setMechanicName,
    setMechanicFee,
    customerName,
    setCustomerName,
    vehiclePlate,
    setVehiclePlate,
    cashReceived,
    setCashReceived,
  } = useCartStore();

  // ===== masters =====
  const [cats, setCats] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProd, setLoadingProd] = useState(false);

  const [mechanics, setMechanics] = useState([]);
  const [mechanicId, setMechanicId] = useState("");
  useEffect(() => {
    const sel = mechanics.find((m) => m.id === mechanicId);
    setMechanicName(sel?.name || "");
  }, [mechanicId, mechanics, setMechanicName]);

  // modal detail
  const [txModal, setTxModal] = useState(null);

  // load masters
  useEffect(() => {
    (async () => {
      const [cs, ms] = await Promise.all([
        (await apiFetch("/api/v1/categories?active=true")).json(),
        (await apiFetch("/api/v1/mechanics?active=true")).json(),
      ]);
      setCats([{ id: "", name: "Semua" }, ...(cs.data || [])]);
      setMechanics(ms.data || []);
    })();
  }, []);

  // load produk
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoadingProd(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (categoryId) params.set("categoryId", categoryId);
      params.set("page", "1");
      params.set("pageSize", "50");
      const res = await apiFetch("/api/v1/products?" + params.toString());
      const data = await res.json();
      setProducts(data.data || []);
      setLoadingProd(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, categoryId]);

  // actions (logic sama)
  function addToCart(p) {
    addItem(p);
  }
  function clearAll() {
    reset();
    setMechanicId("");
  }
  function resetFilter() {
    setQ("");
    setCategoryId("");
  }
  function uangPas() {
    setCashReceived(total);
  }
  function addCash(n) {
    setCashReceived((cashReceived || 0) + n);
  }

  const serviceOnly = items.length === 0;

  // bayar (validasi SweetAlert — logic sama)
  const [paying, setPaying] = useState(false);
  async function bayar() {
    if (total <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Belum ada tagihan",
        text: "Tambahkan item atau isi ongkos mekanik terlebih dahulu.",
        background: "#0b0b0c",
        color: "#fff",
      });
      return;
    }
    if ((cashReceived || 0) < total) {
      await Swal.fire({
        icon: "error",
        title: "Uang diterima kurang",
        html: `<div class="text-slate-300">Total: <b>Rp ${nf(
          total
        )}</b><br/>Diterima: <b>Rp ${nf(cashReceived)}</b></div>`,
        background: "#0b0b0c",
        color: "#fff",
      });
      return;
    }
    if (serviceOnly && (!mechanicId || (mechanicFee || 0) <= 0)) {
      await Swal.fire({
        icon: "error",
        title: "Transaksi jasa",
        text: "Wajib pilih mekanik dan isi ongkos.",
        background: "#0b0b0c",
        color: "#fff",
      });
      return;
    }

    if (paying) return;
    setPaying(true);
    try {
      const body = {
        items: items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          price: i.price,
        })),
        mechanicId: mechanicId || undefined,
        mechanicFee: Number(mechanicFee || 0),
        customerName: customerName || undefined,
        vehiclePlate: vehiclePlate || undefined,
        cashReceived: Number(cashReceived || 0),
      };
      const res = await apiFetch("/api/v1/transactions", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          icon: "error",
          title: "Transaksi gagal",
          text: data?.message || "Gagal menyimpan transaksi.",
          background: "#0b0b0c",
          color: "#fff",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Transaksi berhasil",
        text: `Kode: ${data?.data?.code || "(tersimpan)"}`,
        confirmButtonText: "Lihat Detail",
        background: "#0b0b0c",
        color: "#fff",
      });
      setTxModal(data.data);
      clearAll();
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat menyimpan transaksi.",
        background: "#0b0b0c",
        color: "#fff",
      });
    } finally {
      setPaying(false);
    }
  }

  // ===== UI =====
  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">KASIR</div>
          
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-400 uppercase">
             {user?.username || user?.name || "-"} (
            {user?.role || "USER"})
          </div>
        <button
          onClick={doLogout}
          className="rounded-lg border border-white/20  px-3 py-1 bg-red-600 hover:bg-red-700"
        >
          Logout
        </button>
        </div>
      </div>

      {/* === 3 COLUMNS === */}
      {/* mobile: 1 kolom, md: 2 kolom (produk + kanan), lg+: 3 kolom */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 ">
        {/* Kiri: Katalog Produk */}
        <section className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-2 ">
            <Labeled label="Cari Produk">
              <input
                placeholder="Nama Item ..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="rounded-xl border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500 placeholder:text-sm"
              />
            </Labeled>
            <Labeled label="Kategori">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-xl border border-white/20 px-3 py-3 bg-black text-white text-sm"
              >
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Labeled>
            <div className="flex items-end">
              <button
                onClick={resetFilter}
                className="w-full rounded-xl text-red-600 bg-black border border-white/20 px-3 py-2.5 hover:bg-white/10 text-sm"
              >
                Reset Filter
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur p-3">
            {loadingProd ? (
              <div className="text-sm text-slate-400">Memuat…</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-slate-400">Tidak ada produk</div>
            ) : (
              <div className="grid xs:grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-white/20 p-3 bg-black text-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium truncate">
                        {p.name}
                      </div>
                      {(p.stock ?? 0) <= (p.lowStockThreshold ?? 3) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                          Low
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      {p.sku}
                    </div>
                    <div className="mt-2 text-sm">
                      Rp {new Intl.NumberFormat("id-ID").format(p.price)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Stok: {p.stock}
                    </div>
                    <button
                      onClick={() => addToCart(p)}
                      className="mt-3 w-full rounded-full py-1 text-sm bg-emerald-500/15 text-emerald-500 border border-white/20 hover:bg-white/20 disabled:opacity-50"
                      disabled={p.stock <= 0}
                    >
                      Tambah
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tengah: Keranjang */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-white/20 p-3 bg-black text-white">
            <div className="font-semibold mb-2">Keranjang</div>

            {items.length === 0 ? (
              <div className="text-sm text-slate-400">
                Belum ada item. Bisa transaksi jasa saja di sebelah kanan.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Produk</th>
                    <th className="p-2 w-24">Qty</th>
                    <th className="p-2 text-right w-28">Harga</th>
                    <th className="p-2 text-right w-28">Total</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.productId}
                      className="border-b last:border-none"
                    >
                      <td className="p-2">{it.name}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <button
                            className="px-2 border border-white/20 rounded"
                            onClick={() => dec(it.productId)}
                          >
                            -
                          </button>
                          <div className="w-10 text-center">{it.qty}</div>
                          <button
                            className="px-2 border border-white/20 rounded"
                            onClick={() => inc(it.productId)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-2 text-right">Rp {nf(it.price)}</td>
                      <td className="p-2 text-right">
                        Rp {nf(it.qty * it.price)}
                      </td>
                      <td className="p-2">
                        <button
                          className="px-2 border border-white/20 rounded"
                          onClick={() => remove(it.productId)}
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {items.length > 0 && (
              <div className="flex justify-between mt-3">
                <button
                  className="rounded border border-white/20 px-3 py-2 hover:bg-white/10"
                  onClick={reset}
                >
                  Clear Cart
                </button>
                <div className="text-right text-sm">
                  Subtotal: <b>Rp {nf(subtotal)}</b>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Kanan: Jasa + Pelanggan + Pembayaran */}
        <section className="space-y-4">
          {/* Jasa Mekanik */}
          <div className="rounded-2xl border border-white/20 p-3 bg-black text-white">
            <div className="font-semibold mb-2">Jasa Mekanik (opsional)</div>
            <div className="grid grid-cols-2 gap-2">
              <Labeled label="Pilih Mekanik">
                <select
                  value={mechanicId}
                  onChange={(e) => setMechanicId(e.target.value)}
                  className={`rounded-xl border border-white/20 px-3 py-2 bg-black ${
                    mechanicId ? "text-white" : "text-slate-500"
                  }`}
                >
                  {/* placeholder visual */}
                  <option value="" hidden>
                    pilih mekanik
                  </option>
                  {/* opsi kosong nyata */}
                  <option value="">—</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Jika tanpa item, wajib pilih mekanik & isi ongkos.
                </p>
              </Labeled>

              <Labeled label="Ongkos Mekanik (Rp)">
                <input
                  inputMode="numeric"
                  value={mechanicFee ? formatRupiah(mechanicFee) : ""}
                  onChange={(e) => setMechanicFee(e.target.value)}
                  placeholder="contoh: 50.000"
                  className="rounded-xl border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500"
                />
              </Labeled>
            </div>
          </div>

          {/* Pelanggan */}
          <div className="rounded-2xl border border-white/20 p-3 bg-black text-white grid grid-cols-2 gap-2">
            <Labeled label="Nama Pelanggan">
              <input
                placeholder="(opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded-xl border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500"
              />
            </Labeled>
            <Labeled label="Nomor Polisi">
              <input
                placeholder="(opsional)"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="rounded-xl border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500"
              />
            </Labeled>
          </div>

          {/* Pembayaran */}
          <div className="rounded-2xl border border-white/20 p-3 bg-black text-white space-y-2">
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-300">Total Tagihan</span>
              <span className="px-2 py-1 rounded-lg text-blue-600 bg-blue-500/40 text-white font-semibold">
                Rp {nf(total)}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Labeled label="Uang Diterima (Rp)">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    inputMode="numeric"
                    value={cashReceived ? formatRupiah(cashReceived) : ""}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="misal: 100.000"
                    className="rounded-xl border border-white/20 px-3 py-2 bg-black text-white placeholder:text-slate-500 w-full"
                  />
                  <button
                    onClick={uangPas}
                    className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10 w-full"
                  >
                    Uang Pas
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Isi nominal uang yang dibayar pelanggan.
                </p>
              </Labeled>
            </div>

            <div className="flex flex-wrap gap-2">
              {[10000, 20000, 50000, 100000].map((n) => (
                <button
                  key={n}
                  onClick={() => addCash(n)}
                  className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  +{formatRupiah(n)}
                </button>
              ))}
              <button
                onClick={() => setCashReceived(0)}
                className="ml-auto rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Reset Uang
              </button>
            </div>

            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-300">Uang Kembalian</span>
              <span
                className={`px-2 py-1 rounded-lg font-semibold ${
                  change > 0
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-white/10 text-white"
                }`}
              >
                Rp {nf(change)}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={clearAll}
                className="w-full rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10"
              >
                Bersihkan
              </button>
              <button
                onClick={bayar}
                disabled={paying}
                className={`w-full rounded-xl border border-white/20 px-4 py-2 ${
                  !paying
                    ? "bg-emerald-500/15 text-green-500 hover:bg-emerald-500/30"
                    : "bg-white/5 opacity-60 cursor-not-allowed"
                }`}
              >
                {paying ? "Menyimpan…" : "Bayar"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal detail (tetap) */}
      {txModal && (
        <Modal onClose={() => setTxModal(null)} title="Detail Transaksi">
          <TxDetail tx={txModal} />
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={() =>
                window.open(`/print/receipt/${txModal.id}`, "_blank")
              }
              className="rounded-xl border border-white/10 px-4 py-2 hover:bg-white/10"
            >
              Cetak Nota
            </button>
            <button
              onClick={() => setTxModal(null)}
              className="rounded-xl border border-white/10 px-4 py-2 hover:bg-white/10"
            >
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* === kecil2 UI helpers (sama) === */
function Labeled({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-black text-white border border-white/10 rounded-2xl p-4 m-2">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="px-2 py-1 border rounded">
            x
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function TxDetail({ tx }) {
  const dt = new Date(tx.datetime || tx.createdAt || Date.now());
  const isCanceled = !!tx.canceledAt || !!tx.isCanceled;

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-lg font-semibold">Detail Transaksi</div>
        {isCanceled && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 ring-1 ring-red-500/30">
            VOID
          </span>
        )}
      </div>

      {isCanceled && (
        <div className="mb-3 text-xs text-red-300">
          {tx.cancelReason ? `Alasan: ${tx.cancelReason}` : 'Transaksi telah dibatalkan.'}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        <div>
          <div><span className="text-slate-400">Kode:</span> <b>{tx.code}</b></div>
          <div><span className="text-slate-400">Tanggal:</span> {dt.toLocaleString('id-ID')}</div>
          <div><span className="text-slate-400">Kasir:</span> {tx.cashier?.username || '-'}</div>
        </div>
        <div>
          {tx.customerName && <div><span className="text-slate-400">Pelanggan:</span> {tx.customerName}</div>}
          {tx.vehiclePlate && <div><span className="text-slate-400">No. Polisi:</span> {tx.vehiclePlate}</div>}
          {tx.mechanicName && <div><span className="text-slate-400">Mekanik:</span> {tx.mechanicName}</div>}
        </div>
      </div>

      <div className="mt-3">
        <div className="font-medium mb-1">Item</div>
        {(!tx.items || tx.items.length === 0) ? (
          <div className="text-slate-400">Tidak ada item (jasa saja)</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">Nama</th>
                <th className="text-right p-1 w-16">Qty</th>
                <th className="text-right p-1 w-24">Harga</th>
                <th className="text-right p-1 w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {tx.items.map((it, i) => (
                <tr key={i} className="border-b last:border-none">
                  <td className="p-1">{it.nameSnapshot || it.name}</td>
                  <td className="p-1 text-right">{it.qty}</td>
                  <td className="p-1 text-right">Rp {nf(it.price)}</td>
                  <td className="p-1 text-right">Rp {nf(it.lineTotal || (it.qty * it.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><b className={isCanceled ? 'line-through text-slate-400' : ''}>Rp {nf(tx.subtotal)}</b></div>
        <div className="flex justify-between"><span>Ongkos Mekanik</span><b className={isCanceled ? 'line-through text-slate-400' : ''}>Rp {nf(tx.mechanicFee)}</b></div>
        <div className="flex justify-between"><span>Total</span><b className={isCanceled ? 'line-through text-slate-400' : ''}>Rp {nf(tx.total)}</b></div>
        <div className="flex justify-between text-slate-400"><span>Uang Diterima</span><span>Rp {nf(tx.cashReceived)}</span></div>
        <div className="flex justify-between text-slate-400"><span>Kembalian</span><span>Rp {nf(tx.change)}</span></div>
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        <button
          onClick={() => { if (!isCanceled) window.open(`/print/receipt/${tx.id}`, '_blank'); }}
          disabled={isCanceled}
          className={`rounded-xl border px-4 py-2 ${isCanceled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
          title={isCanceled ? 'Transaksi void—tidak dapat dicetak' : 'Cetak Nota'}
        >
          Cetak Nota
        </button>
      </div>
    </div>
  );
}


/* helpers */
function nf(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n || 0);
  } catch {
    return n;
  }
}
function formatRupiah(n) {
  const num =
    typeof n === "string" ? Number(n.replace(/\D/g, "")) : Number(n || 0);
  return new Intl.NumberFormat("id-ID").format(isNaN(num) ? 0 : num);
}
function InfoChip({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function KeyVal({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Row({ label, value, strong = false, highlight = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span
        className={[
          "tabular-nums",
          strong ? "font-semibold" : "font-medium",
          highlight ? "text-white" : ""
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function Th({ children, align = "left", className = "" }) {
  return (
    <th
      className={`p-2 text-${align} text-[12px] font-semibold uppercase tracking-wide text-slate-300 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left", className = "" }) {
  return (
    <td className={`p-2 text-${align} ${className}`}>{children}</td>
  );
}
