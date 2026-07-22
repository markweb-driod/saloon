import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import POSCheckout from "@/components/POSCheckout";

export default async function PosPage() {
  await requireRoleSession("RECEPTIONIST", "ADMIN");

  const today = new Date();
  const [services, products, staff, appointments] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { stockQuantity: { gt: 0 } }, orderBy: { name: "asc" } }),
    prisma.staff.findMany({
      where: { user: { role: "STYLIST" } },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.appointment.findMany({
      where: {
        startTime: { gte: startOfDay(today), lte: endOfDay(today) },
        status: "CONFIRMED",
        transaction: null,
      },
      include: {
        customer: { include: { user: { select: { name: true } } } },
        staff: { include: { user: { select: { name: true } } } },
        services: { include: { service: true } },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Checkout / POS
      </h1>
      <div className="mt-6">
        <POSCheckout
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price.toString(),
            durationMinutes: s.durationMinutes,
          }))}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            unitPrice: p.unitPrice.toString(),
            stockQuantity: p.stockQuantity,
          }))}
          staffOptions={staff.map((s) => ({ id: s.id, name: s.user.name }))}
          checkoutableAppointments={appointments.map((a) => ({
            id: a.id,
            startTime: a.startTime.toISOString(),
            staffId: a.staffId,
            customer: { user: { name: a.customer.user.name } },
            staff: { user: { name: a.staff.user.name } },
            services: a.services.map((s) => ({
              service: {
                id: s.service.id,
                name: s.service.name,
                price: s.service.price.toString(),
                durationMinutes: s.service.durationMinutes,
              },
            })),
          }))}
        />
      </div>
    </div>
  );
}
