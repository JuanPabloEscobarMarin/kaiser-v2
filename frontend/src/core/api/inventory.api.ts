import { api } from "./client";

export interface InventoryCategory {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  quantity: string;
  unit: string;
  minStock: string;
  cost: string;
  categoryId: string | null;
  category: InventoryCategory | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemInput {
  name: string;
  description?: string | null;
  quantity?: string;
  unit?: string;
  minStock?: string;
  cost?: string;
  categoryId?: string | null;
}

export const inventoryApi = {
  listCategories: () => api.get<InventoryCategory[]>("/inventory/categories"),
  createCategory: (data: { name: string }) =>
    api.post<{ message: string; data: InventoryCategory }>("/inventory/categories", data),
  deleteCategory: (id: string) =>
    api.delete<{ message: string; id: string }>(`/inventory/categories/${id}`),

  listItems: () => api.get<InventoryItem[]>("/inventory"),
  createItem: (data: CreateItemInput) =>
    api.post<{ message: string; data: InventoryItem }>("/inventory", data),
  updateItem: (id: string, data: Partial<CreateItemInput>) =>
    api.put<{ message: string; data: InventoryItem }>(`/inventory/${id}`, data),
  deleteItem: (id: string) =>
    api.delete<{ message: string; id: string }>(`/inventory/${id}`),
};
