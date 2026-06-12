import * as XLSX from "xlsx";
import type { Appointment } from "@/core/types";
import type { DateRange } from "../Dashboard/utils";

// ─────────── Date helpers ──────────────────────────────────────────────────

export const previousRange = (range: DateRange): DateRange => {
  const length = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - length),
    to: new Date(range.from.getTime()),
  };
};

export const inRange = (iso: string, range: DateRange) => {
  const t = new Date(iso).getTime();
  return t >= range.from.getTime() && t < range.to.getTime();
};

export const filterByRange = (apts: Appointment[], range: DateRange) =>
  apts.filter((a) => inRange(a.scheduledAt, range));

// ─────────── Money / time helpers ──────────────────────────────────────────

const priceOf = (a: Appointment) => {
  const price = Number(a.service?.price ?? 0);
  const discount = Number(a.service?.discount ?? 0);
  return Math.max(0, price - discount);
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export const formatPercent = (n: number, digits = 1) =>
  `${(n * 100).toFixed(digits)}%`;

// ─────────── Period comparison ─────────────────────────────────────────────

export interface PeriodSummary {
  total: number;
  finished: number;
  cancelled: number;
  uniqueCustomers: number;
  expectedRevenue: number;
  confirmedRevenue: number;
}

export const summarize = (apts: Appointment[]): PeriodSummary => {
  const summary: PeriodSummary = {
    total: apts.length,
    finished: 0,
    cancelled: 0,
    uniqueCustomers: 0,
    expectedRevenue: 0,
    confirmedRevenue: 0,
  };
  const customers = new Set<string>();
  for (const a of apts) {
    if (a.state === "FINISHED") summary.finished++;
    else if (a.state === "CANCELLED") summary.cancelled++;
    if (a.state !== "CANCELLED") summary.expectedRevenue += priceOf(a);
    if (a.state === "FINISHED") summary.confirmedRevenue += priceOf(a);
    const id = a.booking?.customer?.identification;
    if (id) customers.add(id);
  }
  summary.uniqueCustomers = customers.size;
  return summary;
};

export const diff = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / previous;
};

// ─────────── Top customers ─────────────────────────────────────────────────

export interface CustomerStat {
  identification: string;
  fullName: string;
  phone: string;
  appointments: number;
  finished: number;
  totalSpent: number;
  averageSpent: number;
  lastVisit: string | null;
  firstVisit: string | null;
}

export const customerStats = (apts: Appointment[]): CustomerStat[] => {
  const map = new Map<string, CustomerStat>();

  for (const a of apts) {
    const c = a.booking?.customer;
    if (!c) continue;
    const cur =
      map.get(c.identification) ??
      ({
        identification: c.identification,
        fullName: c.fullName,
        phone: c.phone,
        appointments: 0,
        finished: 0,
        totalSpent: 0,
        averageSpent: 0,
        lastVisit: null,
        firstVisit: null,
      } satisfies CustomerStat);

    cur.appointments++;
    if (a.state === "FINISHED") {
      cur.finished++;
      cur.totalSpent += priceOf(a);
    }
    const t = a.scheduledAt;
    if (!cur.firstVisit || t < cur.firstVisit) cur.firstVisit = t;
    if (!cur.lastVisit || t > cur.lastVisit) cur.lastVisit = t;

    map.set(c.identification, cur);
  }

  for (const v of map.values()) {
    v.averageSpent = v.finished > 0 ? v.totalSpent / v.finished : 0;
  }

  return Array.from(map.values());
};

// ─────────── Return rate ───────────────────────────────────────────────────

/**
 * Of all customers in the dataset, what % booked a second appointment within
 * `windowDays` after their first one.
 */
export interface ReturnRateResult {
  returning: number;
  total: number;
  rate: number;
}

export const returnRate = (
  apts: Appointment[],
  windowDays = 60,
): ReturnRateResult => {
  const byCustomer = new Map<string, string[]>();

  for (const a of apts) {
    const id = a.booking?.customer?.identification;
    if (!id) continue;
    if (a.state === "CANCELLED") continue;
    const arr = byCustomer.get(id) ?? [];
    arr.push(a.scheduledAt);
    byCustomer.set(id, arr);
  }

  let returning = 0;
  for (const dates of byCustomer.values()) {
    if (dates.length < 2) continue;
    dates.sort();
    const first = new Date(dates[0]!).getTime();
    const second = new Date(dates[1]!).getTime();
    if (second - first <= windowDays * 86_400_000) returning++;
  }

  const total = byCustomer.size;
  return { returning, total, rate: total > 0 ? returning / total : 0 };
};

