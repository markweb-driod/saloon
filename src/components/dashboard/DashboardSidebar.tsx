"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon from "@/components/dashboard/NavIcon";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  group: string;
};

export default function DashboardSidebar({
  items,
  role,
  consoleLabel,
  collapsed = false,
  onNavigate,
}: {
  items: NavItem[];
  role: string;
  consoleLabel?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const groups = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col bg-navy-950">
      <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
        {!collapsed ? (
          <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-gold-400">
            {consoleLabel ?? `${role.charAt(0) + role.slice(1).toLowerCase()} Console`}
          </p>
        ) : (
          <p className="mx-auto text-xs font-semibold uppercase text-gold-400">
            {(consoleLabel ?? role).slice(0, 1)}
          </p>
        )}
      </div>

      <nav className="scrollbar-hide flex-1 gap-1 overflow-y-auto overflow-x-hidden px-2.5 py-3">
        {Object.entries(groups).map(([group, groupItems]) => (
          <div key={group} className="mb-3 last:mb-0">
            {group !== "_top" && !collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-200/35">
                {group}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {groupItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && item.href !== "/account" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all ${
                      collapsed ? "justify-center" : ""
                    } ${
                      active
                        ? "bg-gold-500 text-navy-950 shadow-[0_10px_25px_-10px_rgba(201,162,75,0.6)]"
                        : "text-cream-200/75 hover:bg-white/5 hover:text-cream-100"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        active ? "bg-navy-950/10" : "text-cream-200/50 group-hover:text-cream-200/80"
                      }`}
                    >
                      <NavIcon name={item.icon} className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    {active && !collapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-navy-950/40" aria-hidden />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2.5">
        <Link
          href="/contact"
          target="_blank"
          onClick={onNavigate}
          title={collapsed ? "Help & Support" : undefined}
          className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-cream-200/60 transition-colors hover:bg-white/5 hover:text-cream-100 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-cream-200/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.5" strokeLinecap="round" />
              <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
            </svg>
          </span>
          {!collapsed && "Help & Support"}
        </Link>
      </div>
    </div>
  );
}
