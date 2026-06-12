import { api } from "./client";
import type { User } from "../types";

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ message: string; user: User }>("/auth/login", {
      username,
      password,
    }),

  register: (data: { username: string; password: string; phone: string }) =>
    api.post<{ message: string; user: User }>("/auth/register", data),

  logout: () => api.post<{ message: string }>("/auth/logout"),

  me: () => api.get<{ user: User }>("/auth/me"),

  updateProfile: (data: { username?: string; avatarSlug?: string | null }) =>
    api.patch<{ message: string; user: User }>("/auth/me", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>("/auth/me/password", data),
};
