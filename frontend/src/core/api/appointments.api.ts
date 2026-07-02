import { api } from "./client";
import type {
  Appointment,
  AvailabilityResponse,
  CustomerInput,
} from "../types";

export const appointmentsApi = {
  availability: (params: {
    employeeId: string;
    date: string;
    serviceId?: string;
    serviceIds?: string; // uuids separados por coma
    packageId?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][],
    ).toString();
    return api.get<AvailabilityResponse>(`/appointments/availability?${qs}`);
  },

  book: (data: {
    serviceId?: string;
    serviceIds?: string[];
    packageId?: string;
    employeeId: string;
    scheduledAt: string;
    customer: CustomerInput;
  }) =>
    api.post<{ message: string; data: Appointment }>(
      "/appointments/book",
      data,
    ),

  adminBook: (data: {
    serviceId?: string;
    serviceIds?: string[];
    packageId?: string;
    employeeId: string;
    scheduledAt: string;
    customer: CustomerInput;
    notes?: string;
  }) =>
    api.post<{ message: string; data: Appointment }>(
      "/appointments/admin-book",
      data,
    ),

  list: () => api.get<Appointment[]>("/appointments"),

  byId: (id: string) => api.get<Appointment>(`/appointments/${id}`),

  update: (
    id: string,
    data: Partial<{
      serviceId: string;
      employeeId: string;
      scheduledAt: string;
      state: "SCHEDULED" | "CANCELLED" | "FINISHED";
      finalPrice: string | null;
      notes: string;
    }>,
  ) =>
    api.put<{ message: string; data: Appointment }>(`/appointments/${id}`, data),

  cancel: (id: string) =>
    api.post<{ message: string; data: Appointment }>(
      `/appointments/${id}/cancel`,
    ),

  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/appointments/${id}`),
};
