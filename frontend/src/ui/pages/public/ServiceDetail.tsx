import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DayPicker } from "react-day-picker";
import {
  ApiError,
  appointmentsApi,
  employeesApi,
  resourcesApi,
  servicesApi,
} from "@/core/api";
import type { AvailabilitySlot, Employee, Service } from "@/core/types";
import Navbar from "@/ui/layouts/components/NavBar";
import { BaseIcon } from "@/ui/components/base/BaseIcon";
import placeholder from "@/assets/placeholder-image.webp";
import { formatPrice, initials } from "@/lib/format";

const toYmd = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

type Step = 1 | 2 | 3 | 4;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollToSection = (el: HTMLElement | null) => {
  el?.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
};

export function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const scheduleRef = useRef<HTMLElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Paso 1 → 2: al elegir profesional, llevar la vista a la agenda
  useEffect(() => {
    if (!employee) return;
    const id = setTimeout(() => scrollToSection(scheduleRef.current), 50);
    return () => clearTimeout(id);
  }, [employee]);

  // Paso 2 → 3: en pantallas angostas el listado de horas queda debajo del
  // calendario, así que al cargar los horarios se acerca la vista a ellos
  useEffect(() => {
    if (loadingSlots || slots.length === 0) return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const id = setTimeout(() => scrollToSection(slotsRef.current), 50);
    return () => clearTimeout(id);
  }, [loadingSlots, slots]);

  // Paso 3 → 4: al elegir hora, desplazar al formulario y destacar el primer
  // input con focus + destello para indicar dónde continuar
  useEffect(() => {
    if (!selectedSlot) return;
    const id = setTimeout(() => {
      scrollToSection(formRef.current);
      const input = nameInputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      input.classList.remove("animate-guide-flash");
      // reinicia la animación si el usuario cambia de hora
      void input.offsetWidth;
      input.classList.add("animate-guide-flash");
    }, 50);
    return () => clearTimeout(id);
  }, [selectedSlot]);

  useEffect(() => {
    if (!id) return;
    servicesApi
      .byId(id)
      .then(setService)
      .catch(() => setError("Servicio no encontrado"));
    employeesApi
      .list({ serviceId: id })
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, [id]);

  const dateYmd = useMemo(() => (date ? toYmd(date) : null), [date]);

  useEffect(() => {
    if (!service || !employee || !dateYmd) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    appointmentsApi
      .availability({
        serviceId: service.id,
        employeeId: employee.id,
        date: dateYmd,
      })
      .then((res) => setSlots(res.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [service, employee, dateYmd]);

  const customerComplete =
    customer.fullName.trim().length >= 2 &&
    customer.phone.trim().length >= 7 &&
    customer.identification.trim().length >= 5;

  const currentStep: Step = !employee
    ? 1
    : !date
      ? 2
      : !selectedSlot
        ? 3
        : 4;

  const handleConfirm = async () => {
    if (!service || !employee || !selectedSlot) return;
    if (!customerComplete) {
      setError("Por favor completa todos los datos");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await appointmentsApi.book({
        serviceId: service.id,
        employeeId: employee.id,
        scheduledAt: selectedSlot.start,
        customer,
      });
      setSuccess(
        `¡Cita confirmada para ${customer.fullName} el ${date?.toLocaleDateString(
          "es-CO",
        )} a las ${formatTime(selectedSlot.start)}!`,
      );
      setTimeout(() => navigate("/booking"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al reservar");
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !service) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-8 text-center">
          <p className="text-base-content/70">{error}</p>
          <Link to="/booking" className="btn btn-primary mt-4">
            Volver a servicios
          </Link>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const imageUrl = resourcesApi.imageUrl(service.urlImage) ?? placeholder;
  const discount = Number(service.discount);
  const finalPrice = Math.max(0, Number(service.price) - discount);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      {/* Header con servicio */}
      <section className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Link
            to="/booking"
            className="btn btn-ghost btn-sm gap-1 -ml-3 mb-3"
          >
            <BaseIcon icon="leftArrow" size={16} viewBox="0 0 24 24" />
            Volver
          </Link>

          <div className="flex flex-col sm:flex-row gap-5">
            <img
              src={imageUrl}
              alt={service.name}
              className="w-full sm:w-40 h-40 rounded-box object-cover"
              onError={(e) =>
                ((e.target as HTMLImageElement).src = placeholder)
              }
            />
            <div className="flex-1 flex flex-col justify-center gap-2">
              <h1 className="text-3xl font-bold">{service.name}</h1>
              {service.description && (
                <p className="text-base-content/70 text-sm">
                  {service.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="badge badge-ghost">
                  {service.duration} min
                </span>
                {discount > 0 && (
                  <span className="text-xs line-through text-base-content/50">
                    {formatPrice(service.price)}
                  </span>
                )}
                <span className="text-xl font-bold text-primary">
                  {formatPrice(finalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <div className="container mx-auto px-4 max-w-4xl">
        <ul className="steps steps-horizontal w-full my-6 text-xs sm:text-sm">
          <li
            className={`step ${currentStep >= 1 ? "step-primary" : ""} ${currentStep > 1 ? "step-pop" : ""}`}
            data-content={currentStep > 1 ? "✓" : "1"}
          >
            Profesional
          </li>
          <li
            className={`step ${currentStep >= 2 ? "step-primary" : ""} ${currentStep > 2 ? "step-pop" : ""}`}
            data-content={currentStep > 2 ? "✓" : "2"}
          >
            Día
          </li>
          <li
            className={`step ${currentStep >= 3 ? "step-primary" : ""} ${currentStep > 3 ? "step-pop" : ""}`}
            data-content={currentStep > 3 ? "✓" : "3"}
          >
            Hora
          </li>
          <li
            className={`step ${currentStep >= 4 ? "step-primary" : ""} ${currentStep > 4 ? "step-pop" : ""}`}
            data-content={currentStep > 4 ? "✓" : "4"}
          >
            Confirmar
          </li>
        </ul>
      </div>

      <div className="container mx-auto px-4 pb-10 max-w-4xl space-y-4">
        {/* 1. Profesional */}
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="badge badge-primary">1</span>
              Elige tu profesional
            </h2>
            {employees.length === 0 ? (
              <div className="alert alert-warning text-sm my-2">
                <span>No hay profesionales disponibles para este servicio.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                {employees.map((emp, i) => {
                  const selected = employee?.id === emp.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setEmployee(emp)}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className={`animate-card-in relative flex flex-col items-center gap-2 p-3 rounded-box border-2 transition-all duration-200 active:scale-[0.97] ${
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-base-300 hover:border-primary/50 hover:bg-base-200 hover:-translate-y-0.5"
                      }`}
                    >
                      {selected && (
                        <span className="absolute -top-2 -right-2 badge badge-primary badge-sm">
                          <BaseIcon icon="check" size={12} viewBox="0 0 24 24" />
                        </span>
                      )}
                      {emp.urlImage ? (
                        <div className="avatar">
                          <div className="w-14 rounded-full">
                            <img
                              src={resourcesApi.imageUrl(emp.urlImage) ?? undefined}
                              alt={emp.fullName}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="avatar avatar-placeholder">
                          <div className="bg-neutral text-neutral-content w-14 rounded-full">
                            <span className="text-base font-bold">
                              {initials(emp.fullName)}
                            </span>
                          </div>
                        </div>
                      )}
                      <span className="text-sm font-medium leading-tight text-center">
                        {emp.fullName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 2. Día + 3. Hora — combinados cuando hay empleado */}
        {employee && (
          <section
            ref={scheduleRef}
            className="card bg-base-100 shadow animate-section-in scroll-mt-4"
          >
            <div className="card-body">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <span className="badge badge-primary">2</span>
                Elige el día y la hora
              </h2>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <DayPicker
                    className="react-day-picker"
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={{ before: new Date() }}
                  />
                </div>

                <div ref={slotsRef} className="scroll-mt-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="badge badge-primary badge-sm">3</span>
                    Horarios disponibles
                    {date && (
                      <span className="text-xs font-normal opacity-60">
                        — {date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" })}
                      </span>
                    )}
                  </h3>

                  {loadingSlots ? (
                    <div className="grid grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-8 rounded-md bg-base-300 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : !date ? (
                    <p className="text-sm opacity-60 py-4">
                      Primero selecciona un día
                    </p>
                  ) : slots.length === 0 ? (
                    <div className="alert alert-warning text-sm">
                      <span>No hay horarios disponibles en esta fecha.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-4 gap-2 max-h-[320px] overflow-y-auto pr-1">
                      {slots.map((slot, i) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            animationDelay:
                              selectedSlot?.start === slot.start
                                ? "0ms"
                                : `${Math.min(i * 25, 300)}ms`,
                          }}
                          className={`btn btn-sm transition-all duration-150 active:scale-95 ${
                            selectedSlot?.start === slot.start
                              ? "btn-primary shadow-md animate-ring-pulse"
                              : "animate-row-in btn-outline hover:-translate-y-0.5"
                          }`}
                        >
                          {formatTime(slot.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Datos + Confirmación */}
        {selectedSlot && (
          <section
            ref={formRef}
            className="card bg-base-100 shadow animate-section-in scroll-mt-4"
          >
            <div className="card-body">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <span className="badge badge-primary">4</span>
                Tus datos
              </h2>

              <div className="grid sm:grid-cols-2 gap-3">
                <fieldset className="sm:col-span-2">
                  <legend className="text-sm font-medium mb-1">
                    Nombre completo
                  </legend>
                  <input
                    ref={nameInputRef}
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
                  <legend className="text-sm font-medium mb-1">
                    Teléfono
                  </legend>
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
                  <legend className="text-sm font-medium mb-1">
                    Cédula o identificación
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
              </div>

              <p className="text-xs opacity-60 mt-1">
                Si ya has reservado antes con esta cédula, vincularemos tu
                historial automáticamente.
              </p>

              {/* Resumen + acción */}
              <div className="divider mt-4" />

              <h3 className="font-semibold mb-2">Resumen de tu reserva</h3>
              <dl className="text-sm grid grid-cols-2 gap-y-1.5 gap-x-4">
                <dt className="opacity-60">Servicio</dt>
                <dd className="font-medium">{service.name}</dd>

                <dt className="opacity-60">Profesional</dt>
                <dd className="font-medium">{employee?.fullName}</dd>

                <dt className="opacity-60">Fecha</dt>
                <dd className="font-medium">
                  {date?.toLocaleDateString("es-CO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </dd>

                <dt className="opacity-60">Hora</dt>
                <dd className="font-medium">{formatTime(selectedSlot.start)}</dd>

                <dt className="font-semibold">Total</dt>
                <dd className="font-bold text-primary text-base">
                  {formatPrice(finalPrice)}
                </dd>
              </dl>

              {error && (
                <div className="alert alert-error text-sm mt-3">{error}</div>
              )}
              {success && (
                <div className="alert alert-success text-sm mt-3 animate-pop-in relative">
                  <svg
                    className="w-8 h-8 shrink-0"
                    viewBox="0 0 52 52"
                    aria-hidden="true"
                  >
                    <circle
                      className="animate-check-circle"
                      cx="26"
                      cy="26"
                      r="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="animate-check-draw"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 27l8 8 15-16"
                    />
                  </svg>
                  <span>{success}</span>
                  <div className="confetti-burst" aria-hidden="true">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i} />
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg w-full mt-4"
                onClick={handleConfirm}
                disabled={submitting || !customerComplete}
              >
                {submitting && <span className="loading loading-spinner" />}
                {submitting ? "Reservando..." : "Confirmar reserva"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
