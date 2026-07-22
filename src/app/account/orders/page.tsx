import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import OrderRow from "@/components/OrderRow";
import { LinkButton } from "@/components/ui/Button";

export default async function OrdersPage() {
  const session = await requireSession();
  const customer = await prisma.customer.findUnique({
    where: { userId: session.sub },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });

  const orders = customer?.orders ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
          Orders
        </h1>
        <LinkButton href="/account/products" variant="gold" className="px-5 py-2.5 text-sm">
          Shop products
        </LinkButton>
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-slate-600">
          No orders yet. Browse the shop to reserve products for pickup.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              id={order.id}
              status={order.status}
              total={order.total.toString()}
              createdAt={order.createdAt.toISOString()}
              items={order.items.map((i) => ({
                productName: i.productName,
                quantity: i.quantity,
                lineTotal: i.lineTotal.toString(),
              }))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
