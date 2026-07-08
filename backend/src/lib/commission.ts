/**
 * Cálculo de comisión de servicios sobre lo REALMENTE cobrado.
 *
 * Regla de negocio (única fuente de verdad; el frontend tiene un espejo en
 * frontend/src/lib/commission.ts que debe mantenerse idéntico):
 *   base_i  = max(0, price_i − discount_i)
 *   charged = finalPrice ?? Σ base_i
 *   share_i = charged repartido proporcionalmente a base_i
 *             (si todas las bases son 0, en partes iguales)
 *   total   = Σ share_i × rate_i / 100, redondeado UNA sola vez al final
 *
 * Usada por el snapshot al finalizar la cita, el fallback del cierre diario
 * para citas pre-snapshot y el script de backfill.
 */

export const money = (n: number) => Math.round(n * 100) / 100;

export interface CommissionSvc {
  id: string;
  price: unknown;
  discount?: unknown;
}

export function computeServiceCommission(
  services: CommissionSvc[],
  finalPrice: unknown | null,
  /** serviceId → % de comisión del empleado (ausente = 0). */
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
