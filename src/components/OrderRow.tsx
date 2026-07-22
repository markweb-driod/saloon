"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import TextAction from "@/components/ui/TextAction";
import { getWhatsAppLink } from "@/lib/contact";

export type OrderItemSummary = {
  productName: string;
  quantity: number;
  lineTotal: string;
};

export default function OrderRow({
  id,
  status,
  total,
  createdAt,
  items,
}: {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  items: OrderItemSummary[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCancel = status === "PENDING";

  async function handleCancel() {
    if (!confirm("Cancel this order?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not cancel");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="li" flat className="p-4!">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-navy-950">Order #{id.slice(-8)}</p>
          <p className="mt-1 text-sm text-slate-500">{new Date(createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={status} />
          {status === "PENDING" && (
            <a
              href={getWhatsAppLink(`Hi! I'd like to complete payment for order #${id.slice(-8)}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-navy-700 underline underline-offset-2 decoration-gold-500/50 hover:text-gold-600 hover:decoration-gold-500"
            >
              Pay via WhatsApp
            </a>
          )}
          {canCancel && (
            <TextAction tone="red" onClick={handleCancel} disabled={busy}>
              {busy ? "Cancelling…" : "Cancel"}
            </TextAction>
          )}
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-slate-600">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between">
            <span>
              {item.productName} &times; {item.quantity}
            </span>
            <span>${Number(item.lineTotal).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-navy-900/10 pt-3 text-sm font-semibold text-navy-950">
        <span>Total</span>
        <span>${Number(total).toFixed(2)}</span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
