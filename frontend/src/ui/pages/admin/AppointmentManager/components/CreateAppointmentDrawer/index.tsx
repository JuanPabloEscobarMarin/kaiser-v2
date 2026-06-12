import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import {
  ApiError,
  appointmentsApi,
  employeesApi,
  servicesApi,
} from "@/core/api";
import type {
  AvailabilitySlot,
  Employee,
  Service,
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
  identification: string;
}

const emptyCustomer: CustomerForm = {
  fullName: "",
  phone: "",
  identification: "",
};

export function CreateAppointmentDrawer({ isOpen, onClose, reload }: Props) {
  const notify = useNotify();
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setServiceId("");
    setEmployeeId("");
    setDate(new Date());
    setSlots([]);
    setSelectedSlot(null);
    setCustomer(emptyCustomer);
    Promise.all([servicesApi.list(), employeesApi.list()]).then(
      ([s, e]) => {
        setServices(s);
        setEmployees(e.filter((x) => x.state));
      },
    );
  }, [isOpen]);

  const dateYmd = useMemo(() => (date ? toYmd(date) : null), [date]);

  useEffect(() => {
    if (!serviceId || !employeeId || !dateYmd) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    appointmentsApi
      .availability({ serviceId, employeeId, date: dateYmd })
      .then((res) => setSlots(res.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, employeeId, dateYmd]);

  const customerComplete =
    customer.fullName.trim().length >= 2 &&
    customer.phone.trim().length >= 7 &&
    customer.identification.trim().length >= 5;

  const canSubmit =
    serviceId && employeeId && selectedSlot && customerComplete && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedSlot) return;
    setSubmitting(true);
    try {
      await appointmentsApi.adminBook({
        serviceId,
        employeeId,
        scheduledAt: selectedSlot.start,
        customer,
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
            <fieldset>
              <legend className="font-semibold mb-1">Servicio</legend>
              <select
                className="select select-bordered w-full"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                <option value="">— elige un servicio —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration} min — ${s.price}){!s.state ? " · inactivo" : ""}
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
              >
                <option value="">— elige un profesional —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </fieldset>

            {serviceId && employeeId && (
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

            {serviceId && employeeId && date && (
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
                    Cédula / identificación
                  </legend>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Ej: 1234567890"
                    value={customer.identification}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        identification: e.target.value,
                      })
                    }
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
