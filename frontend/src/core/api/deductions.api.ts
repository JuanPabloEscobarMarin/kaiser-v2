import { api } from "./client";

export type DeductionType = "ADVANCE" | "PRODUCT" | "OTHER";

export interface Deduction {
  id: string;
  employeeId: string;
  type: DeductionType;
  amount: string;
  note: string | null;
  createdAt: string;
}

export interface DeductionInput {
  employeeId: string;
  type: DeductionType;
  amount: string;
  note?: string | null;
}

export interface DeductionFilters {
  employeeId?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

const qs = (filters?: DeductionFilters | string) => {
  // Compatibilidad: acepta el employeeId suelto (firma original).
  if (typeof filters === "string") return `?employeeId=${filters}`;
  if (!filters) return "";
  const p = new URLSearchParams();
  if (filters.employeeId) p.set("employeeId", filters.employeeId);
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const deductionsApi = {
  list: (filters?: DeductionFilters | string) =>
    api.get<Deduction[]>(`/deductions${qs(filters)}`),
  create: (data: DeductionInput) =>
    api.post<{ message: string; data: Deduction }>("/deductions", data),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/deductions/${id}`),
};
