"use client";

import { forwardRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import { DateTime } from "luxon";
import "react-datepicker/dist/react-datepicker.css";

/**
 * Komponen date picker yang:
 * - value: string "YYYY-MM-DD" (WIB)
 * - onChange: (string) => void  // hasil "YYYY-MM-DD" (WIB)
 * - Default: hari ini (WIB)
 * - Dark UI via Tailwind
 */
export default function WibDatePicker({
  value,            // "YYYY-MM-DD" (WIB)
  onChange,         // (isoWib: string) => void
  min,              // optional "YYYY-MM-DD"
  max,              // optional "YYYY-MM-DD"
  disabled = false,
  className = "",
  fullWidth = true,
}) {
  // Set default ke hari ini jika value kosong saat mount
  useEffect(() => {
    if (!value && onChange) {
      const today = DateTime.now().setZone("Asia/Jakarta").toISODate();
      onChange(today);
    }
  }, []);

  // Konversi ISO (WIB) -> JS Date untuk DatePicker
  const selectedDate = value
    ? toLocalNoonFromIsoWib(value)
    : null;
  const minDate = min ? toLocalNoonFromIsoWib(min) : undefined;
  const maxDate = max ? toLocalNoonFromIsoWib(max) : undefined;

  return (
    <div className={fullWidth ? "w-full" : ""}>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => {
          if (!date) return;
          
          // Ambil sebagai WIB → kembalikan "YYYY-MM-DD"
          const isoWib = DateTime.fromJSDate(date)
            .setZone("Asia/Jakarta")
            .toISODate();
          onChange?.(isoWib);
        }}
        dateFormat="dd MMM yyyy"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        customInput={<InputLike className={className} />}
        popperPlacement="bottom-start"
        placeholderText="Pilih tanggal"
        calendarClassName="dark-calendar"
      />
    </div>
  );
}

/** 
 * Custom input dengan styling yang lebih rapi
 */
const InputLike = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    type="button"
    className={[
      "w-full text-left px-4 py-2.5 rounded-xl border border-white/10 bg-black",
      "text-white text-sm hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20",
      "flex items-center justify-between gap-3 transition-all",
      className || ""
    ].join(" ")}
  >
    <span className={value ? "text-white" : "text-slate-500"}>
      {value || placeholder || "Pilih tanggal"}
    </span>
    {/* Ikon kalender */}
    <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70 flex-shrink-0">
      <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 15H5V10h14v9m0-11H5V6h14z"/>
    </svg>
  </button>
));
InputLike.displayName = "InputLike";

/* ===== Helpers ===== */

/** ISO "YYYY-MM-DD" (WIB) -> JS Date (local) jam 12:00 */
function toLocalNoonFromIsoWib(isoWib) {
  const dt = DateTime.fromISO(isoWib, { zone: "Asia/Jakarta" });
  return new Date(dt.year, dt.month - 1, dt.day, 12, 0, 0);
}