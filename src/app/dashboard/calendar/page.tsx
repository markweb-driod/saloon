import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import CalendarView from "@/components/CalendarView";

export default async function CalendarPage() {
  const session = await requireRoleSession("STYLIST", "RECEPTIONIST", "ADMIN");
  const canManageAny = session.role === "RECEPTIONIST" || session.role === "ADMIN";

  const [staff, services] = await Promise.all([
    canManageAny
      ? prisma.staff.findMany({
          where: { user: { role: "STYLIST" } },
          include: { user: { select: { name: true } } },
          orderBy: { user: { name: "asc" } },
        })
      : Promise.resolve([]),
    canManageAny
      ? prisma.service.findMany({ where: { active: true } })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Calendar
      </h1>
      <div className="mt-6">
        <CalendarView
          canManageAny={canManageAny}
          staffOptions={staff.map((s) => ({ id: s.id, name: s.user.name }))}
          serviceOptions={services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
          }))}
        />
      </div>
    </div>
  );
}
