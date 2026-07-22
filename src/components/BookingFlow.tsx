"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type Service = {
  id: string;
  name: string;
  category: string | null;
  durationMinutes: number;
  price: string;
};

type Staff = {
  id: string;
  name: string;
  specialties: string | null;
};

const STEPS = ["Service", "Stylist", "Date & Time", "Confirm"] as const;

function toISODate(d: Date): string {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function todayISODate(): string {
  return toISODate(new Date());
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function slotPeriod(iso: string): "Morning" | "Afternoon" | "Evening" {
  const h = new Date(iso).getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export default function BookingFlow({
  services,
  staff,
}: {
  services: Service[];
  staff: Staff[];
}) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [step, setStep] = useState(0);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string>("");
  const [date, setDate] = useState<string>(todayISODate());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setLoggedIn(Boolean(data.user)))
      .finally(() => setAuthChecked(true));
  }, []);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const selectedStaff = staff.find((s) => s.id === staffId) ?? null;

  const categories = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const cat = s.category ?? "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return [...map.entries()];
  }, [services]);

  const dayOptions = useMemo(() => {
    const days: { iso: string; dow: string; day: number; month: string }[] = [];
    const start = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        iso: toISODate(d),
        dow: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: d.getDate(),
        month: d.toLocaleDateString(undefined, { month: "short" }),
      });
    }
    return days;
  }, []);

  const groupedSlots = useMemo(() => {
    const groups: Record<"Morning" | "Afternoon" | "Evening", string[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };
    for (const s of slots) groups[slotPeriod(s)].push(s);
    return groups;
  }, [slots]);

  function toggleService(id: string) {
    setSelectedSlot(null);
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  useEffect(() => {
    if (!staffId || totalDuration === 0 || !date) {
      // Clearing stale slots when the fetch params become invalid — intentional
      // (React's documented data-fetching-in-effect pattern), not a lint bug.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    const params = new URLSearchParams({
      staffId,
      date,
      durationMinutes: String(totalDuration),
    });
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setSlotsError(data.error);
          setSlots([]);
        } else {
          setSlots(data.slots ?? []);
        }
      })
      .catch(() => setSlotsError("Couldn't load available times."))
      .finally(() => setSlotsLoading(false));
  }, [staffId, date, totalDuration]);

  const canAdvance = [
    selectedServiceIds.length > 0,
    !!staffId,
    !!selectedSlot,
    true,
  ];

  function goToStep(target: number) {
    if (target <= step || canAdvance.slice(0, target).every(Boolean)) {
      setStep(target);
    }
  }

  async function handleConfirm() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          serviceIds: selectedServiceIds,
          startTime: selectedSlot,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not book that time.");
        return;
      }
      setConfirmed(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gold-500/30 bg-navy-950 p-10 text-center text-cream-100">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-5 font-serif text-2xl">You&apos;re booked</p>
        <p className="mt-2 text-cream-200/70">
          We&apos;ll see you{" "}
          {selectedSlot &&
            new Date(selectedSlot).toLocaleString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          .
        </p>
        {selectedStaff && (
          <p className="mt-1 text-sm text-cream-200/60">with {selectedStaff.name}</p>
        )}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-cream-200/80">
          {selectedServices.map((s) => (
            <div key={s.id} className="flex justify-between py-1">
              <span>{s.name}</span>
              <span>${Number(s.price).toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-medium text-cream-100">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <LinkButton href="/account" variant="gold" className="mt-6">
          View my appointments
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-10">
      <div>
        {/* Step indicator */}
        <ol className="flex items-center gap-2 sm:gap-3">
          {STEPS.map((label, i) => {
            const reached = i <= step || canAdvance.slice(0, i).every(Boolean);
            const isCurrent = i === step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  disabled={!reached}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:h-9 sm:w-9 sm:text-sm ${
                    isCurrent
                      ? "border-gold-500 bg-gold-500 text-navy-950"
                      : i < step
                        ? "border-navy-900 bg-navy-900 text-cream-100"
                        : "border-navy-900/15 text-slate-400"
                  } ${reached && !isCurrent ? "cursor-pointer hover:border-gold-500" : ""}`}
                >
                  {i < step ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </button>
                <span
                  className={`hidden text-xs font-medium uppercase tracking-wide sm:block ${
                    isCurrent ? "text-navy-950" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="h-px flex-1 bg-navy-900/10" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>

        {/* Step 0: Services */}
        {step === 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-xl text-navy-950">Choose your service(s)</h2>
            <p className="mt-1 text-sm text-slate-500">Select one or more — pricing updates live.</p>
            <div className="mt-6 space-y-7">
              {categories.map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-600">
                    {category}
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {items.map((service) => {
                      const active = selectedServiceIds.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={`flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors ${
                            active
                              ? "border-gold-500 bg-gold-300/20"
                              : "border-navy-900/10 hover:border-gold-500/50"
                          }`}
                        >
                          <div>
                            <p className="font-medium text-navy-950">{service.name}</p>
                            <p className="text-sm text-slate-500">{service.durationMinutes} min</p>
                          </div>
                          <p className="font-medium text-navy-900">
                            ${Number(service.price).toFixed(2)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step 1: Stylist */}
        {step === 1 && (
          <section className="mt-8">
            <h2 className="font-serif text-xl text-navy-950">Choose your stylist</h2>
            <p className="mt-1 text-sm text-slate-500">Every artist here is trained on your selected service(s).</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {staff.map((s) => {
                const active = staffId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStaffId(s.id)}
                    className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
                      active
                        ? "border-gold-500 bg-gold-300/20"
                        : "border-navy-900/10 hover:border-gold-500/50"
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-900 font-serif text-base text-gold-400">
                      {initials(s.name)}
                    </div>
                    <div>
                      <p className="font-medium text-navy-950">{s.name}</p>
                      {s.specialties && (
                        <p className="text-sm text-slate-500">{s.specialties}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <section className="mt-8">
            <h2 className="font-serif text-xl text-navy-950">Pick a date &amp; time</h2>
            <p className="mt-1 text-sm text-slate-500">
              Total duration {totalDuration} min &middot; ${totalPrice.toFixed(2)}
            </p>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {dayOptions.map((d) => {
                const active = date === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setDate(d.iso)}
                    className={`flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border py-3 text-center transition-colors ${
                      active
                        ? "border-navy-900 bg-navy-900 text-cream-100"
                        : "border-navy-900/10 text-navy-950 hover:border-gold-500/50"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wide opacity-70">{d.dow}</span>
                    <span className="font-serif text-lg font-semibold">{d.day}</span>
                    <span className="text-[10px] uppercase tracking-wide opacity-70">{d.month}</span>
                  </button>
                );
              })}
              <label className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-navy-900/20 text-center text-[10px] uppercase tracking-wide text-slate-500 transition-colors hover:border-gold-500/60">
                Later
                <input
                  type="date"
                  value={date}
                  min={todayISODate()}
                  onChange={(e) => setDate(e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="mt-6">
              {slotsLoading && <p className="text-sm text-slate-500">Loading available times&hellip;</p>}
              {slotsError && <p className="text-sm text-red-600">{slotsError}</p>}
              {!slotsLoading && !slotsError && slots.length === 0 && (
                <p className="text-sm text-slate-500">
                  No openings that day &mdash; try another date.
                </p>
              )}
              <div className="space-y-4">
                {(["Morning", "Afternoon", "Evening"] as const).map(
                  (period) =>
                    groupedSlots[period].length > 0 && (
                      <div key={period}>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-600">
                          {period}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {groupedSlots[period].map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                                selectedSlot === slot
                                  ? "border-navy-900 bg-navy-900 text-cream-100"
                                  : "border-navy-900/15 hover:border-gold-500"
                              }`}
                            >
                              {new Date(slot).toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <section className="mt-8">
            <h2 className="font-serif text-xl text-navy-950">Review &amp; confirm</h2>

            <div className="mt-4 rounded-xl border border-navy-900/10 bg-white/60 p-5">
              <p className="font-medium text-navy-950">
                {selectedSlot &&
                  new Date(selectedSlot).toLocaleString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                with {selectedStaff?.name} &middot; {totalDuration} min
              </p>
              <ul className="mt-3 space-y-1 border-t border-navy-900/10 pt-3 text-sm text-slate-600">
                {selectedServices.map((s) => (
                  <li key={s.id} className="flex justify-between">
                    <span>{s.name}</span>
                    <span>${Number(s.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-navy-900/10 pt-3 font-medium text-navy-950">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5">
              <Textarea
                label="Special requests (optional)"
                placeholder="Allergies, styling preferences, anything we should know…"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="mt-6">
              {authChecked && !loggedIn ? (
                <div className="rounded-2xl border border-navy-900/10 bg-cream-200 p-6">
                  <p className="text-navy-950">Log in or create an account to confirm your booking.</p>
                  <div className="mt-4 flex gap-3">
                    <LinkButton href={`/login?next=/book`} variant="primary">
                      Log in
                    </LinkButton>
                    <LinkButton href={`/signup?next=/book`} variant="outline">
                      Sign up
                    </LinkButton>
                  </div>
                </div>
              ) : (
                <div>
                  {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
                  <Button variant="gold" onClick={handleConfirm} disabled={submitting}>
                    {submitting ? "Booking…" : `Confirm booking — $${totalPrice.toFixed(2)}`}
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Step navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-navy-900/10 pt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-sm font-medium text-slate-500 transition-colors hover:text-navy-950 disabled:opacity-0"
          >
            &larr; Back
          </button>
          {step < STEPS.length - 1 && (
            <Button
              variant="primary"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canAdvance[step]}
              className="px-6 py-3 text-sm disabled:opacity-40"
            >
              Continue
            </Button>
          )}
        </div>
      </div>

      {/* Summary sidebar */}
      <aside className="mt-10 lg:sticky lg:top-24 lg:mt-0">
        <div className="rounded-2xl border border-navy-900/10 bg-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-600">
            Your booking
          </p>
          {selectedServices.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Choose a service to get started.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2 text-sm">
                {selectedServices.map((s) => (
                  <li key={s.id} className="flex justify-between gap-3 text-navy-950">
                    <span>{s.name}</span>
                    <span className="shrink-0 text-slate-500">${Number(s.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-navy-900/10 pt-3 text-sm text-slate-500">
                <span>Duration</span>
                <span>{totalDuration} min</span>
              </div>
              <div className="mt-1 flex justify-between font-serif text-lg font-semibold text-navy-950">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </>
          )}

          {selectedStaff && (
            <div className="mt-4 flex items-center gap-3 border-t border-navy-900/10 pt-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 font-serif text-xs text-gold-400">
                {initials(selectedStaff.name)}
              </div>
              <p className="text-sm text-navy-950">{selectedStaff.name}</p>
            </div>
          )}

          {selectedSlot && (
            <p className="mt-3 text-sm text-navy-950">
              {new Date(selectedSlot).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
