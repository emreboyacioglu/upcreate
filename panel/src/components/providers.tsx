"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AuthContext, type AuthUser, toAuthUser } from "@/lib/auth";
import { api } from "@/lib/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: AuthUser; claims: unknown }>("/auth/me")
      .then((res) => setUser(toAuthUser(res.user)))
      .catch(() => {
        api.setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AuthUser & { createdAt?: string } }>("/auth/login", {
      email,
      password,
    });
    api.setToken(res.token);
    setUser(toAuthUser(res.user));
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
    window.location.href = "/panel/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
