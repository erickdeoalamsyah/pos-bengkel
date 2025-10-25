  "use client";

  import { useEffect, useState } from "react";
  import { useSearchParams, useParams } from "next/navigation";
  import { apiFetch } from "@/lib/api";

  export default function ReceiptPage() {
    const params = useParams();
    const sp = useSearchParams();
    const [txn, setTxn] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // default dari settings; boleh override via query ?w=
    const override = sp.get("w");
    const widthMM = override ? Number(override) : settings?.paperWidth || 58;

    useEffect(() => {
      (async () => {
        try {
          const [sRes, tRes] = await Promise.all([
            apiFetch("/api/v1/settings"),
            apiFetch(`/api/v1/transactions/${params.id}`),
          ]);
          const s = await sRes.json();
          const t = await tRes.json();
          setSettings(s?.data || null);
          if (tRes.ok) setTxn(t.data);
        } finally {
          setLoading(false);
          setTimeout(() => window.print(), 150);
        }
      })();
    }, [params.id]);

    if (loading) return <div className="p-4 text-sm">Menyiapkan nota...</div>;
    if (!txn)
      return <div className="p-4 text-sm">Transaksi tidak ditemukan.</div>;

    return (
      <div className="flex justify-center py-4">
        <div className="receipt shadow print:shadow-none">
          {/* Header Toko (teks saja) */}
          <div className="text-center">
            <div className="font-bold text-base leading-tight">
              {settings?.name || "Bengkel"}
            </div>
            <div className="text-[11px] leading-tight">{settings?.address}</div>
            <div className="text-[11px] leading-tight">
              Telp: {settings?.phone}
            </div>
          </div>

          <Divider />

          {/* Info Transaksi */}
          <div className="text-[11px]">
            <div className="flex justify-between">
              <span>Kode</span>
              <span className="font-medium">{txn.code}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{formatDateTime(txn.datetime)}</span>
            </div>
            {txn.cashier?.username && (
              <div className="flex justify-between">
                <span>Kasir</span>
                <span>{txn.cashier.username}</span>
              </div>
            )}
            {txn.customerName && (
              <div className="flex justify-between">
                <span>Pelanggan</span>
                <span>{txn.customerName}</span>
              </div>
            )}
            {txn.vehiclePlate && (
              <div className="flex justify-between">
                <span>Plat</span>
                <span>{txn.vehiclePlate}</span>
              </div>
            )}
          </div>

          <Divider />

          {/* Items */}
          <div className="text-[12px]">
            {txn.items?.map((it) => (
              <div key={it.id} className="mb-1">
                <div className="leading-tight">{it.nameSnapshot}</div>
                <div className="flex justify-between text-[11px]">
                  <span>
                    {formatIDR(it.price)} x {it.qty}
                  </span>
                  <span>{formatIDR(it.lineTotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <Divider />

          {/* Ongkos mekanik (kalau ada) */}
          {(txn.mechanicFee || 0) > 0 && (
            <div className="flex justify-between text-[12px]">
              <span>
                Ongkos Mekanik{txn.mechanicName ? ` (${txn.mechanicName})` : ""}
              </span>
              <span>{formatIDR(txn.mechanicFee)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between text-[13px] font-bold mt-1">
            <span>Total</span>
            <span>{formatIDR(txn.total)}</span>
          </div>

          <Divider />

          {/* Footer */}
          <div className="text-center text-[11px] leading-tight">
            <div>Terima kasih 🙏</div>
            <div>Selamat datang kembali</div>
          </div>
        </div>

        {/* Gaya khusus thermal */}
        <style jsx global>{`
          @page {
            size: ${widthMM}mm auto;
            margin: 0;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          .receipt {
            width: ${widthMM}mm;
            background: #fff;
            color: #000;
            padding: 8px 10px;
          }
        `}</style>
      </div>
    );
  }

  function Divider() {
    return <div className="my-2 border-t border-dashed border-black/80" />;
  }

  function formatIDR(n) {
    try {
      return "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
    } catch {
      return "Rp " + (n || 0);
    }
  }

  function formatDateTime(s) {
    try {
      return new Date(s).toLocaleString("id-ID");
    } catch {
      return s;
    }
  }
