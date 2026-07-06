import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ACCESS_TOKEN_KEY, ADMIN_USER_KEY } from '../lib/config';
import { adminLogin, type AdminUser } from '../lib/authApi';
import { apolloClient } from '../lib/apollo';

type AuthState = {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function loadUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(loadUser);

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminLogin(email, password);
    if (!result.ok) return { ok: false, error: result.error };
    localStorage.setItem(ACCESS_TOKEN_KEY, result.token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setUser(null);
    void apolloClient.clearStore();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: !!user,
      isSuperAdmin: !!user?.roles?.includes('SUPER_ADMIN'),
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
