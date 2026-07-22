import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import UsersManager from "@/components/UsersManager";

export default async function UsersPage() {
  await requireRoleSession("ADMIN");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Users
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Every account on the platform, across all roles.
      </p>
      <div className="mt-6">
        <UsersManager
          initialUsers={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            createdAt: u.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