// ─────────── Heatmap (day-of-week × hour) ──────────────────────────────────

export const HEATMAP_HOUR_START = 7;
export const HEATMAP_HOUR_END = 20; // inclusive
export const HEATMAP_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export interface HeatmapResult {
  grid: number[][]; // [day][hour-offset] = count
  max: number;
}

export const heatmap = (apts: Appointment[]): HeatmapResult => {
  const cols = HEATMAP_HOUR_END - HEATMAP_HOUR_START + 1;
  const grid: number[][] = Array.from({ length: 7 }, () =>
    Array(cols).fill(0),
  );
  let max = 0;

  for (const a of apts) {
    if (a.state === "CANCELLED") continue;
    const d = new Date(a.scheduledAt);
    const dow = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1; // Mon=0
    const hour = d.getUTCHours();
    if (hour < HEATMAP_HOUR_START || hour > HEATMAP_HOUR_END) continue;
    const col = hour - HEATMAP_HOUR_START;
    grid[dow]![col]!++;
    if (grid[dow]![col]! > max) max = grid[dow]![col]!;
  }

  return { grid, max };
};

// ─────────── XLSX export ───────────────────────────────────────────────────

/**
 * Auto-size columns based on the longest value in each column (including the
 * header). Caps width at 60 so a single long row doesn't make the sheet
 * unreadable.
 */
const autoSize = (rows: Record<string, unknown>[]): XLSX.ColInfo[] => {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]!);
  return headers.map((h) => {
    const maxLen = rows.reduce((acc, r) => {
      const len = (r[h] == null ? "" : String(r[h])).length;
      return Math.max(acc, len);
    }, h.length);
    return { wch: Math.min(maxLen + 2, 60) };
  });
};

const downloadWorkbook = (filename: string, wb: XLSX.WorkBook): void => {
  XLSX.writeFile(wb, filename, { compression: true });
};

const sheetFromRows = (
  rows: Record<string, unknown>[],
  sheetName: string,
): XLSX.WorkSheet => {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = autoSize(rows);
  ws["!autofilter"] = rows.length
    ? { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: Object.keys(rows[0]!).length - 1, r: rows.length } }) }
    : undefined;
  void sheetName;
  return ws;
};

export const downloadXlsx = (
  filename: string,
  rows: Record<string, unknown>[],
  sheetName = "Reporte",
): void => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rows, sheetName), sheetName);
  downloadWorkbook(filename, wb);
};

// ─────────── Export builders (rows for XLSX) ───────────────────────────────

export const appointmentsRows = (apts: Appointment[]) =>
  apts.map((a) => ({
    fecha: a.scheduledAt,
    estado: a.state,
    servicio: a.service?.name ?? "",
    precio_servicio: Number(a.service?.price ?? 0),
    descuento: Number(a.service?.discount ?? 0),
    profesional: a.employee?.fullName ?? "",
    cliente: a.booking?.customer?.fullName ?? "",
    cedula: a.booking?.customer?.identification ?? "",
    telefono: a.booking?.customer?.phone ?? "",
    creada_en: a.createdAt,
  }));

export const customersRows = (rows: CustomerStat[]) =>
  rows.map((r) => ({
    nombre: r.fullName,
    cedula: r.identification,
    telefono: r.phone,
    citas: r.appointments,
    finalizadas: r.finished,
    total_gastado: Math.round(r.totalSpent),
    promedio: Math.round(r.averageSpent),
    primera_visita: r.firstVisit ?? "",
    ultima_visita: r.lastVisit ?? "",
  }));

export const revenueRows = (apts: Appointment[]) => {
  // Daily aggregation
  const byDay = new Map<
    string,
    {
      fecha: string;
      citas: number;
      ingresos_esperados: number;
      ingresos_confirmados: number;
    }
  >();

  for (const a of apts) {
    const day = a.scheduledAt.slice(0, 10);
    const cur = byDay.get(day) ?? {
      fecha: day,
      citas: 0,
      ingresos_esperados: 0,
      ingresos_confirmados: 0,
    };
    cur.citas++;
    if (a.state !== "CANCELLED") cur.ingresos_esperados += priceOf(a);
    if (a.state === "FINISHED") cur.ingresos_confirmados += priceOf(a);
    byDay.set(day, cur);
  }

  return Array.from(byDay.values())
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((r) => ({
      ...r,
      ingresos_esperados: Math.round(r.ingresos_esperados),
      ingresos_confirmados: Math.round(r.ingresos_confirmados),
    }));
};
