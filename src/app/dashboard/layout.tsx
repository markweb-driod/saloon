import { requireRoleSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/dashboard/AppShell";
import type { NavItem } from "@/components/dashboard/DashboardSidebar";

const NAV_ITEMS: (NavItem & { roles: readonly string[] })[] = [
  { href: "/dashboard", label: "Overview", icon: "overview", group: "_top", roles: ["STYLIST", "RECEPTIONIST", "ADMIN"] },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendar", group: "Operations", roles: ["STYLIST", "RECEPTIONIST", "ADMIN"] },
  { href: "/dashboard/pos", label: "Checkout / POS", icon: "pos", group: "Operations", roles: ["RECEPTIONIST", "ADMIN"] },
  { href: "/dashboard/inventory", label: "Inventory", icon: "inventory", group: "Operations", roles: ["ADMIN"] },
  { href: "/dashboard/orders", label: "Orders", icon: "orders", group: "Operations", roles: ["RECEPTIONIST", "ADMIN"] },
  { href: "/dashboard/staff", label: "Staff", icon: "staff", group: "People", roles: ["ADMIN"] },
  { href: "/dashboard/customers", label: "Customers", icon: "customers", group: "People", roles: ["RECEPTIONIST", "ADMIN"] },
  { href: "/dashboard/users", label: "Users", icon: "users", group: "People", roles: ["ADMIN"] },
  { href: "/dashboard/promotions", label: "Promotions", icon: "promotions", group: "Growth", roles: ["ADMIN"] },
  { href: "/dashboard/consultations", label: "Consultations", icon: "messages", group: "Growth", roles: ["RECEPTIONIST", "ADMIN"] },
  { href: "/dashboard/messages", label: "Messages", icon: "messages", group: "Growth", roles: ["RECEPTIONIST", "ADMIN"] },
  { href: "/dashboard/content", label: "Content", icon: "content", group: "Growth", roles: ["ADMIN"] },
  { href: "/dashboard/reports", label: "Reports", icon: "reports", group: "Insights", roles: ["ADMIN"] },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRoleSession("STYLIST", "RECEPTIONIST", "ADMIN");
  const items = NAV_ITEMS.filter((item) => item.roles.includes(session.role));
  const canSeeMessages = session.role === "RECEPTIONIST" || session.role === "ADMIN";

  const unreadMessages = canSeeMessages
    ? await prisma.contactMessage.count({ where: { status: "NEW" } })
    : 0;

  return (
    <AppShell
      items={items}
      role={session.role}
      consoleLabel={`${session.role.charAt(0) + session.role.slice(1).toLowerCase()} Console`}
      name={session.name}
      email={session.email}
      unreadMessages={unreadMessages}
      showMessages={canSeeMessages}
    >
      {children}
    </AppShell>
  );
}
