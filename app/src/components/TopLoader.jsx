"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef(null);
  const timerRef = useRef(null);

  const start = () => {
    const el = barRef.current;
    if (!el) return;
    el.style.opacity = "1";
    el.style.transform = "scaleX(0.15)";
    timerRef.current = setInterval(() => {
      const current = parseFloat(el.style.transform.replace("scaleX(", "").replace(")", "")) || 0.15;
      const next = Math.min(0.98, current + Math.random() * 0.08);
      el.style.transform = `scaleX(${next})`;
    }, 300);
  };
  const done = () => {
    const el = barRef.current;
    if (!el) return;
    clearInterval(timerRef.current);
    el.style.transform = "scaleX(1)";
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "scaleX(0)";
    }, 200);
  };

  useEffect(() => {
    start();
    const id = setTimeout(done, 400);
    return () => {
      clearTimeout(id);
      clearInterval(timerRef.current);
    };
  }, [pathname, searchParams?.toString()]);

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[9999] h-[3px] origin-left"
      style={{
        background: "linear-gradient(90deg, #22c55e,#60a5fa)",
        opacity: 0, transform: "scaleX(0)",
        transition: "transform .2s ease, opacity .2s ease"
      }}
      ref={barRef}
    />
  );
}
