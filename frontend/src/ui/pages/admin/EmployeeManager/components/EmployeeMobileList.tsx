import type { ChangeEvent } from "react";
import type { Employee } from "@/core/types";
import { formatPrice as formatSalary } from "@/lib/format";

interface Props {
  employees: Employee[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails?: (employee: Employee) => void;
}

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function EmployeeMobileList({
  employees,
  isChecked,
  onViewDetails,
}: Props) {
  return (
    <ul className="md:hidden space-y-3 stagger-rows">
      {employees.map((employee) => (
        <li key={employee.id}>
          <div
            className="card bg-base-100 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.99] hover:shadow-md"
            onClick={() => onViewDetails?.(employee)}
          >
            <div className="flex justify-between items-center px-4 pt-4">
              <input
                type="checkbox"
                className="checkbox self-start"
                aria-label={`Seleccionar ${employee.fullName}`}
                onChange={(e) => isChecked(employee.id, e)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center gap-2">
                <div
                  className={
                    employee.state
                      ? "status status-success"
                      : "status status-error"
                  }
                />
                <span className="text-sm">{employee.phone}</span>
              </div>
            </div>
            <figure className="pt-4 flex justify-center">
              <div className="avatar avatar-placeholder">
                <div className="bg-neutral text-neutral-content w-32 rounded-full">
                  <span className="text-3xl font-bold">
                    {initials(employee.fullName)}
                  </span>
                </div>
              </div>
            </figure>
            <div className="card-body items-center text-center">
              <h2 className="card-title">{employee.fullName}</h2>
              <p className="text-sm opacity-80">
                {formatSalary(employee.salary)}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
