import type { Appointment, Employee } from "@/core/types";
import type { Sale } from "@/core/api/sales.api";
import type { Deduction } from "@/core/api/deductions.api";
import { appointmentServices, appointmentTotal } from "@/lib/appointment";
import { appointmentCommission } from "@/lib/commission";
import { businessWallIso } from "@/lib/business-time";

/**
 * Informe económico por empleado. Espeja la lógica del cierre diario del
 * backend (daily-close.service.ts):
 *  - Solo citas FINISHED cuentan para ingresos/comisión de servicios.
 *  - Ingreso de la cita = precio final → precio combo → suma con descuentos.
 *  - Comisión de servicios = snapshot congelado al finalizar (fallback para
 *    citas pre-snapshot: misma regla sobre lo cobrado con tasas actuales).
 *  - Costo/utilidad de productos = unitCost congelado en cada línea de venta.
 *  - Neto a pagar = comisión servicios + comisión productos − deducciones.
 */

export type GroupBy = "day" | "month";

/** Fila = período (día o mes) × empleado. */
export interface EconomicRow {
  period: string; // "YYYY-MM-DD" o "YYYY-MM"
  employeeId: string;
  employeeName: string;
  finishedAppointments: number;
  serviceRevenue: number;
  serviceCommission: number;
  productSales: number;
  /** Costo de lo vendido (Σ unitCost × cantidad, congelado en la venta). */
  productCost: number;
  /** Utilidad bruta de productos = ventas − costo. */
  productProfit: number;
  productCommission: number;
  deductions: number;
  netEarnings: number;
}

/** Totales de un empleado en todo el rango. */
export type EmployeeEconomicTotals = Omit<EconomicRow, "period">;

export interface EconomicsResult {
  rows: EconomicRow[];
  byEmployee: EmployeeEconomicTotals[];
  grandTotal: EmployeeEconomicTotals;
}

/** Ventas de mostrador sin profesional asignado se agrupan bajo esta clave. */
export const NO_EMPLOYEE_ID = "__none__";
export const NO_EMPLOYEE_LABEL = "(Sin profesional)";

const periodOf = (iso: string, groupBy: GroupBy) =>
  iso.slice(0, groupBy === "day" ? 10 : 7);

const emptyTotals = (
  employeeId: string,
  employeeName: string,
): EmployeeEconomicTotals => ({
  employeeId,
  employeeName,
  finishedAppointments: 0,
  serviceRevenue: 0,
  serviceCommission: 0,
  productSales: 0,
  productCost: 0,
  productProfit: 0,
  productCommission: 0,
  deductions: 0,
  netEarnings: 0,
});

const round = (n: number) => Math.round(n * 100) / 100;

interface ComputeInput {
  /** Citas ya filtradas al rango del reporte. */
  appointments: Appointment[];
  /** Ventas ya filtradas al rango del reporte. */
  sales: Sale[];
  /** Deducciones ya filtradas al rango del reporte. */
  deductions: Deduction[];
  /** Empleados (vista admin, con % de comisión por servicio). */
  employees: Employee[];
  groupBy: GroupBy;
  /** Limitar el informe a un empleado; undefined = todos. */
  employeeId?: string | undefined;
}

