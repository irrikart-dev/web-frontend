import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';

import { api, onUnauthorized } from './api';
import { firebaseAuth } from './firebase';
import type { AdminUser } from './types';

interface AuthValue {
  user: AdminUser | null;
  /** True until Firebase's own session check (and our role lookup) resolve. */
  loading: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Mirrors the verified Firebase user into our own User table, returns its role. */
async function syncAdminUser(): Promise<AdminUser> {
  const res = await api<{ data: AdminUser }>('/auth/firebase/sync', { method: 'POST' });
  return res.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logOut = useCallback(async () => {
    await signOut(firebaseAuth);
    setUser(null);
  }, []);

  // Firebase restores the signed-in session (if any) from IndexedDB on load and
  // fires this once it knows either way — that's what "loading" is waiting on.
  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const synced = await syncAdminUser();
        if (synced.role !== 'ADMIN') {
          await signOut(firebaseAuth);
          setUser(null);
        } else {
          setUser(synced);
        }
      } catch {
        await signOut(firebaseAuth);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  // A 401 from any request anywhere ends the session.
  useEffect(() => {
    const handler = () => void logOut();
    onUnauthorized.addEventListener('unauthorized', handler);
    return () => onUnauthorized.removeEventListener('unauthorized', handler);
  }, [logOut]);

  const logIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
    const synced = await syncAdminUser();
    if (synced.role !== 'ADMIN') {
      await signOut(firebaseAuth);
      throw new Error('This account is not an IrriKart administrator.');
    }
    setUser(synced);
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
