import { api } from "./client";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  realCost: string;
  saleCost: string;
  stock: number;
  commission: string;
  urlImage: string | null;
  state: boolean;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  description?: string | null;
  price: string;
  realCost?: string;
  saleCost?: string;
  stock?: number;
  commission?: string;
  urlImage?: string | null;
  state?: boolean;
}

export const productsApi = {
  list: () => api.get<Product[]>("/products"),
  byId: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: ProductInput) =>
    api.post<{ message: string; data: Product }>("/products", data),
  update: (id: string, data: Partial<ProductInput>) =>
    api.put<{ message: string; data: Product }>(`/products/${id}`, data),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/products/${id}`),
};
