import type { Appointment } from "@/core/types";
import { AppointmentBlock } from "./AppointmentBlock";
import { HourGridLines, HourLabels } from "./HourLabels";
import {
  COLUMN_HEIGHT,
  addUtcDays,
  filterAppointmentsByDay,
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

export function WeekView({
  date,
  appointments,
  selectedEmployeeId,
  onAppointmentClick,
  onDayClick,
}: Props) {
  const weekStart = startOfUtcWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addUtcDays(weekStart, i));

  const filteredByEmployee =
    selectedEmployeeId === "ALL"
      ? appointments
      : appointments.filter((a) => a.employeeId === selectedEmployeeId);

  // Helper: lay out overlapping appointments side-by-side within a day column
  const computeLanes = (dayAppts: Appointment[]) => {
    const sorted = [...dayAppts].sort((a, b) =>
      a.scheduledAt.localeCompare(b.scheduledAt),
    );
    const lanes: Appointment[][] = [];
    const lanesByApt = new Map<string, number>();

    for (const apt of sorted) {
      const start = new Date(apt.scheduledAt).getTime();
      const end = new Date(apt.endsAt).getTime();

      let lane = 0;
      while (true) {
        const laneAppts = lanes[lane] ?? [];
        const overlaps = laneAppts.some((other) => {
          const oStart = new Date(other.scheduledAt).getTime();
          const oEnd = new Date(other.endsAt).getTime();
          return start < oEnd && end > oStart;
        });
        if (!overlaps) {
          if (!lanes[lane]) lanes[lane] = [];
          lanes[lane]!.push(apt);
          lanesByApt.set(apt.id, lane);
          break;
        }
        lane++;
      }
    }

    return { lanesByApt, total: lanes.length || 1 };
  };

  return (
    <div className="flex w-full overflow-x-auto bg-base-100 rounded-box border border-base-300">
      <HourLabels />

      <div className="flex flex-1 min-w-0">
        {days.map((day) => {
          const dayAppts = filterAppointmentsByDay(filteredByEmployee, day);
          const { lanesByApt, total } = computeLanes(dayAppts);
          const isToday =
            utcDayKey(day) === utcDayKey(new Date(new Date().toISOString()));

          return (
            <div
              key={utcDayKey(day)}
              className="flex-1 min-w-[120px] border-r border-base-300 last:border-r-0"
            >
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className={`sticky top-0 z-10 w-full bg-base-200 px-2 py-2 text-center border-b border-base-300 hover:bg-base-300 transition ${isToday ? "font-bold text-primary" : ""}`}
              >
                <div className="text-[11px] uppercase tracking-wide opacity-70">
                  {DOW_LABELS[day.getUTCDay() === 0 ? 6 : day.getUTCDay() - 1]}
                </div>
                <div className="text-lg font-semibold">
                  {day.getUTCDate()}
                </div>
              </button>

              <div className="relative" style={{ height: COLUMN_HEIGHT }}>
                <HourGridLines />
                {dayAppts.map((a) => (
                  <AppointmentBlock
                    key={a.id}
                    appointment={a}
                    onClick={onAppointmentClick}
                    laneIndex={lanesByApt.get(a.id) ?? 0}
                    laneCount={total}
                    showEmployee={selectedEmployeeId === "ALL"}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
