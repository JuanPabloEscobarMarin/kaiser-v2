import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import {
  ApiError,
  appointmentsApi,
  employeesApi,
  servicesApi,
  servicePackagesApi,
} from "@/core/api";
import type {
  AvailabilitySlot,
  Employee,
  Service,
  ServicePackage,
} from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reload: () => void;
}

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

interface CustomerForm {
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
}

const emptyCustomer: CustomerForm = {
  fullName: "",
  phone: "",
  email: "",
  birthDate: "",
};

export function CreateAppointmentDrawer({ isOpen, onClose, reload }: Props) {
  const notify = useNotify();
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [packageId, setPackageId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setServiceIds([]);
    setPackageId("");
    setEmployeeId("");
    setDate(new Date());
    setSlots([]);
    setSelectedSlot(null);
    setCustomer(emptyCustomer);
    setNotes("");
    Promise.all([
      servicesApi.list(),
      employeesApi.list(),
      servicePackagesApi.list(),
    ]).then(([s, e, p]) => {
      setServices(s);
      setEmployees(e.filter((x) => x.state));
      setPackages(p);
    });
  }, [isOpen]);

  const dateYmd = useMemo(() => (date ? toYmd(date) : null), [date]);

  // Una cita puede ser un combo (packageId) o uno/varios servicios sueltos.
  const hasSelection = Boolean(packageId) || serviceIds.length > 0;

  useEffect(() => {
    if (!hasSelection || !employeeId || !dateYmd) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    appointmentsApi
      .availability({
        employeeId,
        date: dateYmd,
        ...(packageId
          ? { packageId }
          : { serviceIds: serviceIds.join(",") }),
      })
      .then((res) => setSlots(res.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [packageId, serviceIds, employeeId, dateYmd, hasSelection]);

  const toggleService = (id: string) =>
    setServiceIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  const customerComplete =
    customer.fullName.trim().length >= 2 &&
    customer.phone.trim().length >= 7;

  const canSubmit =
    hasSelection && employeeId && selectedSlot && customerComplete && !submitting;

  // Aviso (no bloqueante: el admin puede agendar igual) cuando el profesional
  // no tiene asignados todos los servicios elegidos — su comisión sería $0.
  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const requiredServiceIds = packageId
    ? (packages.find((p) => p.id === packageId)?.items.map((i) => i.serviceId) ??
      [])
    : serviceIds;
  const missingServiceNames = selectedEmployee
    ? requiredServiceIds
        .filter(
          (sid) => !selectedEmployee.services?.some((s) => s.id === sid),
        )
        .map((sid) => services.find((s) => s.id === sid)?.name ?? "servicio")
    : [];

  const handleSubmit = async () => {
    if (!canSubmit || !selectedSlot) return;
    setSubmitting(true);
    try {
      await appointmentsApi.adminBook({
        ...(packageId ? { packageId } : { serviceIds }),
        employeeId,
        scheduledAt: selectedSlot.start,
        customer,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      notify.setMessage({ label: "Cita creada exitosamente", type: "success" });
      notify.notify();
      reload();
      onClose();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error al crear cita",
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
        id="appointment-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        readOnly
      />

      <div className="drawer-side z-50">
        <label
          htmlFor="appointment-drawer"
          className="drawer-overlay"
          onClick={onClose}
        />
        <div className="bg-base-100 min-h-full w-full md:w-150 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <h2 className="text-2xl font-bold">Crear cita</h2>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {packages.length > 0 && (
              <fieldset>
                <legend className="font-semibold mb-1">Combo (opcional)</legend>
                <select
                  className="select select-bordered w-full"
                  value={packageId}
                  onChange={(e) => {
                    setPackageId(e.target.value);
                    if (e.target.value) setServiceIds([]);
                  }}
                >
                  <option value="">— sin combo —</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.price})
                    </option>
                  ))}
                </select>
              </fieldset>
            )}

            {!packageId && (
              <fieldset>
                <legend className="font-semibold mb-1">
                  Servicio(s){" "}
                  <span className="text-xs font-normal opacity-60">
                    (puedes elegir varios)
                  </span>
                </legend>
                <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={serviceIds.includes(s.id)}
                        onChange={() => toggleService(s.id)}
                      />
                      <span className="flex-1">
                        {s.name}
                        {!s.state ? " · inactivo" : ""}
                      </span>
                      <span className="opacity-50 text-xs">
                        {s.duration} min · ${s.price}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset>
              <legend className="font-semibold mb-1">Profesional</legend>
              <select
                className="select select-bordered w-full"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">— elige un profesional —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
              {missingServiceNames.length > 0 && (
                <div className="alert alert-warning text-sm mt-2">
                  <span>
                    ⚠ {selectedEmployee?.fullName} no tiene asignado
                    {missingServiceNames.length > 1 ? "s" : ""}:{" "}
                    <strong>{missingServiceNames.join(", ")}</strong>. Puedes
                    agendar igualmente, pero su comisión por{" "}
                    {missingServiceNames.length > 1
                      ? "esos servicios"
                      : "ese servicio"}{" "}
                    será $0.
                  </span>
                </div>
              )}
            </fieldset>

            {hasSelection && employeeId && (
              <fieldset>
                <legend className="font-semibold mb-1">Día</legend>
                <DayPicker
                  className="react-day-picker"
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={{ before: new Date() }}
                />
              </fieldset>
            )}

            {hasSelection && employeeId && date && (
              <fieldset>
                <legend className="font-semibold mb-1">Hora</legend>
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
              </fieldset>
            )}

            {selectedSlot && (
              <>
                <div className="divider">Datos del cliente</div>

                <fieldset>
                  <legend className="font-medium text-sm mb-1">
                    Nombre completo
                  </legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Ej: Juan Pérez"
                    value={customer.fullName}
                    onChange={(e) =>
                      setCustomer({ ...customer, fullName: e.target.value })
                    }
                  />
                </fieldset>

                <fieldset>
                  <legend className="font-medium text-sm mb-1">Teléfono</legend>
                  <input
                    type="tel"
                    className="input input-bordered w-full"
                    placeholder="Ej: 3001234567"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer({ ...customer, phone: e.target.value })
                    }
                  />
                </fieldset>

                <fieldset>
                  <legend className="font-medium text-sm mb-1">
                    Correo (opcional)
                  </legend>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    placeholder="Ej: juan@correo.com"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer({ ...customer, email: e.target.value })
                    }
                  />
                </fieldset>

                <fieldset>
                  <legend className="font-medium text-sm mb-1">
                    Fecha de nacimiento (opcional)
                  </legend>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={customer.birthDate}
                    onChange={(e) =>
                      setCustomer({ ...customer, birthDate: e.target.value })
                    }
                  />
                </fieldset>

                <fieldset>
                  <legend className="font-medium text-sm mb-1">
                    Observación (interna)
                  </legend>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    placeholder="Notas para el equipo (opcional)"
                    rows={2}
                    maxLength={500}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </fieldset>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-base-200 mt-4">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting && <span className="loading loading-spinner" />}
                Crear cita
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
