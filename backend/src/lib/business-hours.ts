/**
 * Pure helpers for reasoning about opening hours and employee schedule blocks.
 *
 * ⚠️ CONVENCIÓN HORARIA DEL SISTEMA (leer antes de tocar fechas):
 * La "hora de pared" del negocio se almacena como UTC LITERAL. Un corte a las
 * 09:00 se guarda como 09:00Z, no como 14:00Z (Colombia = UTC-5). Por eso:
 *   - El backend compara siempre con getUTCHours()/minutos UTC (este archivo,
 *     appointment.service.ts).
 *   - El frontend formatea siempre con getUTCHours()/timeZone:"UTC"
 *     (formatTime en ServiceDetail, formatDate en portal empleado, etc.).
 *   - NUNCA usar toLocaleTimeString sin timeZone:"UTC" ni new Date() local
 *     para mostrar horas de citas: saldrían corridas 5 horas.
 * Cambiar esta convención exige migrar datos y tocar backend + frontend a la
 * vez; mientras tanto, mantenerla es lo que evita el corrimiento.
 *
 * All times are handled as "minutes since 00:00 UTC" so slot math is plain
 * integer arithmetic. The booking system stores wall-clock times as UTC, so a
 * day's schedule (e.g. 09:00–18:00) is compared against the UTC time-of-day of
 * each candidate slot.
 *
 * These functions are shared by both the availability calculation (which slots
 * to *offer*) and the booking validation (whether a requested slot is *allowed*)
 * so the two can never drift apart.
 */

/** The opening-hours fields stored on the BusinessSettings singleton. */
export interface BusinessHoursConfig {
  openTimeWeekday: string;
  closeTimeWeekday: string;
  closedWeekday: boolean;
  openTimeSaturday: string;
  closeTimeSaturday: string;
  closedSaturday: boolean;
  openTimeSunday: string;
  closeTimeSunday: string;
  closedSunday: boolean;
}

/** Resolved schedule for a single day, expressed in minutes-of-day. */
export interface DaySchedule {
  closed: boolean;
  openMinutes: number;
  closeMinutes: number;
}

/** A schedule block that makes an employee unavailable for part (or all) of a day. */
export interface ScheduleBlock {
  startTime: string;
  endTime: string;
  isFullDay: boolean;
}

/** "HH:MM" → minutes since midnight. Invalid parts default to 0. */
export const timeToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/**
 * "YYYY-MM-DD a las HH:MM" a partir de una hora de pared de cita (fake-UTC,
 * ver cabecera del archivo). Usado en recordatorios y confirmaciones por correo.
 */
export const formatWallClock = (d: Date): string =>
  `${d.toISOString().slice(0, 10)} a las ${d.toISOString().slice(11, 16)}`;

/**
 * "Ahora" en la hora de pared del negocio, codificado en la convención
 * fake-UTC del sistema (ver cabecera). Si en Bogotá son las 17:00, devuelve
 * un Date cuyo getUTCHours() es 17, sin importar la zona horaria del
 * servidor. Es el único reloj válido para comparar contra scheduledAt.
 */
export const wallClockNow = (timeZone: string): Date => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}.000Z`,
  );
};

/**
 * Pick the open/close window that applies to the weekday of `dateYmd`
 * (a "YYYY-MM-DD" string interpreted in UTC).
 */
export const resolveDaySchedule = (
  config: BusinessHoursConfig,
  dateYmd: string,
): DaySchedule => {
  const dow = new Date(`${dateYmd}T00:00:00.000Z`).getUTCDay(); // 0=Sun … 6=Sat

  if (dow === 0) {
    return {
      closed: config.closedSunday,
      openMinutes: timeToMinutes(config.openTimeSunday),
      closeMinutes: timeToMinutes(config.closeTimeSunday),
    };
  }
  if (dow === 6) {
    return {
      closed: config.closedSaturday,
      openMinutes: timeToMinutes(config.openTimeSaturday),
      closeMinutes: timeToMinutes(config.closeTimeSaturday),
    };
  }
  return {
    closed: config.closedWeekday,
    openMinutes: timeToMinutes(config.openTimeWeekday),
    closeMinutes: timeToMinutes(config.closeTimeWeekday),
  };
};

/**
 * Does the half-open interval [startMin, endMin) collide with any block?
 * A full-day block always collides.
 */
export const isBlocked = (
  blocks: ScheduleBlock[],
  startMin: number,
  endMin: number,
): boolean =>
  blocks.some((b) => {
    if (b.isFullDay) return true;
    const blockStart = timeToMinutes(b.startTime);
    const blockEnd = timeToMinutes(b.endTime);
    return startMin < blockEnd && endMin > blockStart;
  });
