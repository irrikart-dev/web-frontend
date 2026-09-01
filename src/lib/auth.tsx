import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api, onUnauthorized, tokenStore } from './api';
import type { AdminUser } from './types';

interface AuthValue {
  user: AdminUser | null;
  /** True until the stored token has been checked against the API. */
  loading: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Revalidate a stored token on boot — it may have expired since last visit.
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api<{ user: AdminUser }>('/admin/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // A 401 from any request anywhere ends the session.
  useEffect(() => {
    const handler = () => setUser(null);
    onUnauthorized.addEventListener('unauthorized', handler);
    return () => onUnauthorized.removeEventListener('unauthorized', handler);
  }, []);

  const logIn = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: AdminUser }>('/admin/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    tokenStore.set(res.token);
    setUser(res.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, logIn, logOut }),
    [user, loading, logIn, logOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
