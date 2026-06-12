import { api } from "./client";
import { API_URL } from "@/core/config/environment";

export const resourcesApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return api.post<{ message: string; slug: string }>("/resources/images", fd);
  },

  imageUrl: (slug?: string | null) =>
    slug ? `${API_URL}/resources/images/${slug}` : null,
};
