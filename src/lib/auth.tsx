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
import type { AdminUser, Vendor } from './types';

const ALLOWED_ROLES = ['ADMIN', 'VENDOR'];

interface AuthValue {
  user: AdminUser | null;
  /** Set only when user.role === 'VENDOR' — the caller's own vendor profile. */
  vendor: Vendor | null;
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

async function fetchVendorProfile(): Promise<Vendor> {
  const res = await api<{ data: Vendor }>('/vendor/me');
  return res.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const logOut = useCallback(async () => {
    await signOut(firebaseAuth);
    setUser(null);
    setVendor(null);
  }, []);

  // Firebase restores the signed-in session (if any) from IndexedDB on load and
  // fires this once it knows either way — that's what "loading" is waiting on.
  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        setUser(null);
        setVendor(null);
        setLoading(false);
        return;
      }
      try {
        const synced = await syncAdminUser();
        if (!ALLOWED_ROLES.includes(synced.role)) {
          await signOut(firebaseAuth);
          setUser(null);
          setVendor(null);
        } else {
          setUser(synced);
          setVendor(synced.role === 'VENDOR' ? await fetchVendorProfile() : null);
        }
      } catch {
        await signOut(firebaseAuth);
        setUser(null);
        setVendor(null);
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
    if (!ALLOWED_ROLES.includes(synced.role)) {
      await signOut(firebaseAuth);
      throw new Error('This account is not an IrriKart administrator or vendor.');
    }
    setUser(synced);
    setVendor(synced.role === 'VENDOR' ? await fetchVendorProfile() : null);
  }, []);

  const value = useMemo(
    () => ({ user, vendor, loading, logIn, logOut }),
    [user, vendor, loading, logIn, logOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
