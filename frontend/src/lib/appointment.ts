import type { Appointment } from "@/core/types";

interface ApptService {
  id: string;
  name: string;
  price: string;
  duration: number;
  discount?: string;
}

/**
 * Servicios de una cita. Prioriza la relación multi-servicio (`services`) y cae
 * al servicio principal (`service`) para citas viejas creadas antes del combo /
 * multi-servicio.
 */
export function appointmentServices(a: Appointment): ApptService[] {
  const fromJoin =
    a.services
      ?.map((x) => x.service)
      .filter((s): s is NonNullable<typeof s> => Boolean(s)) ?? [];
  if (fromJoin.length > 0) return fromJoin;
  return a.service ? [a.service] : [];
}

/** Etiqueta a mostrar: nombre del combo o servicios unidos por " + ". */
export function appointmentServicesLabel(a: Appointment): string {
  if (a.package) return a.package.name;
  const svcs = appointmentServices(a);
  return svcs.length ? svcs.map((s) => s.name).join(" + ") : "—";
}

/**
 * Total cobrado por la cita, con la misma prioridad que el cierre diario del
 * backend: precio final (override / precio variable) → precio del combo → suma
 * de los servicios (aplicando descuentos).
 */
export function appointmentTotal(a: Appointment): number {
  if (a.finalPrice != null && a.finalPrice !== "") return Number(a.finalPrice);
  if (a.package) return Number(a.package.price);
  return appointmentServices(a).reduce(
    (sum, s) => sum + Math.max(0, Number(s.price) - Number(s.discount ?? 0)),
    0,
  );
}

/** Duración total de la cita en minutos (de scheduledAt a endsAt). */
export function appointmentDurationMin(a: Appointment): number {
  return Math.round(
    (new Date(a.endsAt).getTime() - new Date(a.scheduledAt).getTime()) / 60_000,
  );
}
