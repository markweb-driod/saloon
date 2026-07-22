import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.sub },
    include: { customer: true },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Profile
      </h1>
      <div className="mt-8">
        <ProfileForm
          name={user.name}
          email={user.email}
          phone={user.phone}
          preferences={user.customer?.preferences ?? ""}
          allergiesNotes={user.customer?.allergiesNotes ?? ""}
        />
      </div>
    </div>
  );
}
