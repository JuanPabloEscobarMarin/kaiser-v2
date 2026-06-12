export { formatCurrency } from "@/lib/format";

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
