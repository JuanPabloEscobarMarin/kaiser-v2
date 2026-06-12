import {
  formatDuration,
  formatPrice,
  type EmployeeStats,
} from "../utils";

interface Props {
  rows: EmployeeStats[];
}

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function PerEmployeeStats({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body items-center text-center text-sm opacity-60">
          No hay datos de empleados para este rango
        </div>
      </div>
    );
  }

  const maxRevenue = rows.reduce(
    (max, r) => Math.max(max, r.expectedRevenue),
    0,
  );

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h3 className="font-bold text-lg">Por empleado</h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Citas</th>
                <th>Finalizadas</th>
                <th>Canceladas</th>
                <th>Tiempo agendado</th>
                <th>Ingresos esperados</th>
                <th>Comisión estimada</th>
              </tr>
            </thead>
            <tbody className="stagger-rows">
              {rows.map((r) => {
                const pct =
                  maxRevenue === 0
                    ? 0
                    : Math.round((r.expectedRevenue / maxRevenue) * 100);
                return (
                  <tr key={r.employeeId}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-placeholder">
                          <div className="bg-neutral text-neutral-content w-10 rounded-full">
                            <span className="text-sm font-bold">
                              {initials(r.employeeName)}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold">{r.employeeName}</span>
                      </div>
                    </td>
                    <td>{r.total}</td>
                    <td>
                      <span className="badge badge-success badge-sm">
                        {r.finished}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-error badge-sm">
                        {r.cancelled}
                      </span>
                    </td>
                    <td>{formatDuration(r.scheduledMinutes)}</td>
                    <td className="min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold whitespace-nowrap">
                          {formatPrice(r.expectedRevenue)}
                        </span>
                        <progress
                          className="progress progress-primary w-20"
                          value={pct}
                          max={100}
                        />
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-success whitespace-nowrap">
                        {r.estimatedCommission > 0
                          ? formatPrice(r.estimatedCommission)
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
