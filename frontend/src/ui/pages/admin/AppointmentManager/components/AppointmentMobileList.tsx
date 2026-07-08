import type { ChangeEvent } from "react";
import type { Appointment } from "@/core/types";
import {
  appointmentDurationMin,
  appointmentServicesLabel,
  appointmentTotal,
} from "@/lib/appointment";
import { formatPrice } from "@/lib/format";

const STATE_LABELS: Record<
  Appointment["state"],
  { label: string; klass: string }
> = {
  SCHEDULED: { label: "Agendada", klass: "badge-info" },
  FINISHED: { label: "Finalizada", klass: "badge-success" },
  CANCELLED: { label: "Cancelada", klass: "badge-error" },
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

interface Props {
  appointments: Appointment[];
  selectedIds: string[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails?: (appointment: Appointment) => void;
}

export function AppointmentMobileList({
  appointments,
  selectedIds,
  isChecked,
  onViewDetails,
}: Props) {
  return (
    <ul className="md:hidden space-y-3 stagger-rows">
      {appointments.length === 0 && (
        <li className="text-center opacity-60 py-6">Sin citas</li>
      )}
      {appointments.map((appointment) => {
        const stateInfo = STATE_LABELS[appointment.state];
        const customer = appointment.booking?.customer;
        return (
          <li key={appointment.id}>
            <div
              className="card bg-base-100 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.99] hover:shadow-md"
              onClick={() => onViewDetails?.(appointment)}
            >
              <div className="flex justify-between items-center px-4 pt-4">
                <input
                  type="checkbox"
                  className="checkbox self-start"
                  checked={selectedIds.includes(appointment.id)}
                  onChange={(e) => isChecked(appointment.id, e)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Seleccionar cita ${appointment.id}`}
                />
                <span className={`badge ${stateInfo.klass}`}>
                  {stateInfo.label}
                </span>
              </div>
              <div className="card-body py-3">
                <h2 className="card-title text-base">
                  {appointmentServicesLabel(appointment)}
                </h2>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="opacity-60">Total:</span>{" "}
                    {formatPrice(appointmentTotal(appointment))}
                    <span className="opacity-60">
                      {" "}· {appointmentDurationMin(appointment)} min
                    </span>
                  </div>
                  <div>
                    <span className="opacity-60">Cuándo:</span>{" "}
                    {formatDateTime(appointment.scheduledAt)}
                  </div>
                  <div>
                    <span className="opacity-60">Con:</span>{" "}
                    {appointment.employee?.fullName ?? "—"}
                  </div>
                  <div>
                    <span className="opacity-60">Cliente:</span>{" "}
                    {customer?.fullName ?? "—"}
                  </div>
                  {customer && (
                    <div className="text-xs opacity-60">
                      {customer.phone}
                      {customer.email ? ` · ${customer.email}` : ""}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
