"use client";

import { useEffect, useRef, useState } from "react";
import { getJSON } from "@/lib/form";
import Swal from "sweetalert2";

export default function LowStockWatcher({ n = 3, everyMs = 180_000 }) {
  const [onceShown, setOnceShown] = useState(false);
  const tRef = useRef();

  async function check() {
    try {
      const res = await getJSON(`/api/v1/products/low-stock?n=${n}`);
      const items = res.data || [];
      if (items.length > 0 && !onceShown) {
        setOnceShown(true);

        const html = `
          <div style="text-align:left">
            <div style="margin-bottom:6px;color:#94a3b8;font-size:12px">
              Produk berikut menyentuh batas stok (≤ ${n})
            </div>
            <div style="max-height:240px;overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px">
              ${items.slice(0,12).map(p=>`
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.06)">
                  <span>${p.name} <span style="color:#94a3b8">(${p.category?.name||'-'})</span></span>
                  <b>Stok: ${p.stock}</b>
                </div>
              `).join('')}
              ${items.length>12 ? `<div style="padding-top:8px;color:#94a3b8;font-size:12px">+${items.length-12} lainnya…</div>`:''}
            </div>
          </div>
        `;

        await Swal.fire({
          icon: "warning",
          title: "Stok Hampir Habis",
          html,
          confirmButtonText: "Oke",
          background: "#0b0b0c",
          color: "#fff",
        });
      }
    } catch (e) {
      // diam aja: jangan ganggu UX kalau gagal
    }
  }

  useEffect(() => {
    check(); // first load
    tRef.current = setInterval(check, everyMs);
    return () => clearInterval(tRef.current);
  }, [n, everyMs]);

  return null;
}
