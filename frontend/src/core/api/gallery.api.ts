import { api } from "./client";

export interface GalleryImage {
  id: string;
  slug: string;
  caption: string | null;
  order: number;
  state: boolean;
  createdAt?: string;
}

export interface GalleryInput {
  slug: string;
  caption?: string | null;
  order?: number;
  state?: boolean;
}

export const galleryApi = {
  list: () => api.get<GalleryImage[]>("/gallery"),
  create: (data: GalleryInput) =>
    api.post<{ message: string; data: GalleryImage }>("/gallery", data),
  update: (id: string, data: Partial<GalleryInput>) =>
    api.put<{ message: string; data: GalleryImage }>(`/gallery/${id}`, data),
  remove: (id: string) =>
    api.delete<{ message: string; id: string }>(`/gallery/${id}`),
};
