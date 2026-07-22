import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import InventoryManager from "@/components/InventoryManager";
import StatCard from "@/components/dashboard/StatCard";
import DonutChart from "@/components/dashboard/DonutChart";
import Card from "@/components/ui/Card";

const CATEGORY_COLORS = ["#c9a24b", "#33417f", "#34a875", "#d9534f", "#8b6fc9", "#6f7690"];

export default async function InventoryPage() {
  await requireRoleSession("ADMIN");

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  const totalSkus = products.length;
  const totalUnits = products.reduce((s, p) => s + p.stockQuantity, 0);
  const totalValue = products.reduce((s, p) => s + p.stockQuantity * Number(p.unitCost), 0);
  const lowStock = products.filter((p) => p.stockQuantity <= p.reorderThreshold);
  const outOfStock = products.filter((p) => p.stockQuantity === 0);
  const featuredCount = products.filter((p) => p.featured).length;

  const categoryCounts = new Map<string, number>();
  for (const p of products) {
    const key = p.category || "Uncategorized";
    categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
  }
  const categorySegments = [...categoryCounts.entries()].map(([label, value], i) => ({
    label,
    value,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div>
      <h1 className="font-serif text-xl font-semibold tracking-tight text-navy-950 sm:text-2xl">
        Inventory
      </h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total SKUs" value={String(totalSkus)} icon="inventory" />
        <StatCard label="Units in stock" value={totalUnits.toLocaleString()} icon="inventory" />
        <StatCard label="Inventory value" value={`$${totalValue.toFixed(2)}`} icon="pos" />
        <StatCard
          label="Low / out of stock"
          value={`${lowStock.length} / ${outOfStock.length}`}
          icon="orders"
        />
        <StatCard label="Featured on homepage" value={String(featuredCount)} icon="content" tone="gold" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card flat className="p-4!">
          <p className="text-sm font-semibold text-navy-950">Stock by category</p>
          {categorySegments.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No products yet.</p>
          ) : (
            <div className="mt-4 flex items-center gap-6">
              <DonutChart segments={categorySegments} />
              <ul className="flex-1 space-y-1.5 text-sm">
                {categorySegments.map((seg) => (
                  <li key={seg.label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: seg.color }}
                        aria-hidden
                      />
                      {seg.label}
                    </span>
                    <span className="font-medium text-navy-950">{seg.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card flat className="p-4!">
          <p className="text-sm font-semibold text-navy-950">Needs attention</p>
          {lowStock.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">All products are above their reorder threshold.</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-900/10">
              {lowStock.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium text-navy-950">{p.name}</span>
                  <span className="text-red-600">
                    {p.stockQuantity} left &middot; reorder at {p.reorderThreshold}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <InventoryManager
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            imageUrl: p.imageUrl,
            stockQuantity: p.stockQuantity,
            reorderThreshold: p.reorderThreshold,
            unitCost: p.unitCost.toString(),
            unitPrice: p.unitPrice.toString(),
            supplierNote: p.supplierNote,
            featured: p.featured,
            homepagePosition: p.homepagePosition,
          }))}
        />
      </div>
    </div>
  );
}
