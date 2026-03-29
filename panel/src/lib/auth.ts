"use client";

import { createContext, useContext } from "react";

export type UserRole = "ADMIN" | "CREATOR" | "BRAND";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  creatorId?: string | null;
  brandId?: string | null;
}

/** Normalize API user payloads (login / GET /auth/me) to AuthUser */
export function toAuthUser(raw: {
  id: string;
  email: string;
  role: string;
  brandId?: string | null;
  creatorId?: string | null;
}): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role as UserRole,
    brandId: raw.brandId ?? null,
    creatorId: raw.creatorId ?? null,
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