export function computeEconomics({
  appointments,
  sales,
  deductions,
  employees,
  groupBy,
  employeeId,
}: ComputeInput): EconomicsResult {
  // % de comisión por servicio de cada empleado.
  const commissionMaps = new Map<string, Map<string, number>>(
    employees.map((e) => [
      e.id,
      new Map((e.services ?? []).map((s) => [s.id, Number(s.commission ?? 0)])),
    ]),
  );
  const employeeNames = new Map(employees.map((e) => [e.id, e.fullName]));
  const nameOf = (id: string, fallback?: string | null) =>
    id === NO_EMPLOYEE_ID
      ? NO_EMPLOYEE_LABEL
      : (employeeNames.get(id) ?? fallback ?? "—");

  const rows = new Map<string, EconomicRow>();
  const rowFor = (period: string, empId: string, empName: string) => {
    const key = `${period}|${empId}`;
    let row = rows.get(key);
    if (!row) {
      row = { period, ...emptyTotals(empId, empName) };
      rows.set(key, row);
    }
    return row;
  };

  // ── Citas finalizadas → ingresos + comisión de servicios ────────────────
  for (const a of appointments) {
    if (a.state !== "FINISHED") continue;
    if (employeeId && a.employeeId !== employeeId) continue;
    const row = rowFor(
      periodOf(a.scheduledAt, groupBy),
      a.employeeId,
      nameOf(a.employeeId, a.employee?.fullName),
    );
    row.finishedAppointments++;
    row.serviceRevenue += appointmentTotal(a);
    // Snapshot congelado; fallback con tasas actuales para citas pre-snapshot.
    row.serviceCommission += appointmentCommission(
      a,
      commissionMaps.get(a.employeeId),
    );
  }

  // ── Ventas de productos → ventas + comisión de productos ────────────────
  for (const s of sales) {
    const empId = s.employeeId ?? NO_EMPLOYEE_ID;
    if (employeeId && empId !== employeeId) continue;
    const row = rowFor(
      // createdAt es instante real: agrupar por el día de negocio (Bogotá).
      periodOf(businessWallIso(s.createdAt), groupBy),
      empId,
      nameOf(empId, s.employee?.fullName),
    );
    row.productSales += Number(s.total);
    row.productCost += s.items.reduce(
      (sum, it) => sum + Number(it.unitCost ?? 0) * it.quantity,
      0,
    );
    // Sin profesional no hay a quién pagarle la comisión.
    if (empId !== NO_EMPLOYEE_ID) {
      row.productCommission += Number(s.commissionTotal);
    }
  }

  // ── Deducciones ──────────────────────────────────────────────────────────
  for (const d of deductions) {
    if (employeeId && d.employeeId !== employeeId) continue;
    const row = rowFor(
      periodOf(businessWallIso(d.createdAt), groupBy),
      d.employeeId,
      nameOf(d.employeeId),
    );
    row.deductions += Number(d.amount);
  }

  // ── Neto + agregados ─────────────────────────────────────────────────────
  const byEmployeeMap = new Map<string, EmployeeEconomicTotals>();
  const grandTotal = emptyTotals("", "TOTAL");

  for (const row of rows.values()) {
    row.productProfit = row.productSales - row.productCost;
    row.netEarnings =
      row.serviceCommission + row.productCommission - row.deductions;

    let acc = byEmployeeMap.get(row.employeeId);
    if (!acc) {
      acc = emptyTotals(row.employeeId, row.employeeName);
      byEmployeeMap.set(row.employeeId, acc);
    }
    for (const k of [
      "finishedAppointments",
      "serviceRevenue",
      "serviceCommission",
      "productSales",
      "productCost",
      "productProfit",
      "productCommission",
      "deductions",
      "netEarnings",
    ] as const) {
      acc[k] += row[k];
      grandTotal[k] += row[k];
    }
  }

  const roundTotals = <T extends EmployeeEconomicTotals>(t: T): T => ({
    ...t,
    serviceRevenue: round(t.serviceRevenue),
    serviceCommission: round(t.serviceCommission),
    productSales: round(t.productSales),
    productCost: round(t.productCost),
    productProfit: round(t.productProfit),
    productCommission: round(t.productCommission),
    deductions: round(t.deductions),
    netEarnings: round(t.netEarnings),
  });

  return {
    rows: Array.from(rows.values())
      .map(roundTotals)
      .sort(
        (a, b) =>
          b.period.localeCompare(a.period) ||
          a.employeeName.localeCompare(b.employeeName),
      ),
    byEmployee: Array.from(byEmployeeMap.values())
      .map(roundTotals)
      .sort((a, b) => b.netEarnings - a.netEarnings),
    grandTotal: roundTotals(grandTotal),
  };
}

// ─────────── Filas para las hojas del Excel ─────────────────────────────────

const DEDUCTION_LABELS: Record<string, string> = {
  ADVANCE: "Adelanto",
  PRODUCT: "Producto",
  OTHER: "Otro",
};

