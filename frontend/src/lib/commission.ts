/**
 * Comisión de servicios — espejo EXACTO de backend/src/lib/commission.ts.
 * Mantener ambos idénticos: el fallback de citas pre-snapshot debe dar la
 * misma cifra en reportes (frontend) y cierre diario (backend).
 */
import type { Appointment } from "@/core/types";
import { appointmentServices } from "@/lib/appointment";

export const money = (n: number) => Math.round(n * 100) / 100;

export interface CommissionSvc {
  id: string;
  price: unknown;
  discount?: unknown;
}

/**
 * Regla de negocio: comisión sobre lo REALMENTE cobrado.
 *   base_i  = max(0, price_i − discount_i)
 *   charged = finalPrice ?? Σ base_i
 *   share_i = charged repartido proporcionalmente a base_i
 *             (si todas las bases son 0, en partes iguales)
 *   total   = Σ share_i × rate_i / 100, redondeado una sola vez al final
 */
export function computeServiceCommission(
  services: CommissionSvc[],
  finalPrice: unknown | null,
  rates: Map<string, number>,
): number {
  if (services.length === 0) return 0;
  const bases = services.map((s) =>
    Math.max(0, Number(s.price) - Number(s.discount ?? 0)),
  );
  const baseSum = bases.reduce((a, b) => a + b, 0);
  const charged =
    finalPrice != null && finalPrice !== "" ? Number(finalPrice) : baseSum;
  const total = services.reduce((sum, s, i) => {
    const share =
      baseSum > 0 ? (charged * bases[i]!) / baseSum : charged / services.length;
    return sum + (share * (rates.get(s.id) ?? 0)) / 100;
  }, 0);
  return money(total);
}

/**
 * Comisión de una cita: snapshot congelado si existe (citas finalizadas tras
 * el cambio); si no, fallback con las tasas actuales del empleado.
 */
export function appointmentCommission(
  a: Appointment,
  rates?: Map<string, number>,
): number {
  if (a.commissionAmount != null && a.commissionAmount !== "") {
    return Number(a.commissionAmount);
  }
  return computeServiceCommission(
    appointmentServices(a),
    a.finalPrice ?? null,
    rates ?? new Map(),
  );
}
