"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  customer: { user: { name: string; phone: string | null } };
  staff: { user: { name: string } };
  services: { service: { name: string } }[];
};

type StaffOption = { id: string; name: string };
type ServiceOption = { id: string; name: string; durationMinutes: number };

const STATUS_ACTIONS: Record<string, { label: string; next: string }[]> = {
  PENDING: [
    { label: "Confirm", next: "CONFIRMED" },
    { label: "Cancel", next: "CANCELLED" },
  ],
  CONFIRMED: [
    { label: "Complete", next: "COMPLETED" },
    { label: "No-show", next: "NO_SHOW" },
    { label: "Cancel", next: "CANCELLED" },
  ],
};

function todayISODate(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function CalendarView({
  canManageAny,
  staffOptions,
  serviceOptions,
}: {
  canManageAny: boolean;
  staffOptions: StaffOption[];
  serviceOptions: ServiceOption[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(todayISODate());
  const [staffId, setStaffId] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (staffId) params.set("staffId", staffId);
    fetch(`/api/appointments?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setAppointments([]);
        } else {
          setAppointments(data.appointments ?? []);
          setError(null);
        }
      })
      .finally(() => setLoading(false));
  }, [date, staffId]);

  useEffect(() => {
    // load() sets loading state before its fetch resolves — intentional
    // (React's documented data-fetching-in-effect pattern), not a lint bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      load();
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        {canManageAny && (
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-auto">
            <option value="">All stylists</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
        {canManageAny && (
          <Button
            variant="gold"
            onClick={() => setShowNewForm((v) => !v)}
            className="ml-auto px-5 py-2.5 text-sm"
          >
            {showNewForm ? "Close" : "New appointment"}
          </Button>
        )}
      </div>

      {showNewForm && (
        <NewAppointmentForm
          staffOptions={staffOptions}
          serviceOptions={serviceOptions}
          onCreated={() => {
            setShowNewForm(false);
            load();
          }}
        />
      )}

      <div className="mt-6">
        {loading && <p className="text-sm text-slate-500">Loading&hellip;</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && appointments.length === 0 && (
          <p className="text-sm text-slate-500">No appointments for this day.</p>
        )}
        <ul className="divide-y divide-navy-900/10">
          {appointments.map((appt) => (
            <li key={appt.id} className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">
              <div>
                <p className="font-medium text-navy-950">
                  {new Date(appt.startTime).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  &mdash; {appt.customer.user.name}
                </p>
                <p className="text-slate-500">
                  {appt.services.map((s) => s.service.name).join(", ")} with {appt.staff.user.name}{" "}
                  &middot; {appt.source}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={appt.status} />
                {(STATUS_ACTIONS[appt.status] ?? []).map((action) => (
                  <Chip key={action.next} onClick={() => updateStatus(appt.id, action.next)}>
                    {action.label}
                  </Chip>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NewAppointmentForm({
  staffOptions,
  serviceOptions,
  onCreated,
}: {
  staffOptions: StaffOption[];
  serviceOptions: ServiceOption[];
  onCreated: () => void;
}) {
  const [customerEmail, setCustomerEmail] = useState("");
  const [staffId, setStaffId] = useState(staffOptions[0]?.id ?? "");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(todayISODate());
  const [time, setTime] = useState("09:00");
  const [source, setSource] = useState<"WALK_IN" | "PHONE">("WALK_IN");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const startTime = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, serviceIds, startTime, customerEmail, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create appointment");
        return;
      }
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card as="form" flat onSubmit={handleSubmit} className="mt-4 space-y-4 p-5!">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Customer email"
          type="email"
          required
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
        />
        <Select label="Stylist" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <Select
          label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value as "WALK_IN" | "PHONE")}
        >
          <option value="WALK_IN">Walk-in</option>
          <option value="PHONE">Phone</option>
        </Select>
      </div>
      <div>
        <p className="text-sm font-medium text-navy-950">Services</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {serviceOptions.map((s) => (
            <Chip key={s.id} active={serviceIds.includes(s.id)} onClick={() => toggleService(s.id)}>
              {s.name}
            </Chip>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        variant="gold"
        disabled={submitting || serviceIds.length === 0}
        className="px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {submitting ? "Booking…" : "Book appointment"}
      </Button>
    </Card>
  );
}
