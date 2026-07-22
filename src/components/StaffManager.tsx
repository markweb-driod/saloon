"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { WorkingHours, WorkingHoursWindow } from "@/lib/availability";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import TextAction from "@/components/ui/TextAction";

type StaffRecord = {
  id: string;
  user: { id: string; name: string; email: string; phone: string | null; role: string };
  commissionRate: number;
  specialties: string | null;
  workingHours: WorkingHours;
};

const DAYS: { key: keyof WorkingHours; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

function firstWindow(hours: WorkingHours, day: keyof WorkingHours): WorkingHoursWindow | null {
  return hours[day]?.[0] ?? null;
}

export default function StaffManager({ staff }: { staff: StaffRecord[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <Button
        variant="gold"
        onClick={() => setShowAddForm((v) => !v)}
        className="px-5 py-2.5 text-sm"
      >
        {showAddForm ? "Close" : "Add staff member"}
      </Button>

      {showAddForm && (
        <AddStaffForm
          onCreated={() => {
            setShowAddForm(false);
            router.refresh();
          }}
        />
      )}

      <ul className="mt-6 space-y-3">
        {staff.map((s) => (
          <Card key={s.id} as="li" flat className="p-4!">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-navy-950">
                  {s.user.name} <span className="text-slate-500">&middot; {s.user.role}</span>
                </p>
                <p className="text-sm text-slate-500">{s.user.email}</p>
              </div>
              <TextAction onClick={() => setEditingId(editingId === s.id ? null : s.id)}>
                {editingId === s.id ? "Close" : "Edit"}
              </TextAction>
            </div>

            {editingId !== s.id && (
              <div className="mt-2 text-sm text-slate-500">
                {s.user.role === "STYLIST" && <span>Commission {s.commissionRate}% &middot; </span>}
                {s.specialties && <span>{s.specialties} &middot; </span>}
                <span>
                  {DAYS.filter((d) => firstWindow(s.workingHours, d.key)).length} days scheduled
                </span>
              </div>
            )}

            {editingId === s.id && (
              <EditStaffForm
                staff={s}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            )}
          </Card>
        ))}
      </ul>
    </div>
  );
}

function AddStaffForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STYLIST" | "RECEPTIONIST" | "ADMIN">("STYLIST");
  const [commissionRate, setCommissionRate] = useState(40);
  const [specialties, setSpecialties] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, commissionRate, specialties }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create staff member");
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
        <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Temporary password"
          type="text"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
          <option value="STYLIST">Stylist</option>
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="ADMIN">Admin</option>
        </Select>
        {role === "STYLIST" && (
          <>
            <Input
              label="Commission rate (%)"
              type="number"
              min={0}
              max={100}
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
            />
            <Input
              label="Specialties"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
            />
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="gold" disabled={submitting} className="px-5 py-2.5 text-sm">
        {submitting ? "Creating…" : "Create staff account"}
      </Button>
    </Card>
  );
}

function EditStaffForm({
  staff,
  onSaved,
}: {
  staff: StaffRecord;
  onSaved: () => void;
}) {
  const [commissionRate, setCommissionRate] = useState(staff.commissionRate);
  const [specialties, setSpecialties] = useState(staff.specialties ?? "");
  const [days, setDays] = useState<Record<string, { open: boolean; start: string; end: string }>>(
    () =>
      Object.fromEntries(
        DAYS.map((d) => {
          const w = firstWindow(staff.workingHours, d.key);
          return [d.key, { open: !!w, start: w?.start ?? "09:00", end: w?.end ?? "17:00" }];
        })
      )
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      const workingHours: WorkingHours = {};
      for (const d of DAYS) {
        const day = days[d.key];
        workingHours[d.key] = day.open ? [{ start: day.start, end: day.end }] : [];
      }
      const res = await fetch(`/api/admin/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate, specialties, workingHours }),
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

  return (
    <div className="mt-4 space-y-4">
      {staff.user.role === "STYLIST" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Commission rate (%)"
            type="number"
            min={0}
            max={100}
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
          />
          <Input
            label="Specialties"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
          />
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-navy-950">Working hours</p>
        <div className="mt-2 space-y-2">
          {DAYS.map((d) => (
            <div key={d.key} className="flex items-center gap-3 text-sm text-navy-950">
              <label className="flex w-24 items-center gap-2">
                <input
                  type="checkbox"
                  checked={days[d.key].open}
                  onChange={(e) =>
                    setDays((prev) => ({
                      ...prev,
                      [d.key]: { ...prev[d.key], open: e.target.checked },
                    }))
                  }
                  className="accent-gold-500"
                />
                {d.label}
              </label>
              <input
                type="time"
                disabled={!days[d.key].open}
                value={days[d.key].start}
                onChange={(e) =>
                  setDays((prev) => ({
                    ...prev,
                    [d.key]: { ...prev[d.key], start: e.target.value },
                  }))
                }
                className="rounded-lg border border-navy-900/15 bg-white px-2 py-1 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 disabled:opacity-40"
              />
              <span className="text-slate-500">to</span>
              <input
                type="time"
                disabled={!days[d.key].open}
                value={days[d.key].end}
                onChange={(e) =>
                  setDays((prev) => ({
                    ...prev,
                    [d.key]: { ...prev[d.key], end: e.target.value },
                  }))
                }
                className="rounded-lg border border-navy-900/15 bg-white px-2 py-1 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/20 disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleSave} variant="gold" disabled={submitting} className="px-5 py-2.5 text-sm">
        {submitting ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
