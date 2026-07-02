import type { Appointment } from "@/core/types";

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

interface Props {
  appointment: Appointment;
  checked: boolean;
  isChecked: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (appointment: Appointment) => void;
}

export function TableRow({
  appointment,
  checked,
  isChecked,
  onViewDetails,
}: Readonly<Props>) {
  const stateInfo = STATE_LABELS[appointment.state];
  const customer = appointment.booking?.customer;

  return (
    <tr
      className="cursor-pointer hover:bg-base-200"
      onClick={() => onViewDetails(appointment)}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="checkbox"
          checked={checked}
          onChange={(e) => isChecked(appointment.id, e)}
          aria-label={`Seleccionar cita ${appointment.id}`}
        />
      </td>
      <td>{formatDateTime(appointment.scheduledAt)}</td>
      <td>{appointment.service?.name ?? "—"}</td>
      <td>{appointment.employee?.fullName ?? "—"}</td>
      <td>
        <div>{customer?.fullName ?? "—"}</div>
        <div className="text-xs opacity-60">
          {customer?.email ?? "—"}
        </div>
      </td>
      <td>{customer?.phone ?? "—"}</td>
      <td>
        <span className={`badge ${stateInfo.klass}`}>{stateInfo.label}</span>
      </td>
    </tr>
  );
}
