import type { Appointment, Employee } from "@/core/types";
import { AppointmentBlock } from "./AppointmentBlock";
import { HourGridLines, HourLabels } from "./HourLabels";
import {
  COLUMN_HEIGHT,
  filterAppointmentsByDay,
} from "./utils";

interface Props {
  date: Date;
  appointments: Appointment[];
  employees: Employee[];
  selectedEmployeeId: string | "ALL";
  onAppointmentClick: (a: Appointment) => void;
}

/**
 * Resource view: each visible employee gets their own column.
 * If a single employee is selected, only that column is rendered.
 */
export function DayView({
  date,
  appointments,
  employees,
  selectedEmployeeId,
  onAppointmentClick,
}: Props) {
  const dayAppointments = filterAppointmentsByDay(appointments, date);

  const visibleEmployees =
    selectedEmployeeId === "ALL"
      ? employees
      : employees.filter((e) => e.id === selectedEmployeeId);

  return (
    <div className="flex w-full overflow-x-auto bg-base-100 rounded-box border border-base-300">
      <HourLabels />

      <div className="flex flex-1 min-w-0">
        {visibleEmployees.length === 0 ? (
          <div className="p-6 opacity-60 text-sm">No hay empleados</div>
        ) : (
          visibleEmployees.map((emp) => {
            const empAppointments = dayAppointments.filter(
              (a) => a.employeeId === emp.id,
            );

            return (
              <div
                key={emp.id}
                className="flex-1 min-w-[140px] border-r border-base-300 last:border-r-0"
              >
                <div className="sticky top-0 z-10 bg-base-200 px-2 py-2 text-center border-b border-base-300">
                  <div className="text-xs font-semibold truncate">
                    {emp.fullName}
                  </div>
                  <div className="text-[10px] opacity-60">
                    {empAppointments.length} cita
                    {empAppointments.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div
                  className="relative"
                  style={{ height: COLUMN_HEIGHT }}
                >
                  <HourGridLines />
                  {empAppointments.map((a) => (
                    <AppointmentBlock
                      key={a.id}
                      appointment={a}
                      onClick={onAppointmentClick}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
