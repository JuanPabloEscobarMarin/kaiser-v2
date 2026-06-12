import type { Appointment } from "@/core/types";
import {
  STATE_BADGES,
  addUtcDays,
  filterAppointmentsByDay,
  formatTime,
  startOfUtcMonth,
  startOfUtcWeek,
  utcDayKey,
} from "./utils";

interface Props {
  date: Date;
  appointments: Appointment[];
  selectedEmployeeId: string | "ALL";
  onAppointmentClick: (a: Appointment) => void;
  onDayClick: (date: Date) => void;
}

const DOW_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MonthView({
  date,
  appointments,
  selectedEmployeeId,
  onAppointmentClick,
  onDayClick,
}: Props) {
  const monthStart = startOfUtcMonth(date);
  const monthIndex = monthStart.getUTCMonth();
  const gridStart = startOfUtcWeek(monthStart);

  const days = Array.from({ length: 42 }, (_, i) => addUtcDays(gridStart, i));

  const filtered =
    selectedEmployeeId === "ALL"
      ? appointments
      : appointments.filter((a) => a.employeeId === selectedEmployeeId);

  const todayKey = utcDayKey(new Date(new Date().toISOString()));

  return (
    <div className="bg-base-100 rounded-box border border-base-300 overflow-hidden">
      <div className="grid grid-cols-7 bg-base-200 border-b border-base-300">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold py-2 text-base-content/70"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const inMonth = day.getUTCMonth() === monthIndex;
          const dayAppts = filterAppointmentsByDay(filtered, day);
          const key = utcDayKey(day);
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`border-r border-b border-base-300 min-h-[100px] flex flex-col ${
                inMonth ? "bg-base-100" : "bg-base-200/40"
              }`}
            >
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className={`text-left px-2 py-1 text-xs hover:bg-base-200 transition ${
                  isToday
                    ? "font-bold text-primary"
                    : inMonth
                      ? ""
                      : "opacity-40"
                }`}
              >
                {day.getUTCDate()}
              </button>

              <div className="flex-1 px-1 pb-1 space-y-0.5 overflow-hidden">
                {dayAppts.slice(0, 3).map((a) => {
                  const stateInfo = STATE_BADGES[a.state];
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onAppointmentClick(a)}
                      className={`w-full text-left rounded px-1 py-0.5 text-[10px] truncate ${stateInfo.klass}`}
                    >
                      {formatTime(a.scheduledAt)}{" "}
                      {a.booking?.customer?.fullName ?? "—"}
                    </button>
                  );
                })}
                {dayAppts.length > 3 && (
                  <div className="text-[10px] opacity-60 px-1">
                    +{dayAppts.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
