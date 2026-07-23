'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authFetch, createApiUrl } from '@/lib/api/fetchWithAuth';
import {
  SessionUser,
  UserRole,
  canAccessAdminModule as roleCanAccessAdminModule,
  canAccessSalubridad as roleCanAccessSalubridad,
  canManageAccounts as roleCanManageAccounts,
  getDefaultRouteForRole,
} from '@/lib/auth/roles';
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  isPublicPath,
  persistSession,
  redirectToLogin,
} from '@/lib/auth/session';

interface AuthContextValue {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  isRepartidor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canAccessAdminModule: boolean;
  canAccessSalubridad: boolean;
  canManageAccounts: boolean;
  defaultRoute: string;
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
  refreshUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const invalidateSession = useCallback((shouldRedirect: boolean) => {
    clearSession();
    setUser(null);
    setToken(null);
    if (shouldRedirect) {
      redirectToLogin();
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<boolean> => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      return false;
    }

    try {
      const response = await authFetch(createApiUrl('api/auth/me'), {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Sesión inválida');
      }

      const data = await response.json();
      persistSession(storedToken, data.user);
      setUser(data.user);
      setToken(storedToken);
      return true;
    } catch {
      const onPublic = isPublicPath(window.location.pathname);
      invalidateSession(!onPublic);
      return false;
    }
  }, [invalidateSession]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const storedUser = getStoredUser();
      const storedToken = getStoredToken();

      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
        await refreshUser();
      } else {
        clearSession();
        setUser(null);
        setToken(null);
        if (!isPublicPath(window.location.pathname)) {
          redirectToLogin();
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
    // Solo al montar: hidratar y validar contra /api/auth/me
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al volver con "atrás" el navegador puede restaurar la página desde bfcache.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      const storedToken = getStoredToken();
      if (!storedToken) {
        setUser(null);
        setToken(null);
        if (!isPublicPath(window.location.pathname)) {
          redirectToLogin();
        }
        return;
      }

      void refreshUser();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'token') return;
      if (!event.newValue) {
        invalidateSession(!isPublicPath(window.location.pathname));
      } else {
        void refreshUser();
      }
    };

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('storage', onStorage);
    };
  }, [invalidateSession, refreshUser]);

  const login = useCallback((nextToken: string, nextUser: SessionUser) => {
    persistSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    window.location.replace('/');
  }, []);

  const role: UserRole | null = user?.role ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isRepartidor: role === 'repartidor',
      isAdmin: role === 'admin',
      isSuperAdmin: role === 'superadmin',
      canAccessAdminModule: role ? roleCanAccessAdminModule(role) : false,
      canAccessSalubridad: role ? roleCanAccessSalubridad(role) : false,
      canManageAccounts: role ? roleCanManageAccounts(role) : false,
      defaultRoute: role ? getDefaultRouteForRole(role) : '/home',
      login,
      logout,
      refreshUser,
    }),
    [user, token, loading, role, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
