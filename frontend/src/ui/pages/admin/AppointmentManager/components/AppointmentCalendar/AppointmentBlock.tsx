import type { Appointment } from "@/core/types";
import {
  appointmentServicesLabel,
  appointmentTotal,
} from "@/lib/appointment";
import { formatPrice } from "@/lib/format";
import {
  BUSINESS_OPEN,
  PIXELS_PER_MINUTE,
  STATE_BADGES,
  formatTime,
  minutesFromMidnight,
} from "./utils";

interface Props {
  appointment: Appointment;
  onClick: (a: Appointment) => void;
  /** Optional column index for horizontal positioning when overlapping. */
  laneIndex?: number;
  laneCount?: number;
  showEmployee?: boolean;
}

export function AppointmentBlock({
  appointment,
  onClick,
  laneIndex = 0,
  laneCount = 1,
  showEmployee = false,
}: Props) {
  const startMin = minutesFromMidnight(appointment.scheduledAt);
  const endMin = minutesFromMidnight(appointment.endsAt);
  const duration = Math.max(endMin - startMin, 25);

  const top = (startMin - BUSINESS_OPEN * 60) * PIXELS_PER_MINUTE;
  const height = duration * PIXELS_PER_MINUTE;
  const widthPct = 100 / laneCount;
  const leftPct = widthPct * laneIndex;

  const stateInfo = STATE_BADGES[appointment.state];
  const customer = appointment.booking?.customer;
  const servicesLabel = appointmentServicesLabel(appointment);
  const total = appointmentTotal(appointment);
  const timeRange = `${formatTime(appointment.scheduledAt)}–${formatTime(appointment.endsAt)}`;

  return (
    <button
      type="button"
      onClick={() => onClick(appointment)}
      className={`absolute rounded-md border border-base-300 px-2 py-1 text-left overflow-hidden transition hover:scale-[1.02] hover:z-10 hover:shadow-lg ${stateInfo.klass}`}
      style={{
        top,
        height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
      title={`${timeRange} · ${customer?.fullName ?? "Sin cliente"} · ${servicesLabel} · ${formatPrice(total)}`}
    >
      <div className="text-[11px] font-bold leading-tight">
        {formatTime(appointment.scheduledAt)}
      </div>
      <div className="text-xs font-semibold truncate">
        {customer?.fullName ?? "—"}
      </div>
      <div className="text-[10px] truncate opacity-80">{servicesLabel}</div>
      {showEmployee && (
        <div className="text-[10px] truncate opacity-70">
          {appointment.employee?.fullName}
        </div>
      )}
    </button>
  );
}
