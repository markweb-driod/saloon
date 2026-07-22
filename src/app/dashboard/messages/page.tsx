import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import ContactInbox from "@/components/ContactInbox";

export default async function MessagesPage() {
  await requireRoleSession("ADMIN", "RECEPTIONIST");

  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Messages
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Inquiries submitted through the public contact form.
      </p>
      <ContactInbox
        messages={messages.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          subject: m.subject,
          message: m.message,
          status: m.status,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
