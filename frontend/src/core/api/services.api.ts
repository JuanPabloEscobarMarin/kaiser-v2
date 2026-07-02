import { api } from "./client";
import type { Service, SearchResultItem } from "../types";

export interface ServiceInput {
  name: string;
  price: string;
  duration: number;
  state?: boolean;
  discount?: string;
  variablePrice?: boolean;
  categoryId?: string | null;
  urlImage?: string;
  description?: string;
}

export const servicesApi = {
  list: () => api.get<Service[]>("/services"),
  byId: (id: string) => api.get<Service>(`/services/${id}`),
  create: (data: ServiceInput) =>
    api.post<{ message: string; data: Service }>("/services", data),
  update: (id: string, data: Partial<ServiceInput>) =>
    api.put<{ message: string; data: Service }>(`/services/${id}`, data),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/services/${id}`),
  removeMany: (ids: string[]) =>
    api.delete<{ message: string; count: number }>("/services", { ids }),
  search: (q: string) =>
    api.get<{ query: string; total: number; results: SearchResultItem[] }>(
      `/search?q=${encodeURIComponent(q)}`,
    ),
};
