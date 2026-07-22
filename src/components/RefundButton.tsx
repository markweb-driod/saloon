"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import TextAction from "@/components/ui/TextAction";

export default function RefundButton({
  transactionId,
  remaining,
}: {
  transactionId: string;
  remaining: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(remaining);
  const [error, setError] = useState<string | null>(null);

  async function submitRefund() {
    setBusy(true);
    setError(null);
    try {
      const full = Math.abs(amount - remaining) < 0.01;
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: full ? "REFUNDED" : "PARTIALLY_REFUNDED",
          refundAmount: amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Refund failed");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <TextAction tone="red" onClick={() => setOpen(true)}>
        Refund
      </TextAction>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={remaining}
        step={0.01}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-20 rounded-lg border border-navy-900/15 bg-white px-2 py-1 text-xs text-navy-950 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20"
      />
      <TextAction tone="red" onClick={submitRefund} disabled={busy} className="text-xs">
        {busy ? "…" : "Confirm"}
      </TextAction>
      <TextAction onClick={() => setOpen(false)} className="text-xs">
        Cancel
      </TextAction>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
