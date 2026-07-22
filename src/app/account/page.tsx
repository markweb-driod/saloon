import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import AppointmentRow from "@/components/AppointmentRow";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";

export default async function AccountPage() {
  const session = await requireSession();
  const customer = await prisma.customer.findUnique({
    where: { userId: session.sub },
    include: {
      appointments: {
        orderBy: { startTime: "desc" },
        take: 5,
        include: { services: { include: { service: true } }, staff: { include: { user: true } } },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { items: true },
      },
    },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Welcome back, {session.name}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-5!">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold-600">
            Loyalty points
          </p>
          <p className="mt-2 font-serif text-3xl font-semibold text-navy-950">
            {customer?.loyaltyPointsBalance ?? 0}
          </p>
        </Card>
        <Card className="p-5!">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold-600">
            Upcoming / past visits
          </p>
          <p className="mt-2 font-serif text-3xl font-semibold text-navy-950">
            {customer?.appointments.length ?? 0}
          </p>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/book" variant="gold" className="px-5 py-2.5 text-sm">
          Book a visit
        </LinkButton>
        <LinkButton href="/account/products" variant="outline" className="px-5 py-2.5 text-sm">
          Shop products
        </LinkButton>
        <LinkButton href="/account/orders" variant="outline" className="px-5 py-2.5 text-sm">
          View orders
        </LinkButton>
        <LinkButton href="/account/profile" variant="outline" className="px-5 py-2.5 text-sm">
          Edit profile
        </LinkButton>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-navy-950">Recent bookings</h2>
          <LinkButton href="/account/bookings" variant="outline" className="px-4 py-2 text-xs">
            View all
          </LinkButton>
        </div>
        {!customer || customer.appointments.length === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-navy-900/10 bg-white/70 p-6">
            <p className="text-sm text-slate-600">No appointments yet.</p>
            <LinkButton href="/book" variant="gold" className="px-5 py-2.5 text-sm">
              Book your first visit
            </LinkButton>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-navy-900/10">
            {customer.appointments.map((appt) => (
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
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-navy-950">Recent orders</h2>
          <LinkButton href="/account/orders" variant="outline" className="px-4 py-2 text-xs">
            View all
          </LinkButton>
        </div>
        {!customer || customer.orders.length === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-navy-900/10 bg-white/70 p-6">
            <p className="text-sm text-slate-600">No orders yet.</p>
            <LinkButton href="/account/products" variant="gold" className="px-5 py-2.5 text-sm">
              Browse the shop
            </LinkButton>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-navy-900/10">
            {customer.orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 py-4 text-sm">
                <div>
                  <p className="font-medium text-navy-950">
                    {order.items.map((i) => i.productName).join(", ")}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {new Date(order.createdAt).toLocaleString()} &middot; $
                    {Number(order.total).toFixed(2)}
                  </p>
                </div>
                <Badge status={order.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
