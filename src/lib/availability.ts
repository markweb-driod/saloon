import { addMinutes, areIntervalsOverlapping, isBefore, set, startOfDay } from "date-fns";

export type WorkingHoursWindow = { start: string; end: string };
export type WorkingHours = Partial<
  Record<"sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat", WorkingHoursWindow[]>
>;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const SLOT_INTERVAL_MINUTES = 15;

export function parseWorkingHours(raw: string | null): WorkingHours {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as WorkingHours;
  } catch {
    return {};
  }
}

function timeOnDate(date: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
}

export function getAvailableSlots(opts: {
  date: Date;
  workingHours: WorkingHours;
  serviceDurationMinutes: number;
  busyIntervals: { start: Date; end: Date }[];
  now?: Date;
}): Date[] {
  const day = startOfDay(opts.date);
  const dayKey = DAY_KEYS[day.getDay()];
  const windows = opts.workingHours[dayKey] ?? [];
  const now = opts.now ?? new Date();

  const slots: Date[] = [];

  for (const window of windows) {
    const windowStart = timeOnDate(day, window.start);
    const windowEnd = timeOnDate(day, window.end);

    let candidate = windowStart;
    while (true) {
      const candidateEnd = addMinutes(candidate, opts.serviceDurationMinutes);
      if (candidateEnd > windowEnd) break;

      const isPast = isBefore(candidate, now);
      const overlapsBusy = opts.busyIntervals.some((busy) =>
        areIntervalsOverlapping(
          { start: candidate, end: candidateEnd },
          { start: busy.start, end: busy.end }
        )
      );

      if (!isPast && !overlapsBusy) {
        slots.push(candidate);
      }

      candidate = addMinutes(candidate, SLOT_INTERVAL_MINUTES);
    }
  }

  return slots;
}
