"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AnimatedLogo({ className = "" }: { className?: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-gold-400/25 bg-navy-950 text-gold-400 transition-transform duration-700 ${
          active ? "scale-105 rotate-1" : "scale-90"
        }`}
      >
        <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 30C17 15 31 14 34 20C36 25 35 32 28 36C22 39 16 38 13 33" />
          <path d="M14 20C18 16 24 15 28 18C32 21 33 25 31 29" />
        </svg>
      </span>
      <span className="font-serif text-lg font-semibold uppercase tracking-[0.2em] text-cream-100">
        Waifuu
      </span>
    </Link>
  );
}
