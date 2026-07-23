"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../lib/types";
import { getAccessToken, clearTokens } from "../lib/auth-storage";
import { setSessionExpiredHandler } from "../lib/api";
import { fetchMe, logout as apiLogout } from "../lib/account-api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Adopt a freshly-authenticated user (tokens already stored by the api call). */
  setSession: (user: User) => void;
  /** Re-fetch the current user (e.g. after profile changes). */
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  // Hydrate session on mount, and wire the token-refresh-failure handler.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearTokens();
      setUser(null);
    });
    refresh().finally(() => setLoading(false));
    return () => setSessionExpiredHandler(null);
  }, [refresh]);

  const setSession = useCallback((next: User) => setUser(next), []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        setSession,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
