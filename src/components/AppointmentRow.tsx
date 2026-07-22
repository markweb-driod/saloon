"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import TextAction from "@/components/ui/TextAction";

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

export default function AppointmentRow({
  id,
  label,
  startTime,
  status,
}: {
  id: string;
  label: string;
  startTime: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpcoming = new Date(startTime) > new Date();
  const canCancel = isUpcoming && CANCELLABLE_STATUSES.includes(status);

  async function handleCancel() {
    if (!confirm("Cancel this appointment?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
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
    <li className="py-4 text-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-navy-950">{label}</span>
        <div className="flex items-center gap-3">
          <Badge status={status} />
          {canCancel && (
            <TextAction tone="red" onClick={handleCancel} disabled={busy}>
              {busy ? "Cancelling…" : "Cancel"}
            </TextAction>
          )}
        </div>
      </div>
      <p className="mt-1 text-slate-500">{new Date(startTime).toLocaleString()}</p>
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </li>
  );
}
