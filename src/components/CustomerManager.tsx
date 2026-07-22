"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import TextAction from "@/components/ui/TextAction";
import Badge from "@/components/ui/Badge";

type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  loyaltyPointsBalance: number;
  preferences: string | null;
  allergiesNotes: string | null;
  visitCount: number;
  lastVisit: string | null;
};

export default function CustomerManager({ customers }: { customers: CustomerSummary[] }) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <div>
      <Input
        placeholder="Search by name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No customers match that search.</p>
      )}

      <ul className="mt-6 space-y-3">
        {filtered.map((c) => (
          <Card key={c.id} as="li" flat className="p-4!">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-navy-950">
                  {c.name} <span className="text-slate-500">&middot; {c.email}</span>
                </p>
                <p className="text-sm text-slate-500">
                  {c.phone ?? "No phone on file"} &middot; {c.visitCount}{" "}
                  {c.visitCount === 1 ? "visit" : "visits"}
                  {c.lastVisit &&
                    ` · last visit ${new Date(c.lastVisit).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-gold-300/30 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gold-600">
                  {c.loyaltyPointsBalance} pts
                </span>
                <TextAction onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  {expandedId === c.id ? "Close" : "View"}
                </TextAction>
              </div>
            </div>

            {expandedId === c.id && <CustomerDetail customer={c} />}
          </Card>
        ))}
      </ul>
    </div>
  );
}

type AppointmentSummary = {
  id: string;
  startTime: string;
  status: string;
  staffName: string;
  services: string[];
};

type LoyaltyTx = {
  id: string;
  pointsDelta: number;
  reason: string;
  createdAt: string;
};

type CustomerDetailData = {
  preferences: string | null;
  allergiesNotes: string | null;
  loyaltyPointsBalance: number;
  appointments: AppointmentSummary[];
  loyaltyTransactions: LoyaltyTx[];
};

function CustomerDetail({ customer }: { customer: CustomerSummary }) {
  const router = useRouter();
  const [detail, setDetail] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState("");
  const [allergiesNotes, setAllergiesNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [pointsDelta, setPointsDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);

  useEffect(() => {
    // Data-fetching-in-effect pattern (React's documented approach) — not a lint bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/admin/customers/${customer.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setDetail(data.customer);
        setPreferences(data.customer.preferences ?? "");
        setAllergiesNotes(data.customer.allergiesNotes ?? "");
      })
      .catch(() => setError("Could not load customer details."))
      .finally(() => setLoading(false));
  }, [customer.id]);

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences, allergiesNotes }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSavingNotes(false);
    }
  }

  async function adjustPoints() {
    if (pointsDelta === 0 || !reason.trim()) return;
    setAdjusting(true);
    setLoyaltyError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsDelta, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoyaltyError(data.error ?? "Could not adjust points");
        return;
      }
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              loyaltyPointsBalance: data.loyaltyPointsBalance,
              loyaltyTransactions: [data.transaction, ...prev.loyaltyTransactions],
            }
          : prev
      );
      setPointsDelta(0);
      setReason("");
      router.refresh();
    } finally {
      setAdjusting(false);
    }
  }

  if (loading) {
    return <p className="mt-4 text-sm text-slate-500">Loading details&hellip;</p>;
  }

  if (error || !detail) {
    return <p className="mt-4 text-sm text-red-600">{error ?? "Could not load details."}</p>;
  }

  return (
    <div className="mt-5 space-y-6 border-t border-navy-900/10 pt-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Textarea
          label="Preferences"
          rows={3}
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
        />
        <Textarea
          label="Allergies / notes"
          rows={3}
          value={allergiesNotes}
          onChange={(e) => setAllergiesNotes(e.target.value)}
        />
      </div>
      <Button
        variant="outline"
        onClick={saveNotes}
        disabled={savingNotes}
        className="px-4 py-2 text-sm"
      >
        {savingNotes ? "Saving…" : "Save notes"}
      </Button>

      <div className="border-t border-navy-900/10 pt-5">
        <p className="text-sm font-medium text-navy-950">
          Loyalty balance: <span className="text-gold-600">{detail.loyaltyPointsBalance} pts</span>
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Input
            label="Points (+/-)"
            type="number"
            value={pointsDelta}
            onChange={(e) => setPointsDelta(Number(e.target.value))}
            className="w-28"
          />
          <Input
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. birthday bonus"
            className="w-56"
          />
          <Button
            variant="gold"
            onClick={adjustPoints}
            disabled={adjusting || pointsDelta === 0 || !reason.trim()}
            className="px-4 py-2.5 text-sm"
          >
            {adjusting ? "Applying…" : "Apply"}
          </Button>
        </div>
        {loyaltyError && <p className="mt-2 text-sm text-red-600">{loyaltyError}</p>}

        {detail.loyaltyTransactions.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm">
            {detail.loyaltyTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-slate-600">
                <span>
                  {t.reason} &middot; {new Date(t.createdAt).toLocaleDateString()}
                </span>
                <span className={t.pointsDelta >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {t.pointsDelta >= 0 ? "+" : ""}
                  {t.pointsDelta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-navy-900/10 pt-5">
        <p className="text-sm font-medium text-navy-950">Recent appointments</p>
        {detail.appointments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No appointments yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {detail.appointments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3">
                <span className="text-slate-600">
                  {new Date(a.startTime).toLocaleDateString()} &middot; {a.services.join(", ")} with{" "}
                  {a.staffName}
                </span>
                <Badge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
