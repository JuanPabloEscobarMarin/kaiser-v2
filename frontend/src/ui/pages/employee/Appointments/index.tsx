import { useCallback, useEffect, useState } from "react";
import { ApiError, employeePortalApi } from "@/core/api";
import type { EmployeeProfile } from "@/core/api/employee-portal.api";
import type { Appointment, Employee } from "@/core/types";
import { AppointmentCalendar } from "@/ui/pages/admin/AppointmentManager/components/AppointmentCalendar";
import {
  appointmentDurationMin,
  appointmentServices,
  appointmentServicesLabel,
  appointmentTotal,
} from "@/lib/appointment";
import { formatPrice } from "@/lib/format";
import { useNotify } from "@/ui/hooks/useNotify";
import { ListSkeleton } from "@/ui/components/Skeletons";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });

type ApptState = "SCHEDULED" | "FINISHED" | "CANCELLED";

const STATE_LABELS: Record<string, { label: string; class: string }> = {
  SCHEDULED: { label: "Agendada", class: "badge-info" },
  FINISHED: { label: "Finalizada", class: "badge-success" },
  CANCELLED: { label: "Cancelada", class: "badge-error" },
};

// Action button shown to transition INTO each state (from a different one).
const STATE_ACTIONS: Record<ApptState, { label: string; btn: string }> = {
  SCHEDULED: { label: "Reabrir / agendar", btn: "btn-info btn-outline" },
  FINISHED: { label: "Marcar finalizada", btn: "btn-success" },
  CANCELLED: { label: "Cancelar cita", btn: "btn-error btn-outline" },
};
const ALL_STATES: ApptState[] = ["SCHEDULED", "FINISHED", "CANCELLED"];

