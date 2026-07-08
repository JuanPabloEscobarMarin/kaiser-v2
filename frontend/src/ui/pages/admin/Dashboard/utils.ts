import type { Appointment, Employee } from "@/core/types";
import type { Sale } from "@/core/api/sales.api";
import { appointmentTotal } from "@/lib/appointment";
import { appointmentCommission } from "@/lib/commission";
import { businessNow, businessWallIso } from "@/lib/business-time";

export type Preset = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

export interface DateRange {
  from: Date;
  to: Date;
}

const startOfUtcDay = (d: Date) => {
  const r = new Date(d);
  r.setUTCHours(0, 0, 0, 0);
  return r;
};

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
};

const startOfUtcWeek = (d: Date) => {
  const r = startOfUtcDay(d);
  const dow = r.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  r.setUTCDate(r.getUTCDate() + diff);
  return r;
};

const startOfUtcMonth = (d: Date) => {
  const r = startOfUtcDay(d);
  r.setUTCDate(1);
  return r;
};

// Anclado en la hora del negocio: con new Date() (UTC real), después de las
// 7pm Bogotá "hoy" sería mañana.
export const presetRange = (preset: Preset, today = businessNow()): DateRange => {
  const start = startOfUtcDay(today);
  switch (preset) {
    case "TODAY":
      return { from: start, to: addDays(start, 1) };
    case "WEEK": {
      const from = startOfUtcWeek(today);
      return { from, to: addDays(from, 7) };
    }
    case "MONTH": {
      const from = startOfUtcMonth(today);
      const to = startOfUtcMonth(addDays(from, 32));
      return { from, to };
    }
    case "CUSTOM":
      return { from: start, to: addDays(start, 1) };
  }
};

export const toYmd = (d: Date) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fromYmd = (s: string) => new Date(`${s}T00:00:00.000Z`);

export const inRange = (iso: string, range: DateRange) => {
  const t = new Date(iso).getTime();
  return t >= range.from.getTime() && t < range.to.getTime();
};

/**
 * Como inRange pero para instantes REALES (Sale.createdAt, deducciones):
 * los convierte a hora de pared del negocio antes de comparar. Para
 * scheduledAt (ya fake-UTC) usar inRange directo.
 */
export const inBusinessRange = (iso: string, range: DateRange) =>
  inRange(businessWallIso(iso), range);

export const filterByRange = (
  appointments: Appointment[],
  range: DateRange,
) => appointments.filter((a) => inRange(a.scheduledAt, range));

export { formatPrice } from "@/lib/format";

export const formatDuration = (minutes: number) => {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatRange = (range: DateRange) => {
  const last = addDays(range.to, -1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  if (toYmd(range.from) === toYmd(last)) return fmt(range.from);
  return `${fmt(range.from)} — ${fmt(last)}`;
};

export interface AggregateStats {
  total: number;
  scheduled: number;
  finished: number;
  cancelled: number;
  scheduledMinutes: number;
  expectedRevenue: number;
  confirmedRevenue: number;
}

// Total real de la cita: contempla todos los servicios (multi-servicio),
// combos y el precio final override. Espeja appointmentTotal / el cierre diario.
const priceOf = (a: Appointment) => appointmentTotal(a);

const durationOf = (a: Appointment) => {
  const minutes =
    (new Date(a.endsAt).getTime() - new Date(a.scheduledAt).getTime()) / 60_000;
  return Math.max(0, minutes);
};

export const computeAggregate = (
  appointments: Appointment[],
): AggregateStats => {
  const stats: AggregateStats = {
    total: appointments.length,
    scheduled: 0,
    finished: 0,
    cancelled: 0,
    scheduledMinutes: 0,
    expectedRevenue: 0,
    confirmedRevenue: 0,
  };

  for (const a of appointments) {
    if (a.state === "SCHEDULED") stats.scheduled++;
    else if (a.state === "FINISHED") stats.finished++;
    else if (a.state === "CANCELLED") stats.cancelled++;

    if (a.state !== "CANCELLED") {
      stats.scheduledMinutes += durationOf(a);
      stats.expectedRevenue += priceOf(a);
    }
    if (a.state === "FINISHED") {
      stats.confirmedRevenue += priceOf(a);
    }
  }

  return stats;
};

export interface EmployeeStats {
  employeeId: string;
  employeeName: string;
  total: number;
  finished: number;
  cancelled: number;
  scheduledMinutes: number;
  expectedRevenue: number;
  estimatedCommission: number;
}

export const computePerEmployee = (
  appointments: Appointment[],
  employees: Employee[] = [],
  sales: Sale[] = [],
): EmployeeStats[] => {
  const employeeMap = new Map(employees.map((e) => [e.id, e]));
  const map = new Map<string, EmployeeStats>();

  const getRow = (id: string, name: string): EmployeeStats => {
    let row = map.get(id);
    if (!row) {
      row = {
        employeeId: id,
        employeeName: name,
        total: 0,
        finished: 0,
        cancelled: 0,
        scheduledMinutes: 0,
        expectedRevenue: 0,
        estimatedCommission: 0,
      };
      map.set(id, row);
    }
    return row;
  };

  for (const a of appointments) {
    const current = getRow(a.employeeId, a.employee?.fullName ?? "—");
    current.total++;
    if (a.state === "FINISHED") current.finished++;
    else if (a.state === "CANCELLED") current.cancelled++;
    if (a.state !== "CANCELLED") {
      const price = priceOf(a);
      current.scheduledMinutes += durationOf(a);
      current.expectedRevenue += price;

      // Comisión: snapshot congelado si la cita ya finalizó; para citas
      // agendadas, estimación sobre lo que se cobraría (mismas reglas que el
      // cierre diario del backend).
      const emp = employeeMap.get(a.employeeId);
      const rates = new Map(
        (emp?.services ?? []).map((s) => [s.id, Number(s.commission ?? 0)]),
      );
      current.estimatedCommission += appointmentCommission(a, rates);
    }
  }

  // Add commission earned from product sales attributed to each employee.
  for (const sale of sales) {
    if (!sale.employeeId) continue;
    const name =
      sale.employee?.fullName ??
      employeeMap.get(sale.employeeId)?.fullName ??
      "—";
    getRow(sale.employeeId, name).estimatedCommission += Number(
      sale.commissionTotal,
    );
  }

  return Array.from(map.values()).sort(
    (a, b) => b.expectedRevenue - a.expectedRevenue,
  );
};
