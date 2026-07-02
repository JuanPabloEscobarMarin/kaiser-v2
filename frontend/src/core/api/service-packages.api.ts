import { api } from "./client";
import type { ServicePackage } from "../types";

export interface PackageInput {
  name: string;
  price: string;
  description?: string | null;
  urlImage?: string | null;
  state?: boolean;
  serviceIds: string[];
}

export const servicePackagesApi = {
  list: () => api.get<ServicePackage[]>("/service-packages"),
  byId: (id: string) => api.get<ServicePackage>(`/service-packages/${id}`),
  create: (data: PackageInput) =>
    api.post<{ message: string; data: ServicePackage }>(
      "/service-packages",
      data,
    ),
  update: (id: string, data: Partial<PackageInput>) =>
    api.put<{ message: string; data: ServicePackage }>(
      `/service-packages/${id}`,
      data,
    ),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/service-packages/${id}`),
};
