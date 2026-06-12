import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./context";
import { authApi } from "@/core/api";
import type { User } from "@/core/types";

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
    void (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const { user } = await authApi.login(username, password);
    setUser(user);
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
