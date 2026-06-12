export const formatCurrency = (v: string | number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(typeof v === "string" ? Number(v) : v);

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const sellerLabel = (employee?: { fullName: string } | null) =>
  employee?.fullName ?? "Administrador (sin comisión)";
