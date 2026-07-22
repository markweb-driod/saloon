"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { NavItem } from "@/components/dashboard/DashboardSidebar";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function DashboardTopbar({
  items,
  unreadMessages,
  showMessages,
  name,
  email,
  role,
  collapsed,
  onOpenMobileMenu,
  onToggleCollapsed,
}: {
  items: NavItem[];
  unreadMessages: number;
  showMessages: boolean;
  name: string;
  email: string;
  role: string;
  collapsed: boolean;
  onOpenMobileMenu: () => void;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const current =
    [...items]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))
      ?.label ?? "Overview";

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = items.find((item) => item.label.toLowerCase().includes(q));
    if (match) {
      router.push(match.href);
      setQuery("");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-navy-900/10 bg-white/90 px-3 backdrop-blur sm:px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          title="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-navy-900/5 lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-navy-900/5 lg:flex"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
            <path d="M9.5 4.5v15" />
            {collapsed ? (
              <path d="M12.5 9.5l3 2.5-3 2.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M15.5 9.5l-3 2.5 3 2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>

        <Link href="/dashboard" className="ml-1 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950 font-serif text-xs font-semibold text-gold-400">
            W
          </span>
          <span className="hidden font-serif text-sm font-semibold tracking-[0.08em] text-navy-950 sm:inline">
            WAIFUU
          </span>
        </Link>

        <span className="mx-2 hidden h-5 w-px bg-navy-900/10 md:block" aria-hidden />
        <p className="hidden text-sm text-slate-400 md:block">
          <span className="text-navy-950">{current}</span>
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <form onSubmit={handleSearch} className="relative hidden w-56 sm:block">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a section…"
            className="w-full rounded-lg border border-navy-900/10 bg-navy-900/5 py-1.5 pl-8 pr-3 text-xs text-navy-950 outline-none transition-colors placeholder:text-slate-400 focus:border-gold-500 focus:bg-white focus:ring-2 focus:ring-gold-400/20"
          />
        </form>

        {showMessages && (
          <Link
            href="/dashboard/messages"
            aria-label="Messages"
            title="Messages"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-navy-900/5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2.5" y="5" width="19" height="14" rx="2" />
              <path d="M3 6.5l9 6.5 9-6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadMessages > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold-500 px-1 text-[9px] font-bold text-navy-950">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-navy-900/5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 font-serif text-xs text-gold-400">
              {initials(name)}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`hidden shrink-0 text-slate-400 transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-navy-900/10 bg-white shadow-[0_20px_50px_-20px_rgba(10,14,39,0.35)]">
                <div className="border-b border-navy-900/10 px-4 py-3">
                  <p className="truncate text-sm font-medium text-navy-950">{name}</p>
                  <p className="truncate text-xs text-slate-400">{email}</p>
                  <p className="mt-0.5 text-xs text-gold-600">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
                </div>
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-navy-800 transition-colors hover:bg-cream-200"
                >
                  View live site
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
