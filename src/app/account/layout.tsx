import { requireRoleSession } from "@/lib/session";
import AppShell from "@/components/dashboard/AppShell";
import type { NavItem } from "@/components/dashboard/DashboardSidebar";

const NAV_ITEMS: NavItem[] = [
  { href: "/account", label: "Overview", icon: "overview", group: "_top" },
  { href: "/account/bookings", label: "Bookings", icon: "calendar", group: "_top" },
  { href: "/account/products", label: "Shop", icon: "inventory", group: "_top" },
  { href: "/account/orders", label: "Orders", icon: "orders", group: "_top" },
  { href: "/account/profile", label: "Profile", icon: "customers", group: "_top" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRoleSession("CUSTOMER");

  return (
    <AppShell
      items={NAV_ITEMS}
      role={session.role}
      consoleLabel="My Account"
      name={session.name}
      email={session.email}
    >
      {children}
    </AppShell>
  );
}
