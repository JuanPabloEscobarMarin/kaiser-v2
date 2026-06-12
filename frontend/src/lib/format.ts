/**
 * Formateadores compartidos. Única fuente para moneda e iniciales:
 * antes había ~5 copias de formatPrice y ~4 de initials por la app.
 */

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number | string): string =>
  copFormatter.format(typeof value === "string" ? Number(value) : value);

/** Alias usado por las vistas de ventas. */
export const formatCurrency = formatPrice;

export const initials = (fullName: string): string =>
  fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
