/**
 * Helpers para el "día de negocio" (Colombia, UTC-5 fijo, sin DST).
 *
 * ⚠️ Convención horaria del sistema (ver backend/src/lib/business-hours.ts):
 * Appointment.scheduledAt/endsAt son hora de pared guardada como UTC literal
 * ("fake-UTC") — NUNCA desplazarlas: ya son el día/hora Bogotá y toda la
 * lógica UTC existente (getUTCHours, slice(0,10), inRange) es correcta.
 * Estos helpers son SOLO para instantes reales (Sale.createdAt,
 * EmployeeDeduction.createdAt) y para anclar "hoy"/"ahora", que sí están
 * corridos 5 horas respecto al día del negocio.
 */

export const BUSINESS_UTC_OFFSET_MS = -5 * 3_600_000;

/** Instante real (ISO) → Date en la convención fake-UTC del negocio. */
export const toBusinessWall = (iso: string): Date =>
  new Date(new Date(iso).getTime() + BUSINESS_UTC_OFFSET_MS);

/** Instante real (ISO) → ISO en hora de pared del negocio. */
export const businessWallIso = (iso: string): string =>
  toBusinessWall(iso).toISOString();

/** "Ahora" en hora de pared del negocio (espejo de wallClockNow del backend). */
export const businessNow = (): Date =>
  new Date(Date.now() + BUSINESS_UTC_OFFSET_MS);

/** "YYYY-MM-DD" de hoy en hora del negocio (no la del navegador/UTC). */
export const businessTodayYmd = (): string =>
  businessNow().toISOString().slice(0, 10);
