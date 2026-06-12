import { api } from "./client";
import type { Appointment, EmployeeService, ScheduleBlock } from "../types";
import type { CreateSaleInput, Sale } from "./sales.api";

export interface EmployeeProfile {
  id: string;
  fullName: string;
  phone: string;
  state: boolean;
  salary: string;
  services: EmployeeService[];
}

export interface CreateAccountInput {
  username: string;
  password: string;
  phone: string;
}

export interface CreateBlockInput {
  date?: string | null;
  dayOfWeek?: number | null;
  startTime: string;
  endTime: string;
  isFullDay?: boolean;
  reason?: string | null;
}

export const employeePortalApi = {
  me: () => api.get<EmployeeProfile>("/employee/me"),
  myAppointments: () => api.get<Appointment[]>("/employee/me/appointments"),

  updateAppointmentStatus: (
    id: string,
    state: "SCHEDULED" | "FINISHED" | "CANCELLED",
  ) =>
    api.patch<{ message: string; data: Appointment }>(
      `/employee/me/appointments/${id}/status`,
      { state },
    ),

  // Self-service product sales (POS). Seller is forced to the logged-in employee.
  mySales: () => api.get<Sale[]>("/employee/me/sales"),
  createSale: (data: Omit<CreateSaleInput, "employeeId">) =>
    api.post<{ message: string; data: Sale }>("/employee/me/sales", data),

  // Self-service time off
  listBlocks: () => api.get<ScheduleBlock[]>("/employee/me/blocks"),
  createBlock: (data: CreateBlockInput) =>
    api.post<{ message: string; data: ScheduleBlock }>(
      "/employee/me/blocks",
      data,
    ),
  deleteBlock: (blockId: string) =>
    api.delete<{ message: string }>(`/employee/me/blocks/${blockId}`),

  createAccount: (employeeId: string, data: CreateAccountInput) =>
    api.post<{ message: string; userId: string }>(
      `/employees/${employeeId}/create-account`,
      data,
    ),

  removeAccount: (employeeId: string) =>
    api.delete<{ message: string }>(`/employees/${employeeId}/remove-account`),
};
