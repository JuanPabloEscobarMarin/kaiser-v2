import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import {
  ApiError,
  appointmentsApi,
  employeesApi,
  servicesApi,
} from "@/core/api";
import type {
  Appointment,
  AppointmentState,
  AvailabilitySlot,
  Employee,
  Service,
} from "@/core/types";
import {
  appointmentDurationMin,
  appointmentServices,
  appointmentTotal,
} from "@/lib/appointment";
import { formatPrice } from "@/lib/format";
import { useNotify } from "@/ui/hooks/useNotify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reload: () => void;
  appointment: Appointment | null;
  readOnly?: boolean;
}

const STATE_LABELS: Record<AppointmentState, string> = {
  SCHEDULED: "Agendada",
  FINISHED: "Finalizada",
  CANCELLED: "Cancelada",
};

const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

export function EditAppointmentDrawer({
  isOpen,
  onClose,
  reload,
  appointment,
  readOnly = false,
}: Readonly<Props>) {
  const notify = useNotify();
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [state, setState] = useState<AppointmentState>("SCHEDULED");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset form whenever the drawer opens or the appointment changes
  useEffect(() => {
    if (!isOpen || !appointment) return;
    setServiceId(appointment.serviceId);
    setEmployeeId(appointment.employeeId);
    setDate(new Date(appointment.scheduledAt));
    setState(appointment.state);
    setNotes(appointment.notes ?? "");
    setFinalPrice(appointment.finalPrice ?? "");
    setSelectedSlot({
      start: appointment.scheduledAt,
      end: appointment.endsAt,
    });
    setSlots([]);
    Promise.all([servicesApi.list(), employeesApi.list()]).then(([s, e]) => {
      setServices(s);
      setEmployees(e);
    });
  }, [isOpen, appointment]);

  const dateYmd = useMemo(() => (date ? toYmd(date) : null), [date]);

  // Re-load slots when service / employee / date changes (only in edit mode)
  useEffect(() => {
    if (readOnly || !isOpen || !serviceId || !employeeId || !dateYmd) return;
    setLoadingSlots(true);
    appointmentsApi
      .availability({ serviceId, employeeId, date: dateYmd })
      .then((res) => {
        // Make sure the current slot stays selectable when nothing else changed
        const current = appointment
          ? {
              start: appointment.scheduledAt,
              end: appointment.endsAt,
            }
          : null;
        const sameContext =
          current &&
          appointment?.serviceId === serviceId &&
          appointment?.employeeId === employeeId &&
          appointment?.scheduledAt.startsWith(dateYmd);
        const merged =
          sameContext &&
          !res.slots.some((s) => s.start === current.start)
            ? [...res.slots, current].sort((a, b) =>
                a.start.localeCompare(b.start),
              )
            : res.slots;
        setSlots(merged);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [isOpen, readOnly, serviceId, employeeId, dateYmd, appointment]);

  if (!appointment) return null;

  const customer = appointment.booking?.customer;
  const apptServices = appointmentServices(appointment);
  const isMultiService = apptServices.length > 1 || Boolean(appointment.package);
  const selectedService = services.find((s) => s.id === serviceId);
  const isVariable = selectedService?.variablePrice ?? false;
  const dirtyState = state !== appointment.state;
  const dirtyNotes = notes !== (appointment.notes ?? "");
  const dirtyFinalPrice = finalPrice !== (appointment.finalPrice ?? "");
  const dirtySlot =
    selectedSlot?.start !== appointment.scheduledAt ||
    serviceId !== appointment.serviceId ||
    employeeId !== appointment.employeeId;
  const canSave =
    !readOnly &&
    (dirtyState || dirtySlot || dirtyNotes || dirtyFinalPrice) &&
    !submitting;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      const payload: {
        serviceId?: string;
        employeeId?: string;
        scheduledAt?: string;
        state?: AppointmentState;
        finalPrice?: string | null;
        notes?: string;
      } = {};
      if (dirtyState) payload.state = state;
      if (dirtyNotes) payload.notes = notes.trim();
      if (dirtyFinalPrice) payload.finalPrice = finalPrice.trim() || null;
      if (dirtySlot && selectedSlot) {
        payload.serviceId = serviceId;
        payload.employeeId = employeeId;
        payload.scheduledAt = selectedSlot.start;
      }

      await appointmentsApi.update(appointment.id, payload);
      notify.setMessage({ label: "Cita actualizada", type: "success" });
      notify.notify();
      reload();
      onClose();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error al actualizar",
        type: "error",
      });
      notify.notify();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="drawer drawer-end absolute z-50">
      <input
        id="edit-appointment-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        readOnly
      />

      <div className="drawer-side z-50">
        <label
          htmlFor="edit-appointment-drawer"
          className="drawer-overlay"
          onClick={onClose}
        />
        <div className="bg-base-100 min-h-full w-full md:w-150 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <h2 className="text-2xl font-bold">
              {readOnly ? "Detalles de la cita" : "Editar cita"}
            </h2>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Customer info — read-only always */}
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-semibold text-sm opacity-70">
                  Cliente
                </h3>
                <div className="text-sm space-y-1">
                  <div className="font-bold">
                    {customer?.fullName ?? "—"}
                  </div>
                  <div>
                    <span className="opacity-60">Teléfono:</span>{" "}
                    {customer?.phone ?? "—"}
                  </div>
                  <div>
                    <span className="opacity-60">Correo:</span>{" "}
                    {customer?.email ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen de servicios de la cita (combo / multi-servicio) */}
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-semibold text-sm opacity-70">
                  {appointment.package
                    ? "Combo"
                    : apptServices.length > 1
                      ? "Servicios"
                      : "Servicio"}
                </h3>
                {appointment.package ? (
                  <div className="text-sm font-medium">
                    {appointment.package.name}
                  </div>
                ) : (
                  <ul className="text-sm space-y-0.5">
                    {apptServices.map((s) => (
                      <li key={s.id} className="flex justify-between gap-3">
                        <span>{s.name}</span>
                        <span className="opacity-60">
                          {s.duration} min · {formatPrice(s.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-between text-sm font-semibold border-t border-base-300 mt-1 pt-1">
                  <span>Total · {appointmentDurationMin(appointment)} min</span>
                  <span className="text-primary">
                    {formatPrice(appointmentTotal(appointment))}
                  </span>
                </div>
              </div>
            </div>

            <fieldset>
              <legend className="font-semibold mb-1">
                {readOnly
                  ? "Servicio"
                  : isMultiService
                    ? "Reprogramar / estado"
                    : "Servicio"}
              </legend>
              {!readOnly && isMultiService && (
                <p className="text-xs opacity-60 mb-1">
                  Esta cita tiene varios servicios. Editar aquí sirve para
                  reprogramar o cambiar el estado; el detalle de servicios se
                  conserva.
                </p>
              )}
              <select
                className="select select-bordered w-full"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={readOnly}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration} min — ${s.price})
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset>
              <legend className="font-semibold mb-1">Profesional</legend>
              <select
                className="select select-bordered w-full"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={readOnly}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset>
              <legend className="font-semibold mb-1">Estado</legend>
              <select
                className="select select-bordered w-full"
                value={state}
                onChange={(e) => setState(e.target.value as AppointmentState)}
                disabled={readOnly}
              >
                {(
                  ["SCHEDULED", "FINISHED", "CANCELLED"] as AppointmentState[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {STATE_LABELS[s]}
                  </option>
                ))}
              </select>
            </fieldset>

            {isVariable && (
              <fieldset>
                <legend className="font-semibold mb-1">
                  Precio final cobrado
                </legend>
                {readOnly ? (
                  <p className="text-sm">
                    {appointment.finalPrice
                      ? `$${appointment.finalPrice}`
                      : "Pendiente por definir"}
                  </p>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      className="input input-bordered w-full"
                      placeholder={`Desde $${selectedService?.price ?? "0"}`}
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                    />
                    <small className="text-xs opacity-60">
                      Servicio de precio variable. Deja vacío para usar el
                      precio base.
                    </small>
                  </>
                )}
              </fieldset>
            )}

            <fieldset>
              <legend className="font-semibold mb-1">
                Observación (interna)
              </legend>
              {readOnly ? (
                <p className="text-sm whitespace-pre-wrap">
                  {appointment.notes?.trim() ? (
                    appointment.notes
                  ) : (
                    <span className="opacity-50">Sin observación</span>
                  )}
                </p>
              ) : (
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Notas para el equipo (opcional)"
                  rows={2}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              )}
            </fieldset>

            <fieldset>
              <legend className="font-semibold mb-1">Fecha y hora</legend>
              {readOnly ? (
                <div className="text-sm">
                  {formatDateTime(appointment.scheduledAt)}
                </div>
              ) : (
                <>
                  <DayPicker
                    className="react-day-picker"
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                  />
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Horarios</p>
                    {loadingSlots ? (
                      <span className="loading loading-spinner" />
                    ) : slots.length === 0 ? (
                      <p className="text-sm opacity-60">
                        No hay horarios disponibles
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`btn btn-sm ${
                              selectedSlot?.start === slot.start
                                ? "btn-primary"
                                : "btn-outline"
                            }`}
                          >
                            {formatTime(slot.start)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </fieldset>

            <div className="flex justify-end gap-2 pt-4 border-t border-base-200 mt-4 sticky bottom-0 bg-base-100">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
              >
                {readOnly ? "Cerrar" : "Cancelar"}
              </button>
              {!readOnly && (
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!canSave}
                >
                  {submitting && <span className="loading loading-spinner" />}
                  Guardar cambios
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
