import type { Appointment } from "@/core/types";
import {
  appointmentsRows,
  customersRows,
  customerStats,
  downloadXlsx,
  revenueRows,
} from "../utils";

interface Props {
  appointments: Appointment[];
}

export function ExportSection({ appointments }: Props) {
  const stamp = new Date().toISOString().slice(0, 10);

  const exportAppointments = () =>
    downloadXlsx(
      `citas-${stamp}.xlsx`,
      appointmentsRows(appointments),
      "Citas",
    );

  const exportCustomers = () =>
    downloadXlsx(
      `clientes-${stamp}.xlsx`,
      customersRows(customerStats(appointments)),
      "Clientes",
    );

  const exportRevenue = () =>
    downloadXlsx(
      `ingresos-${stamp}.xlsx`,
      revenueRows(appointments),
      "Ingresos",
    );

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Exportar datos</h2>
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <p className="text-sm opacity-70 mb-3">
            Descarga los datos del período seleccionado como archivo Excel
            (.xlsx).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportAppointments}
              className="btn btn-sm btn-outline"
            >
              📋 Citas ({appointments.length})
            </button>
            <button
              type="button"
              onClick={exportCustomers}
              className="btn btn-sm btn-outline"
            >
              👥 Clientes
            </button>
            <button
              type="button"
              onClick={exportRevenue}
              className="btn btn-sm btn-outline"
            >
              💰 Ingresos por día
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
