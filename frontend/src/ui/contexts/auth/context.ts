import { createContext } from "react";
import type { User } from "@/core/types";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
  updateProfile: (data: {
    username?: string;
    avatarSlug?: string | null;
  }) => Promise<User>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
