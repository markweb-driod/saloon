"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Chip from "@/components/ui/Chip";
import TextAction from "@/components/ui/TextAction";

type PromoCodeRecord = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: string;
  active: boolean;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
};

function isExpired(expiresAt: string | null): boolean {
  return !!expiresAt && new Date(expiresAt) < new Date();
}

export default function PromoCodeManager({ promoCodes }: { promoCodes: PromoCodeRecord[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/promo-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  return (
    <div>
      <Button variant="gold" onClick={() => setShowAddForm((v) => !v)} className="px-5 py-2.5 text-sm">
        {showAddForm ? "Close" : "Create promo code"}
      </Button>

      {showAddForm && (
        <AddPromoCodeForm
          onCreated={() => {
            setShowAddForm(false);
            router.refresh();
          }}
        />
      )}

      {promoCodes.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No promo codes yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {promoCodes.map((p) => {
            const expired = isExpired(p.expiresAt);
            const limitReached = p.usageLimit !== null && p.usedCount >= p.usageLimit;
            const effectivelyLive = p.active && !expired && !limitReached;
            return (
              <Card key={p.id} as="li" flat className="p-4!">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-serif text-lg font-semibold tracking-wide text-navy-950">
                        {p.code}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
                          effectivelyLive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {effectivelyLive ? "Live" : expired ? "Expired" : limitReached ? "Limit reached" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {p.discountType === "PERCENT"
                        ? `${Number(p.discountValue)}% off`
                        : `$${Number(p.discountValue).toFixed(2)} off`}{" "}
                      &middot; used {p.usedCount}
                      {p.usageLimit !== null ? ` / ${p.usageLimit}` : ""}
                      {p.expiresAt && (
                        <> &middot; expires {new Date(p.expiresAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <TextAction tone={p.active ? "red" : "gold"} onClick={() => toggleActive(p.id, p.active)}>
                    {p.active ? "Deactivate" : "Activate"}
                  </TextAction>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddPromoCodeForm({ onCreated }: { onCreated: () => void }) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState(10);
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create promo code");
        return;
      }
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card as="form" flat onSubmit={handleSubmit} className="mt-4 space-y-3 p-5!">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="SUMMER20"
        />
        <Select
          label="Discount type"
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")}
        >
          <option value="PERCENT">Percent off</option>
          <option value="FIXED">Fixed amount off</option>
        </Select>
        <Input
          label={discountType === "PERCENT" ? "Discount (%)" : "Discount ($)"}
          type="number"
          min={0}
          max={discountType === "PERCENT" ? 100 : undefined}
          step={discountType === "PERCENT" ? 1 : 0.01}
          value={discountValue}
          onChange={(e) => setDiscountValue(Number(e.target.value))}
        />
        <Input
          label="Usage limit (optional)"
          type="number"
          min={1}
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder="Unlimited"
        />
        <Input
          label="Expires on (optional)"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {["10", "15", "20", "25"].map((v) => (
          <Chip key={v} active={discountValue === Number(v)} onClick={() => setDiscountValue(Number(v))}>
            {v}
            {discountType === "PERCENT" ? "%" : "$"}
          </Chip>
        ))}
      </div>
      <Button type="submit" variant="gold" disabled={submitting} className="px-5 py-2.5 text-sm">
        {submitting ? "Creating…" : "Create promo code"}
      </Button>
    </Card>
  );
}
