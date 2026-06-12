import type { Employee } from "@/core/types";
import { TableRow } from "./TableRow";

interface Props {
  data: Employee[];
  selectedIds: string[];
  isChecked: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (employee: Employee) => void;
  onManageBlocks: (employee: Employee) => void;
  onManageAccount: (employee: Employee) => void;
}

export function EmployeeDesktopTable({
  data,
  selectedIds,
  isChecked,
  onViewDetails,
  onManageBlocks,
  onManageAccount,
}: Readonly<Props>) {
  return (
    <div className="hidden md:block overflow-x-auto bg-base-100 rounded-box shadow">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th></th>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Salario</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="stagger-rows">
          {data.map((employee) => (
            <TableRow
              key={employee.id}
              employee={employee}
              checked={selectedIds.includes(employee.id)}
              isChecked={isChecked}
              onViewDetails={onViewDetails}
              onManageBlocks={onManageBlocks}
              onManageAccount={onManageAccount}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
