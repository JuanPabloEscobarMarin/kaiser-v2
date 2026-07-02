import {
  customersRows,
  downloadXlsx,
  formatPrice,
  type CustomerStat,
} from "../utils";
import { initials } from "@/lib/format";

interface Props {
  rows: CustomerStat[];
}

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const Avatar = ({ name }: { name: string }) => (
  <div className="avatar avatar-placeholder">
    <div className="bg-neutral text-neutral-content w-8 rounded-full">
      <span className="text-xs font-bold">{initials(name)}</span>
    </div>
  </div>
);

export function TopCustomers({ rows }: Props) {
  const byFrequency = [...rows]
    .sort((a, b) => b.appointments - a.appointments)
    .slice(0, 10);

  const bySpending = [...rows]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  if (rows.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Top clientes</h2>
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-sm opacity-60">
            No hay datos de clientes en este período
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Top clientes</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() =>
            downloadXlsx(
              `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`,
              customersRows(rows),
              "Clientes",
            )
          }
        >
          Descargar informe clientes
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            <h3 className="font-bold mb-2">Por frecuencia</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Citas</th>
                    <th>Última</th>
                  </tr>
                </thead>
                <tbody>
                  {byFrequency.map((r, i) => (
                    <tr
                      key={`f-${r.phone}`}
                      className="animate-row-in hover:bg-base-200/50 transition-colors"
                      style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={r.fullName} />
                          <div>
                            <div className="font-semibold leading-tight">
                              {r.fullName}
                            </div>
                            <div className="text-xs opacity-60">
                              {r.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="font-bold">{r.appointments}</td>
                      <td className="text-xs">{formatDate(r.lastVisit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            <h3 className="font-bold mb-2">Por gasto</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {bySpending.map((r, i) => (
                    <tr
                      key={`s-${r.phone}`}
                      className="animate-row-in hover:bg-base-200/50 transition-colors"
                      style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={r.fullName} />
                          <div>
                            <div className="font-semibold leading-tight">
                              {r.fullName}
                            </div>
                            <div className="text-xs opacity-60">
                              {r.finished} finalizadas
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="font-bold whitespace-nowrap">
                        {formatPrice(r.totalSpent)}
                      </td>
                      <td className="text-xs whitespace-nowrap">
                        {formatPrice(r.averageSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
