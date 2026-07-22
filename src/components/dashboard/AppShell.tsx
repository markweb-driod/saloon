"use client";

import { useState, type ReactNode } from "react";
import DashboardSidebar, { type NavItem } from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";

export default function AppShell({
  items,
  role,
  consoleLabel,
  name,
  email,
  unreadMessages = 0,
  showMessages = false,
  children,
}: {
  items: NavItem[];
  role: string;
  consoleLabel?: string;
  name: string;
  email: string;
  unreadMessages?: number;
  showMessages?: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-100">
      <DashboardTopbar
        items={items}
        unreadMessages={unreadMessages}
        showMessages={showMessages}
        name={name}
        email={email}
        role={role}
        collapsed={collapsed}
        onOpenMobileMenu={() => setMobileOpen(true)}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 top-14 z-50 w-60 ${mobileOpen ? "flex" : "hidden"} lg:flex ${
          collapsed ? "lg:w-16" : "lg:w-60"
        }`}
      >
        <DashboardSidebar
          items={items}
          role={role}
          consoleLabel={consoleLabel}
          collapsed={collapsed}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      <div className={`pt-14 transition-[padding] duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-60"}`}>
        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1600px] flex-col px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
          <div className="flex-1">{children}</div>
          <footer className="mt-10 flex flex-col gap-2 border-t border-navy-900/10 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Waifuu Salon &middot; {consoleLabel ?? "Console"}</p>
            <p>
              Signed in as {name} &middot; {role.charAt(0) + role.slice(1).toLowerCase()}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
