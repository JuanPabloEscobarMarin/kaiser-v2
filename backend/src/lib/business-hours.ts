/**
 * Pure helpers for reasoning about opening hours and employee schedule blocks.
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
