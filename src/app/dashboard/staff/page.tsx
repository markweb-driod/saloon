import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import { parseWorkingHours } from "@/lib/availability";
import StaffManager from "@/components/StaffManager";

export default async function StaffPage() {
  await requireRoleSession("ADMIN");

  const staff = await prisma.staff.findMany({
    include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Staff
      </h1>
      <div className="mt-6">
        <StaffManager
          staff={staff.map((s) => ({
            id: s.id,
            user: s.user,
            commissionRate: Number(s.commissionRate),
            specialties: s.specialties,
            workingHours: parseWorkingHours(s.workingHours),
          }))}
        />
      </div>
    </div>
  );
}
