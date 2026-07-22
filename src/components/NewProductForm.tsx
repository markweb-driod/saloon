"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import ProductImageField from "@/components/dashboard/ProductImageField";

export default function NewProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState(0);
  const [reorderThreshold, setReorderThreshold] = useState(5);
  const [unitCost, setUnitCost] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [supplierNote, setSupplierNote] = useState("");
  const [featured, setFeatured] = useState(false);
  const [homepagePosition, setHomepagePosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          category: category || undefined,
          imageUrl: imageUrl || undefined,
          description: description || undefined,
          stockQuantity,
          reorderThreshold,
          unitCost,
          unitPrice,
          supplierNote: supplierNote || undefined,
          featured,
          homepagePosition,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create product");
        return;
      }
      router.push("/dashboard/inventory");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card as="form" flat onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-5 p-6!">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="SKU" required value={sku} onChange={(e) => setSku(e.target.value)} />
        <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>

      <ProductImageField value={imageUrl} onChange={setImageUrl} />

      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Initial stock"
          type="number"
          min={0}
          value={stockQuantity}
          onChange={(e) => setStockQuantity(Number(e.target.value))}
        />
        <Input
          label="Reorder threshold"
          type="number"
          min={0}
          value={reorderThreshold}
          onChange={(e) => setReorderThreshold(Number(e.target.value))}
        />
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
      </div>

      <Textarea
        label="Supplier note"
        value={supplierNote}
        onChange={(e) => setSupplierNote(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-navy-900/10 bg-cream-100/60 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-navy-950">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-navy-900/20 text-gold-500 focus:ring-gold-400"
          />
          Feature on homepage
        </label>
        {featured && (
          <Input
            label="Display order"
            type="number"
            min={0}
            value={homepagePosition}
            onChange={(e) => setHomepagePosition(Number(e.target.value))}
            className="w-28"
          />
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="gold" disabled={submitting} className="px-5 py-2.5 text-sm">
          {submitting ? "Creating…" : "Add product"}
        </Button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/inventory")}
          className="text-sm font-medium text-slate-500 hover:text-navy-950"
        >
          Cancel
        </button>
      </div>
    </Card>
  );
}
