import type { Employee } from "@/core/types";
import { resourcesApi } from "@/core/api";
import { formatPrice as formatSalary } from "@/lib/format";

interface Props {
  employee: Employee;
  checked: boolean;
  isChecked: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (employee: Employee) => void;
  onManageBlocks: (employee: Employee) => void;
  onManageAccount: (employee: Employee) => void;
}

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function TableRow({
  employee,
  checked,
  isChecked,
  onViewDetails,
  onManageBlocks,
  onManageAccount,
}: Readonly<Props>) {
  return (
    <tr
      className="cursor-pointer hover:bg-base-200"
      onClick={() => onViewDetails(employee)}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="checkbox"
          checked={checked}
          onChange={(e) => isChecked(employee.id, e)}
          aria-label={`Seleccionar ${employee.fullName}`}
        />
      </td>

      <td>
        <div className="flex items-center gap-3">
          {employee.urlImage ? (
            <div className="avatar">
              <div className="w-12 rounded-full">
                <img
                  src={resourcesApi.imageUrl(employee.urlImage) ?? undefined}
                  alt={employee.fullName}
                />
              </div>
            </div>
          ) : (
            <div className="avatar avatar-placeholder">
              <div className="bg-neutral text-neutral-content w-12 rounded-full">
                <span className="text-sm font-bold">
                  {initials(employee.fullName)}
                </span>
              </div>
            </div>
          )}
          <span className="font-bold">{employee.fullName}</span>
        </div>
      </td>

      <td>{employee.phone}</td>
      <td>{formatSalary(employee.salary)}</td>
      <td>
        <span
          className={`badge ${employee.state ? "badge-success" : "badge-error"}`}
        >
          {employee.state ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          <button
            type="button"
            className="btn btn-xs btn-outline"
            onClick={() => onManageBlocks(employee)}
            title="Bloqueos de horario"
          >
            Bloqueos
          </button>
          <button
            type="button"
            className={`btn btn-xs ${employee.userId ? "btn-ghost" : "btn-outline btn-success"}`}
            onClick={() => onManageAccount(employee)}
            title="Cuenta de acceso al portal"
          >
            {employee.userId ? "🔑" : "Crear cuenta"}
          </button>
        </div>
      </td>
    </tr>
  );
}
