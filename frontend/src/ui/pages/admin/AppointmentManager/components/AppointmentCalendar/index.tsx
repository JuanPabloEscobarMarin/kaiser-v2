import { useState } from "react";
import type { Appointment, Employee } from "@/core/types";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import {
  addUtcDays,
  addUtcMonths,
  startOfUtcDay,
  startOfUtcWeek,
} from "./utils";

type CalendarView = "day" | "week" | "month";

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
};

interface Props {
  appointments: Appointment[];
  employees: Employee[];
  onAppointmentClick: (a: Appointment) => void;
  /**
   * When set, the calendar is pinned to this employee and the employee
   * selector is hidden. Used by the employee portal so a barber only ever sees
   * their own schedule.
   */
  lockedEmployeeId?: string;
}

export function AppointmentCalendar({
  appointments,
  employees,
  onAppointmentClick,
  lockedEmployeeId,
}: Props) {
  const [view, setView] = useState<CalendarView>("day");
  const [date, setDate] = useState<Date>(() =>
    startOfUtcDay(new Date(new Date().toISOString())),
  );
  const [employeeFilter, setEmployeeFilter] = useState<string | "ALL">(
    lockedEmployeeId ?? "ALL",
  );

  const goPrev = () => {
    if (view === "day") setDate(addUtcDays(date, -1));
    else if (view === "week") setDate(addUtcDays(date, -7));
    else setDate(addUtcMonths(date, -1));
  };

  const goNext = () => {
    if (view === "day") setDate(addUtcDays(date, 1));
    else if (view === "week") setDate(addUtcDays(date, 7));
    else setDate(addUtcMonths(date, 1));
  };

  const goToday = () =>
    setDate(startOfUtcDay(new Date(new Date().toISOString())));

  const handleDayClick = (d: Date) => {
    setDate(startOfUtcDay(d));
    setView("day");
  };

  const formatHeader = () => {
    if (view === "day") {
      return date.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    }
    if (view === "week") {
      const start = startOfUtcWeek(date);
      const end = addUtcDays(start, 6);
      const startStr = start.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
      const endStr = end.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
      return `${startStr} — ${endStr}`;
    }
    return date.toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="join">
            <button className="join-item btn btn-sm" onClick={goPrev}>
              ‹
            </button>
            <button className="join-item btn btn-sm" onClick={goToday}>
              Hoy
            </button>
            <button className="join-item btn btn-sm" onClick={goNext}>
              ›
            </button>
          </div>
          <span className="font-semibold capitalize">{formatHeader()}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!lockedEmployeeId && (
            <select
              className="select select-bordered select-sm"
              value={employeeFilter}
              onChange={(e) =>
                setEmployeeFilter(e.target.value as string | "ALL")
              }
            >
              <option value="ALL">Todos los empleados</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          )}

          <div role="tablist" className="tabs tabs-boxed tabs-sm">
            {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
              <button
                key={v}
                role="tab"
                className={`tab ${view === v ? "tab-active" : ""}`}
                onClick={() => setView(v)}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "day" && (
        <DayView
          date={date}
          appointments={appointments}
          employees={employees}
          selectedEmployeeId={employeeFilter}
          onAppointmentClick={onAppointmentClick}
        />
      )}
      {view === "week" && (
        <WeekView
          date={date}
          appointments={appointments}
          selectedEmployeeId={employeeFilter}
          onAppointmentClick={onAppointmentClick}
          onDayClick={handleDayClick}
        />
      )}
      {view === "month" && (
        <MonthView
          date={date}
          appointments={appointments}
          selectedEmployeeId={employeeFilter}
          onAppointmentClick={onAppointmentClick}
          onDayClick={handleDayClick}
        />
      )}
    </div>
  );
}