export const economicSummaryRows = (result: EconomicsResult) => [
  ...result.byEmployee.map((e) => ({
    empleado: e.employeeName,
    citas_finalizadas: e.finishedAppointments,
    ingresos_servicios: e.serviceRevenue,
    comision_servicios: e.serviceCommission,
    ventas_productos: e.productSales,
    costo_productos: e.productCost,
    utilidad_productos: e.productProfit,
    comision_productos: e.productCommission,
    deducciones: e.deductions,
    neto_a_pagar: e.netEarnings,
  })),
  {
    empleado: "TOTAL",
    citas_finalizadas: result.grandTotal.finishedAppointments,
    ingresos_servicios: result.grandTotal.serviceRevenue,
    comision_servicios: result.grandTotal.serviceCommission,
    ventas_productos: result.grandTotal.productSales,
    costo_productos: result.grandTotal.productCost,
    utilidad_productos: result.grandTotal.productProfit,
    comision_productos: result.grandTotal.productCommission,
    deducciones: result.grandTotal.deductions,
    neto_a_pagar: result.grandTotal.netEarnings,
  },
];

export const economicPeriodRows = (result: EconomicsResult) =>
  result.rows.map((r) => ({
    periodo: r.period,
    empleado: r.employeeName,
    citas_finalizadas: r.finishedAppointments,
    ingresos_servicios: r.serviceRevenue,
    comision_servicios: r.serviceCommission,
    ventas_productos: r.productSales,
    costo_productos: r.productCost,
    utilidad_productos: r.productProfit,
    comision_productos: r.productCommission,
    deducciones: r.deductions,
    neto_a_pagar: r.netEarnings,
  }));

export const economicAppointmentRows = (
  appointments: Appointment[],
  employees: Employee[],
  employeeId?: string,
) => {
  const commissionMaps = new Map<string, Map<string, number>>(
    employees.map((e) => [
      e.id,
      new Map((e.services ?? []).map((s) => [s.id, Number(s.commission ?? 0)])),
    ]),
  );
  return appointments
    .filter(
      (a) =>
        a.state === "FINISHED" &&
        (!employeeId || a.employeeId === employeeId),
    )
    .map((a) => {
      const commission = appointmentCommission(a, commissionMaps.get(a.employeeId));
      return {
        fecha: a.scheduledAt.slice(0, 16).replace("T", " "),
        empleado: a.employee?.fullName ?? "—",
        cliente: a.booking?.customer?.fullName ?? "—",
        servicios: appointmentServices(a)
          .map((s) => s.name)
          .join(" + "),
        precio: round(appointmentTotal(a)),
        comision: round(commission),
      };
    });
};

export const economicSaleRows = (sales: Sale[], employeeId?: string) =>
  sales
    .filter((s) => !employeeId || s.employeeId === employeeId)
    .map((s) => {
      const cost = s.items.reduce(
        (sum, it) => sum + Number(it.unitCost ?? 0) * it.quantity,
        0,
      );
      return {
        fecha: businessWallIso(s.createdAt).slice(0, 16).replace("T", " "),
        empleado: s.employee?.fullName ?? NO_EMPLOYEE_LABEL,
        cliente: s.customer?.fullName ?? "—",
        productos: s.items
          .map((it) => `${it.product?.name ?? "?"} x${it.quantity}`)
          .join(", "),
        total: round(Number(s.total)),
        costo: round(cost),
        utilidad: round(Number(s.total) - cost),
        comision: s.employeeId ? round(Number(s.commissionTotal)) : 0,
      };
    });

export const economicDeductionRows = (
  deductions: Deduction[],
  employees: Employee[],
  employeeId?: string,
) => {
  const names = new Map(employees.map((e) => [e.id, e.fullName]));
  return deductions
    .filter((d) => !employeeId || d.employeeId === employeeId)
    .map((d) => ({
      fecha: businessWallIso(d.createdAt).slice(0, 16).replace("T", " "),
      empleado: names.get(d.employeeId) ?? "—",
      tipo: DEDUCTION_LABELS[d.type] ?? d.type,
      monto: round(Number(d.amount)),
      nota: d.note ?? "",
    }));
};
