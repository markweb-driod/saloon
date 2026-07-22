import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import CustomerManager from "@/components/CustomerManager";

export default async function CustomersPage() {
  await requireRoleSession("RECEPTIONIST", "ADMIN");

  const customers = await prisma.customer.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      appointments: {
        orderBy: { startTime: "desc" },
        take: 1,
        select: { startTime: true },
      },
      _count: { select: { appointments: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Customers
      </h1>
      <div className="mt-6">
        <CustomerManager
          customers={customers.map((c) => ({
            id: c.id,
            name: c.user.name,
            email: c.user.email,
            phone: c.user.phone,
            loyaltyPointsBalance: c.loyaltyPointsBalance,
            preferences: c.preferences,
            allergiesNotes: c.allergiesNotes,
            visitCount: c._count.appointments,
            lastVisit: c.appointments[0]?.startTime.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
