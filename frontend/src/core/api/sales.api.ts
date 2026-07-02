import { api } from "./client";

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  commissionPct: string;
  lineTotal: string;
  commissionAmount: string;
  product?: { id: string; name: string };
}

export interface Sale {
  id: string;
  customerId: string | null;
  employeeId: string | null;
  total: string;
  commissionTotal: string;
  createdAt: string;
  customer?: { id: string; fullName: string; phone: string } | null;
  employee?: { id: string; fullName: string } | null;
  items: SaleItem[];
}

export interface CreateSaleInput {
  items: { productId: string; quantity: number }[];
  customer?: {
    fullName: string;
    phone: string;
    email?: string | null;
    birthDate?: string | null;
  } | null;
  employeeId?: string | null;
}

export interface SaleFilters {
  from?: string;
  to?: string;
  employeeId?: string;
}

const qs = (filters?: SaleFilters) => {
  if (!filters) return "";
  const p = new URLSearchParams();
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.employeeId) p.set("employeeId", filters.employeeId);
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const salesApi = {
  list: (filters?: SaleFilters) => api.get<Sale[]>(`/sales${qs(filters)}`),
  byId: (id: string) => api.get<Sale>(`/sales/${id}`),
  create: (data: CreateSaleInput) =>
    api.post<{ message: string; data: Sale }>("/sales", data),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/sales/${id}`),
};
