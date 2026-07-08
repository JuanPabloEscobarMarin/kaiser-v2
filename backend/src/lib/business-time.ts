/**
 * Helpers para el "día de negocio" (Colombia, UTC-5 fijo, sin DST).
 *
 * ⚠️ Convención horaria del sistema (ver cabecera de business-hours.ts):
 * Appointment.scheduledAt/endsAt son hora de pared guardada como UTC literal
 * ("fake-UTC") — para esos campos el corte `${ymd}Z` YA es el día Bogotá y NO
 * hay que desplazar nada. Estos helpers son solo para instantes REALES
 * (Sale.createdAt, EmployeeDeduction.createdAt, "hoy" del reloj del servidor),
 * que sí están corridos 5 horas respecto al día del negocio.
 */
import { env } from "../config/env.ts";
import { wallClockNow } from "./business-hours.ts";

/** Offset fijo de Colombia. Cambiarlo aquí si el negocio migra de zona. */
export const BUSINESS_UTC_OFFSET = "-05:00";

/** Primer instante REAL (UTC) del día de negocio `ymd` (YYYY-MM-DD). */
export const businessDayStart = (ymd: string): Date =>
  new Date(`${ymd}T00:00:00.000${BUSINESS_UTC_OFFSET}`);

/** Último instante REAL (UTC) del día de negocio `ymd`. */
export const businessDayEnd = (ymd: string): Date =>
  new Date(`${ymd}T23:59:59.999${BUSINESS_UTC_OFFSET}`);

/** "YYYY-MM-DD" de HOY en hora del negocio (no la del servidor/UTC). */
export const businessTodayYmd = (): string =>
  wallClockNow(env.BUSINESS_TIMEZONE).toISOString().slice(0, 10);
