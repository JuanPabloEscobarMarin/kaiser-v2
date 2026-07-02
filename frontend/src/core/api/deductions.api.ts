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

export const deductionsApi = {
  list: (employeeId: string) =>
    api.get<Deduction[]>(`/deductions?employeeId=${employeeId}`),
  create: (data: DeductionInput) =>
    api.post<{ message: string; data: Deduction }>("/deductions", data),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/deductions/${id}`),
};
