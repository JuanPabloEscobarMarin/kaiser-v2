import type { Appointment } from "@/core/types";
import { TableRow } from "./TableRow";

interface Props {
  data: Appointment[];
  selectedIds: string[];
  isChecked: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (appointment: Appointment) => void;
}

export function AppointmentDesktopTable({
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
            <th>Fecha / Hora</th>
            <th>Servicio</th>
            <th>Profesional</th>
            <th>Cliente</th>
            <th>Contacto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody className="stagger-rows">
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-6 opacity-60">
                Sin citas
              </td>
            </tr>
          )}
          {data.map((appointment) => (
            <TableRow
              key={appointment.id}
              appointment={appointment}
              checked={selectedIds.includes(appointment.id)}
              isChecked={isChecked}
              onViewDetails={onViewDetails}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
