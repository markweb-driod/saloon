import { prisma } from "@/lib/prisma";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import BookingFlow from "@/components/BookingFlow";

export default async function BookPage() {
  const [services, staffRecords] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.staff.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const staff = staffRecords.map((s) => ({
    id: s.id,
    name: s.user.name,
    specialties: s.specialties,
  }));

  return (
    <main className="flex-1 bg-cream-100 py-16 sm:py-20">
      <Container className="max-w-6xl">
        <SectionHeading
          eyebrow="Mobile Salon Services"
          title="Book your at-home appointment"
          subtitle="Reserve a master stylist to come to your location — choose your service, pick a time, and enjoy luxury hair care in the comfort of your own space."
        />
        <div className="mt-10">
          <BookingFlow services={services.map((s) => ({ ...s, price: s.price.toString() }))} staff={staff} />
        </div>
      </Container>
    </main>
  );
}
