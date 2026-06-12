import { api } from "./client";
import type {
  Appointment,
  AvailabilityResponse,
  CustomerInput,
} from "../types";

export const appointmentsApi = {
  availability: (params: {
    serviceId: string;
    employeeId: string;
    date: string;
  }) => {
    const qs = new URLSearchParams(params).toString();
    return api.get<AvailabilityResponse>(`/appointments/availability?${qs}`);
  },

  book: (data: {
    serviceId: string;
    employeeId: string;
    scheduledAt: string;
    customer: CustomerInput;
  }) =>
    api.post<{ message: string; data: Appointment }>(
      "/appointments/book",
      data,
    ),

  adminBook: (data: {
    serviceId: string;
    employeeId: string;
    scheduledAt: string;
    customer: CustomerInput;
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
