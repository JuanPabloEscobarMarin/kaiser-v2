import { useMemo, useState } from "react";
import type { Appointment, Employee } from "@/core/types";
import type { Sale } from "@/core/api/sales.api";
import type { Deduction } from "@/core/api/deductions.api";
import { toYmd, type DateRange } from "../../Dashboard/utils";
import { downloadXlsxMulti, formatPrice } from "../utils";
import {
  computeEconomics,
  economicAppointmentRows,
  economicDeductionRows,
  economicPeriodRows,
  economicSaleRows,
  economicSummaryRows,
  type GroupBy,
} from "../economics";

interface Props {
  /** Citas, ventas y deducciones ya filtradas al rango del reporte. */
  appointments: Appointment[];
  sales: Sale[];
  deductions: Deduction[];
  employees: Employee[];
  range: DateRange;
}

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** "2026-07-03" → "03 jul 2026" · "2026-07" → "jul 2026" */
const formatPeriod = (period: string) => {
  const [y, m, d] = period.split("-");
  const month = MONTHS[Number(m) - 1] ?? m;
  return d ? `${d} ${month} ${y}` : `${month} ${y}`;
};

export function EconomicReport({
  appointments,
  sales,
  deductions,
  employees,
  range,
}: Props) {
  const [employeeId, setEmployeeId] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("day");

  const result = useMemo(
    () =>
      computeEconomics({
        appointments,
        sales,
        deductions,
        employees,
        groupBy,
        employeeId: employeeId || undefined,
      }),
    [appointments, sales, deductions, employees, groupBy, employeeId],
  );

  const exportXlsx = () => {
    const from = toYmd(range.from);
    const to = toYmd(new Date(range.to.getTime() - 86_400_000));
    const empSlug = employeeId
      ? `-${(employees.find((e) => e.id === employeeId)?.fullName ?? "empleado")
          .toLowerCase()
          .replace(/\s+/g, "-")}`
      : "";
    downloadXlsxMulti(`informe-economico_${from}_${to}${empSlug}.xlsx`, [
      { name: "Resumen", rows: economicSummaryRows(result) },
      {
        name: groupBy === "day" ? "Por día" : "Por mes",
        rows: economicPeriodRows(result),
      },
      {
        name: "Citas",
        rows: economicAppointmentRows(
          appointments,
          employees,
          employeeId || undefined,
        ),
      },
      { name: "Ventas", rows: economicSaleRows(sales, employeeId || undefined) },
      {
        name: "Deducciones",
        rows: economicDeductionRows(
          deductions,
          employees,
          employeeId || undefined,
        ),
      },
    ]);
  };

  const money = (n: number) => formatPrice(n);

  // Ganancia del negocio en el rango: lo que queda después de pagar
  // comisiones y descontar el costo de los productos vendidos.
  const businessNet =
    result.grandTotal.serviceRevenue -
    result.grandTotal.serviceCommission +
    result.grandTotal.productProfit -
    result.grandTotal.productCommission;

  return (
    <section>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-3">
        <div>
          <h2 className="text-lg font-semibold">Informe económico</h2>
          <p className="text-sm opacity-70">
            Ingresos, comisiones, ventas y deducciones por empleado. Solo
            citas finalizadas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select select-bordered select-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            aria-label="Filtrar por empleado"
          >
            <option value="">Todos los empleados</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
          <div role="tablist" className="tabs tabs-boxed tabs-sm">
            <button
              role="tab"
              className={`tab ${groupBy === "day" ? "tab-active" : ""}`}
              onClick={() => setGroupBy("day")}
            >
              Por día
            </button>
            <button
              role="tab"
              className={`tab ${groupBy === "month" ? "tab-active" : ""}`}
              onClick={() => setGroupBy("month")}
            >
              Por mes
            </button>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={exportXlsx}
            disabled={result.rows.length === 0}
          >
            📥 Exportar Excel
          </button>
        </div>
      </div>

      {/* Ganancia del negocio (todo el rango) */}
      {result.byEmployee.length > 0 && (
        <div className="stats shadow mb-4">
          <div className="stat">
            <div className="stat-title">Ganancia del negocio</div>
            <div className="stat-value text-success text-2xl">
              {money(businessNet)}
            </div>
            <div className="stat-desc">
              Ingresos servicios − comisión servicios + utilidad productos −
              comisión productos
            </div>
          </div>
        </div>
      )}

      {/* Resumen por empleado (todo el rango) */}
      <div className="card bg-base-100 shadow mb-4">
        <div className="card-body p-4">
          <h3 className="font-semibold text-sm opacity-70 mb-2">
            Resumen del período por empleado
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th className="text-right">Citas</th>
                  <th className="text-right">Ingresos servicios</th>
                  <th className="text-right">Comisión servicios</th>
                  <th className="text-right">Ventas productos</th>
                  <th className="text-right">Utilidad productos</th>
                  <th className="text-right">Comisión productos</th>
                  <th className="text-right">Deducciones</th>
                  <th className="text-right">Neto a pagar</th>
                </tr>
              </thead>
              <tbody>
                {result.byEmployee.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center opacity-60 py-4">
                      Sin movimientos económicos en este período
                    </td>
                  </tr>
                )}
                {result.byEmployee.map((e) => (
                  <tr key={e.employeeId}>
                    <td className="font-medium">{e.employeeName}</td>
                    <td className="text-right">{e.finishedAppointments}</td>
                    <td className="text-right">{money(e.serviceRevenue)}</td>
                    <td className="text-right">{money(e.serviceCommission)}</td>
                    <td className="text-right">{money(e.productSales)}</td>
                    <td className="text-right">{money(e.productProfit)}</td>
                    <td className="text-right">{money(e.productCommission)}</td>
                    <td className="text-right text-error">
                      {e.deductions > 0 ? `−${money(e.deductions)}` : money(0)}
                    </td>
                    <td className="text-right font-bold text-success">
                      {money(e.netEarnings)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {result.byEmployee.length > 0 && (
                <tfoot>
                  <tr className="font-bold border-t-2 border-base-300">
                    <td>TOTAL</td>
                    <td className="text-right">
                      {result.grandTotal.finishedAppointments}
                    </td>
                    <td className="text-right">
                      {money(result.grandTotal.serviceRevenue)}
                    </td>
                    <td className="text-right">
                      {money(result.grandTotal.serviceCommission)}
                    </td>
                    <td className="text-right">
                      {money(result.grandTotal.productSales)}
                    </td>
                    <td className="text-right">
                      {money(result.grandTotal.productProfit)}
                    </td>
                    <td className="text-right">
                      {money(result.grandTotal.productCommission)}
                    </td>
                    <td className="text-right text-error">
                      {result.grandTotal.deductions > 0
                        ? `−${money(result.grandTotal.deductions)}`
                        : money(0)}
                    </td>
                    <td className="text-right text-success">
                      {money(result.grandTotal.netEarnings)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Detalle por período */}
      {result.rows.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm opacity-70 mb-2">
              Detalle {groupBy === "day" ? "por día" : "por mes"}
            </h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="table table-sm table-pin-rows">
                <thead>
                  <tr>
                    <th>{groupBy === "day" ? "Día" : "Mes"}</th>
                    <th>Empleado</th>
                    <th className="text-right">Citas</th>
                    <th className="text-right">Ingresos servicios</th>
                    <th className="text-right">Comisión servicios</th>
                    <th className="text-right">Ventas productos</th>
                    <th className="text-right">Utilidad productos</th>
                    <th className="text-right">Comisión productos</th>
                    <th className="text-right">Deducciones</th>
                    <th className="text-right">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r) => (
                    <tr key={`${r.period}|${r.employeeId}`}>
                      <td className="whitespace-nowrap">
                        {formatPeriod(r.period)}
                      </td>
                      <td>{r.employeeName}</td>
                      <td className="text-right">{r.finishedAppointments}</td>
                      <td className="text-right">{money(r.serviceRevenue)}</td>
                      <td className="text-right">
                        {money(r.serviceCommission)}
                      </td>
                      <td className="text-right">{money(r.productSales)}</td>
                      <td className="text-right">{money(r.productProfit)}</td>
                      <td className="text-right">
                        {money(r.productCommission)}
                      </td>
                      <td className="text-right text-error">
                        {r.deductions > 0
                          ? `−${money(r.deductions)}`
                          : money(0)}
                      </td>
                      <td className="text-right font-semibold">
                        {money(r.netEarnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
