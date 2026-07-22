"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import TextAction from "@/components/ui/TextAction";
import { TableShell, Thead, Th, Tbody, Td, EmptyRow } from "@/components/dashboard/DataTable";
import Pagination from "@/components/dashboard/Pagination";
import ProductImageField from "@/components/dashboard/ProductImageField";

type ProductRecord = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  imageUrl: string | null;
  stockQuantity: number;
  reorderThreshold: number;
  unitCost: string;
  unitPrice: string;
  supplierNote: string | null;
  featured: boolean;
  homepagePosition: number;
};

const PAGE_SIZE = 8;

function Thumb({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!imageUrl || errored) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900/5 text-xs font-semibold uppercase text-slate-400">
        {name.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      loading="eager"
      onError={() => setErrored(true)}
      className="h-10 w-10 shrink-0 rounded-lg object-cover"
    />
  );
}

function HomepageToggle({
  product,
  onChanged,
}: {
  product: ProductRecord;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState(product.homepagePosition);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={saving}
        onClick={() => patch({ featured: !product.featured })}
        title={product.featured ? "Remove from homepage" : "Feature on homepage"}
        aria-label={product.featured ? "Remove from homepage" : "Feature on homepage"}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
          product.featured ? "bg-gold-500 text-navy-950" : "bg-navy-900/5 text-slate-400 hover:text-gold-600"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={product.featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" strokeLinejoin="round" />
        </svg>
      </button>
      {product.featured && (
        <input
          type="number"
          min={0}
          defaultValue={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          onBlur={() => patch({ homepagePosition: position })}
          title="Display order (lower shows first)"
          className="h-7 w-14 rounded-lg border border-navy-900/10 bg-white px-1.5 text-xs text-navy-950 outline-none focus:border-gold-500"
        />
      )}
    </div>
  );
}

export default function InventoryManager({ products }: { products: ProductRecord[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category || "Uncategorized"))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesCategory = category === "all" || (p.category || "Uncategorized") === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetToFirstPage() {
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search name or SKU…"
            className="w-56"
          />
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              resetToFirstPage();
            }}
            className="w-auto"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <LinkButton href="/dashboard/inventory/new" variant="gold" className="px-5 py-2.5 text-sm">
          Add product
        </LinkButton>
      </div>

      <div className="mt-4">
        <TableShell>
          <Thead>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Stock</Th>
            <Th>Cost</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th>Homepage</Th>
            <Th className="text-right">Actions</Th>
          </Thead>
          <Tbody>
            {paged.length === 0 && <EmptyRow colSpan={8}>No products match your filters.</EmptyRow>}
            {paged.map((p) => {
              const lowStock = p.stockQuantity <= p.reorderThreshold;
              return (
                <Fragment key={p.id}>
                  <tr className={lowStock ? "bg-red-50/50" : ""}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Thumb imageUrl={p.imageUrl} name={p.name} />
                        <div>
                          <p className="font-medium text-navy-950">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.sku}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-slate-600">{p.category || "Uncategorized"}</Td>
                    <Td className="text-slate-600">
                      {p.stockQuantity} <span className="text-slate-400">/ {p.reorderThreshold}</span>
                    </Td>
                    <Td className="text-slate-600">${Number(p.unitCost).toFixed(2)}</Td>
                    <Td className="text-slate-600">${Number(p.unitPrice).toFixed(2)}</Td>
                    <Td>
                      {lowStock ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Low stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          In stock
                        </span>
                      )}
                    </Td>
                    <Td>
                      <HomepageToggle product={p} onChanged={() => router.refresh()} />
                    </Td>
                    <Td className="text-right">
                      <TextAction onClick={() => setEditingId(editingId === p.id ? null : p.id)}>
                        {editingId === p.id ? "Close" : "Manage"}
                      </TextAction>
                    </Td>
                  </tr>
                  {editingId === p.id && (
                    <tr>
                      <td colSpan={8} className="bg-cream-100/60 px-4 pb-4">
                        <ManageProductForm
                          product={p}
                          onSaved={() => {
                            setEditingId(null);
                            router.refresh();
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </Tbody>
        </TableShell>
        <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>
    </div>
  );
}

function ManageProductForm({
  product,
  onSaved,
}: {
  product: ProductRecord;
  onSaved: () => void;
}) {
  const [category, setCategory] = useState(product.category ?? "");
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [unitCost, setUnitCost] = useState(Number(product.unitCost));
  const [unitPrice, setUnitPrice] = useState(Number(product.unitPrice));
  const [reorderThreshold, setReorderThreshold] = useState(product.reorderThreshold);
  const [supplierNote, setSupplierNote] = useState(product.supplierNote ?? "");
  const [restockQty, setRestockQty] = useState(0);
  const [restockReason, setRestockReason] = useState<"RESTOCK" | "ADJUSTMENT" | "DAMAGE">(
    "RESTOCK"
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSaveDetails() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, imageUrl, unitCost, unitPrice, reorderThreshold, supplierNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save changes");
        return;
      }
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRestock() {
    if (restockQty === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const delta = restockReason === "RESTOCK" ? Math.abs(restockQty) : -Math.abs(restockQty);
      const res = await fetch(`/api/admin/products/${product.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantityDelta: delta, reason: restockReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not adjust stock");
        return;
      }
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 pt-1">
      <ProductImageField value={imageUrl} onChange={setImageUrl} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Input
          label="Unit cost ($)"
          type="number"
          min={0}
          step={0.01}
          value={unitCost}
          onChange={(e) => setUnitCost(Number(e.target.value))}
        />
        <Input
          label="Unit price ($)"
          type="number"
          min={0}
          step={0.01}
          value={unitPrice}
          onChange={(e) => setUnitPrice(Number(e.target.value))}
        />
        <Input
          label="Reorder threshold"
          type="number"
          min={0}
          value={reorderThreshold}
          onChange={(e) => setReorderThreshold(Number(e.target.value))}
        />
      </div>
      <Textarea
        label="Supplier note"
        value={supplierNote}
        onChange={(e) => setSupplierNote(e.target.value)}
      />
      <Button
        onClick={handleSaveDetails}
        variant="gold"
        disabled={submitting}
        className="px-5 py-2.5 text-sm"
      >
        Save details
      </Button>

      <div className="border-t border-navy-900/10 pt-4">
        <p className="text-sm font-medium text-navy-950">Adjust stock</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Select
            value={restockReason}
            onChange={(e) => setRestockReason(e.target.value as typeof restockReason)}
            className="w-auto"
          >
            <option value="RESTOCK">Restock (+)</option>
            <option value="DAMAGE">Damage (-)</option>
            <option value="ADJUSTMENT">Adjustment (-)</option>
          </Select>
          <Input
            type="number"
            min={0}
            value={restockQty}
            onChange={(e) => setRestockQty(Number(e.target.value))}
            className="w-24"
          />
          <Button
            variant="outline"
            onClick={handleRestock}
            disabled={submitting || restockQty === 0}
            className="px-4 py-2 text-sm"
          >
            Apply
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
