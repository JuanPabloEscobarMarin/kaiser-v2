import { api } from "./client";
import type { Employee } from "../types";

export interface ServiceAssignment {
  serviceId: string;
  commission: number;
}

export interface EmployeeInput {
  fullName: string;
  phone: string;
  state?: boolean;
  salary?: string;
  services?: ServiceAssignment[];
}

export const employeesApi = {
  list: (params?: { serviceId?: string }) => {
    const qs = params?.serviceId ? `?serviceId=${params.serviceId}` : "";
    return api.get<Employee[]>(`/employees${qs}`);
  },
  byId: (id: string) => api.get<Employee>(`/employees/${id}`),
  create: (data: EmployeeInput) =>
    api.post<{ message: string; data: Employee }>("/employees", data),
  update: (id: string, data: Partial<EmployeeInput>) =>
    api.put<{ message: string; data: Employee }>(`/employees/${id}`, data),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/employees/${id}`),
};
