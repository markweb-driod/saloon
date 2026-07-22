import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import ContactInbox from "@/components/ContactInbox";

export default async function ConsultationRequestsPage() {
  await requireRoleSession("ADMIN", "RECEPTIONIST");

  const requests = await prisma.contactMessage.findMany({
    where: { subject: "Mobile Salon Consultation Request" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Consultation Requests
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Review custom event and bridal booking requests, update their status, and reply directly by email.
      </p>
      <ContactInbox
        messages={requests.map((request) => ({
          id: request.id,
          name: request.name,
          email: request.email,
          phone: request.phone,
          subject: request.subject,
          message: request.message,
          status: request.status,
          createdAt: request.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
