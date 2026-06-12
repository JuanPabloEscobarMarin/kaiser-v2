import type { Service } from "@/core/types";
import { TableRow } from "./TableRow";

interface Props {
  data: Service[];
  selectedIds: string[];
  isChecked: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (service: Service) => void;
}

export function ServiceDesktopTable({
  data,
  selectedIds,
  isChecked,
  onViewDetails,
}: Readonly<Props>) {
  return (
    <div className="hidden md:block overflow-x-auto bg-base-100 rounded-box shadow">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th></th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Duración</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody className="stagger-rows">
          {data.map((service) => (
            <TableRow
              key={service.id}
              service={service}
              checked={selectedIds.includes(service.id)}
              isChecked={isChecked}
              onViewDetails={onViewDetails}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
