import { api } from "./client";
import type { ServiceCategory } from "../types";

export interface CategoryInput {
  name: string;
  order?: number;
  state?: boolean;
}

export const serviceCategoriesApi = {
  list: () => api.get<ServiceCategory[]>("/service-categories"),
  create: (data: CategoryInput) =>
    api.post<{ message: string; data: ServiceCategory }>(
      "/service-categories",
      data,
    ),
  update: (id: string, data: Partial<CategoryInput>) =>
    api.put<{ message: string; data: ServiceCategory }>(
      `/service-categories/${id}`,
      data,
    ),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/service-categories/${id}`),
};
