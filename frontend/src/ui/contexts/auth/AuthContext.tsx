import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/core/api";
import type { User } from "@/core/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (data: {
    username: string;
    password: string;
    phone: string;
  }) => Promise<User>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await authApi.me();
      setUser(user);
      return user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const { user } = await authApi.login(username, password);
    setUser(user);
    return user;
  };

  const register = async (data: {
    username: string;
    password: string;
    phone: string;
  }) => {
    const { user } = await authApi.register(data);
    return user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateProfile = async (data: {
    username?: string;
    avatarSlug?: string | null;
  }) => {
    const { user } = await authApi.updateProfile(data);
    setUser(user);
    return user;
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    await authApi.changePassword(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refresh,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
