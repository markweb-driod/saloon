import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import AppointmentRow from "@/components/AppointmentRow";
import { LinkButton } from "@/components/ui/Button";

export default async function BookingsPage() {
  const session = await requireSession();
  const customer = await prisma.customer.findUnique({
    where: { userId: session.sub },
    include: {
      appointments: {
        orderBy: { startTime: "desc" },
        include: { services: { include: { service: true } }, staff: { include: { user: true } } },
      },
    },
  });

  const appointments = customer?.appointments ?? [];
  const now = new Date();
  const upcoming = appointments.filter((a) => a.startTime > now).reverse();
  const past = appointments.filter((a) => a.startTime <= now);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
          Bookings
        </h1>
        <LinkButton href="/book" variant="gold" className="px-5 py-2.5 text-sm">
          Book a visit
        </LinkButton>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-lg font-semibold text-navy-950">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No upcoming appointments.</p>
        ) : (
          <ul className="mt-3 divide-y divide-navy-900/10">
            {upcoming.map((appt) => (
              <AppointmentRow
                key={appt.id}
                id={appt.id}
                status={appt.status}
                startTime={appt.startTime.toISOString()}
                label={`${appt.services.map((s) => s.service.name).join(", ")} with ${appt.staff.user.name}`}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold text-navy-950">Past</h2>
        {past.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No past appointments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-navy-900/10">
            {past.map((appt) => (
              <AppointmentRow
                key={appt.id}
                id={appt.id}
                status={appt.status}
                startTime={appt.startTime.toISOString()}
                label={`${appt.services.map((s) => s.service.name).join(", ")} with ${appt.staff.user.name}`}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