export function EmployeeAppointments() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamAppointments, setTeamAppointments] = useState<Appointment[]>([]);
  const [viewTeam, setViewTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const notify = useNotify();

  const load = useCallback(() => {
    return Promise.all([
      employeePortalApi.me(),
      employeePortalApi.myAppointments(),
    ])
      .then(([p, a]) => {
        setProfile(p);
        setAppointments(a);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Carga perezosa de la agenda de todo el equipo (solo lectura).
  useEffect(() => {
    if (!viewTeam) return;
    employeePortalApi
      .teamAgenda()
      .then(setTeamAppointments)
      .catch(() => setTeamAppointments([]));
  }, [viewTeam]);

  const changeStatus = async (appointment: Appointment, state: ApptState) => {
    setBusy(true);
    try {
      await employeePortalApi.updateAppointmentStatus(appointment.id, state);
      notify.setMessage({
        label: `Cita marcada como "${STATE_LABELS[state]?.label ?? state}"`,
        type: "success",
      });
      notify.notify();
      setSelected(null);
      await load();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error al actualizar",
        type: "error",
      });
      notify.notify();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ListSkeleton rows={5} />
    );
  }

  // The calendar's day view renders one column per employee; we pass just the
  // logged-in employee so it shows only their own schedule.
  const selfAsEmployee: Employee[] = profile
    ? [
        {
          id: profile.id,
          fullName: profile.fullName,
          phone: profile.phone,
          state: profile.state,
        },
      ]
    : [];

  // En modo equipo, los empleados del calendario se derivan de las citas.
  const teamEmployees: Employee[] = Array.from(
    new Map(
      teamAppointments
        .filter((a) => a.employee)
        .map((a) => [a.employee!.id, a.employee!]),
    ).values(),
  );

  const displayed = viewTeam ? teamAppointments : appointments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {viewTeam ? "Agenda del equipo" : "Mi horario"}
          </h1>
          <p className="text-sm opacity-60">
            {displayed.length} cita{displayed.length === 1 ? "" : "s"}
            {viewTeam ? " (solo lectura)" : " en total"}
          </p>
        </div>
        <label className="label cursor-pointer gap-2">
          <span className="text-sm">Ver todo el equipo</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={viewTeam}
            onChange={(e) => {
              setViewTeam(e.target.checked);
              setSelected(null);
            }}
          />
        </label>
      </div>

      {/* Vista de horario (calendario) */}
      {profile && (
        <AppointmentCalendar
          appointments={displayed}
          employees={viewTeam ? teamEmployees : selfAsEmployee}
          {...(viewTeam ? {} : { lockedEmployeeId: profile.id })}
          onAppointmentClick={setSelected}
        />
      )}

      {/* Tabla detallada */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Listado de citas</h2>
        <div className="overflow-x-auto bg-base-100 rounded-box shadow">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Servicio</th>
                <th>Cliente</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody className="stagger-rows">
              {displayed.map((a) => {
                const stateInfo =
                  STATE_LABELS[a.state] ?? { label: a.state, class: "badge-ghost" };
                return (
                  <tr
                    key={a.id}
                    className="cursor-pointer hover:bg-base-200"
                    onClick={() => setSelected(a)}
                  >
                    <td className="whitespace-nowrap">{formatDateTime(a.scheduledAt)}</td>
                    <td>
                      <div>{appointmentServicesLabel(a)}</div>
                      <div className="text-xs opacity-60">
                        {appointmentDurationMin(a)} min ·{" "}
                        {formatPrice(appointmentTotal(a))}
                      </div>
                    </td>
                    <td>{a.booking?.customer?.fullName ?? "—"}</td>
                    <td>
                      <span className={`badge badge-sm ${stateInfo.class}`}>
                        {stateInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center opacity-60 py-6">
                    Sin citas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle de cita (solo lectura) */}
      {selected && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Detalle de la cita</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>
            <dl className="grid grid-cols-3 gap-y-2 text-sm">
              <dt className="opacity-60">
                {appointmentServices(selected).length > 1 ? "Servicios" : "Servicio"}
              </dt>
              <dd className="col-span-2 font-medium">
                {appointmentServicesLabel(selected)}
              </dd>

              <dt className="opacity-60">Total</dt>
              <dd className="col-span-2 font-medium text-primary">
                {formatPrice(appointmentTotal(selected))}
              </dd>

              <dt className="opacity-60">Cliente</dt>
              <dd className="col-span-2 font-medium">
                {selected.booking?.customer?.fullName ?? "—"}
              </dd>

              <dt className="opacity-60">Teléfono</dt>
              <dd className="col-span-2 font-medium">
                {selected.booking?.customer?.phone ?? "—"}
              </dd>

              <dt className="opacity-60">Fecha</dt>
              <dd className="col-span-2 font-medium">
                {formatDateTime(selected.scheduledAt)}
              </dd>

              <dt className="opacity-60">Horario</dt>
              <dd className="col-span-2 font-medium">
                {formatTime(selected.scheduledAt)} – {formatTime(selected.endsAt)}
              </dd>

              <dt className="opacity-60">Estado</dt>
              <dd className="col-span-2">
                <span
                  className={`badge badge-sm ${
                    (STATE_LABELS[selected.state] ?? { class: "badge-ghost" }).class
                  }`}
                >
                  {(STATE_LABELS[selected.state] ?? { label: selected.state }).label}
                </span>
              </dd>
            </dl>
            <div className="mt-4">
              {selected.employeeId === profile?.id ? (
                <>
                  <p className="text-xs opacity-60 mb-2">Cambiar estado:</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STATES.filter((s) => s !== selected.state).map((s) => (
                      <button
                        key={s}
                        className={`btn btn-sm ${STATE_ACTIONS[s].btn}`}
                        disabled={busy}
                        onClick={() => changeStatus(selected, s)}
                      >
                        {busy && (
                          <span className="loading loading-spinner loading-xs" />
                        )}
                        {STATE_ACTIONS[s].label}
                      </button>
                    ))}
                    <button
                      className="btn btn-sm btn-ghost ml-auto"
                      onClick={() => setSelected(null)}
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-60">
                    Cita de otro profesional (solo lectura)
                  </span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setSelected(null)}
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}
