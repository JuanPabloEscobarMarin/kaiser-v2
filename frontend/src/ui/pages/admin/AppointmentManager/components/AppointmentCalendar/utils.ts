import type { Appointment, AppointmentState } from "@/core/types";

/**
 * Visible window of the calendar — purely a display setting.
 * The booking system itself still enforces its own business hours
 * (see backend/src/services/appointment.service.ts) so widening this
 * just gives visual breathing room above/below the bookable range.
 */
export const BUSINESS_OPEN = 7;
export const BUSINESS_CLOSE = 20;
export const BUSINESS_HOURS = BUSINESS_CLOSE - BUSINESS_OPEN;
export const PIXELS_PER_MINUTE = 1;
export const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE;
export const COLUMN_HEIGHT = BUSINESS_HOURS * HOUR_HEIGHT;

export const STATE_BADGES: Record<
  AppointmentState,
  { klass: string; label: string }
> = {
  SCHEDULED: { klass: "bg-info/80 text-info-content", label: "Agendada" },
  FINISHED: { klass: "bg-success/80 text-success-content", label: "Finalizada" },
  CANCELLED: {
    klass: "bg-error/40 text-base-content line-through opacity-60",
    label: "Cancelada",
  },
};

/** Returns minutes from midnight UTC for a given ISO datetime */
export const minutesFromMidnight = (iso: string): number => {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

export const sameUtcDay = (iso: string, date: Date): boolean => {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === date.getUTCFullYear() &&
    d.getUTCMonth() === date.getUTCMonth() &&
    d.getUTCDate() === date.getUTCDate()
  );
};

export const utcDayKey = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const utcDateFromKey = (key: string): Date => {
  return new Date(`${key}T00:00:00.000Z`);
};

export const startOfUtcDay = (date: Date): Date => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const startOfUtcWeek = (date: Date): Date => {
  const d = startOfUtcDay(date);
  const dow = d.getUTCDay(); // 0=sun, 1=mon
  const diff = dow === 0 ? -6 : 1 - dow; // align to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
};

export const addUtcDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

export const addUtcMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

export const startOfUtcMonth = (date: Date): Date => {
  const d = startOfUtcDay(date);
  d.setUTCDate(1);
  return d;
};

export const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};

export const filterAppointmentsByDay = (
  appointments: Appointment[],
  date: Date,
): Appointment[] =>
  appointments.filter((a) => sameUtcDay(a.scheduledAt, date));

export const filterAppointmentsByRange = (
  appointments: Appointment[],
  start: Date,
  end: Date,
): Appointment[] =>
  appointments.filter((a) => {
    const t = new Date(a.scheduledAt).getTime();
    return t >= start.getTime() && t < end.getTime();
  });
