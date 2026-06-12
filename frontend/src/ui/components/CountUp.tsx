import { useCountUp } from "@/ui/hooks/useCountUp";

interface Props {
  value: number;
  /** Formatea el valor en cada frame (moneda, %, duración…). Por defecto entero. */
  format?: (n: number) => string;
  durationMs?: number;
}

/** Número animado de 0 → valor para stats y contadores. */
export function CountUp({ value, format, durationMs }: Props) {
  const current = useCountUp(value, durationMs);
  return <>{format ? format(current) : Math.round(current).toString()}</>;
}
