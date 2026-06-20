'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/lib/api/fetchWithAuth';
import {
  SessionUser,
  UserRole,
  canAccessAdminModule as roleCanAccessAdminModule,
  canAccessSalubridad as roleCanAccessSalubridad,
  getDefaultRouteForRole,
} from '@/lib/auth/roles';
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  persistSession,
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
  defaultRoute: string;
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const createApiUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:8080';
  const cleanPath = path.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      return;
    }

    try {
      const response = await authFetch(createApiUrl('api/auth/me'));
      if (!response.ok) {
        throw new Error('Sesión inválida');
      }

      const data = await response.json();
      persistSession(storedToken, data.user);
      setUser(data.user);
      setToken(storedToken);
    } catch {
      clearSession();
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      void refreshUser().finally(() => setLoading(false));
      return;
    }

    setLoading(false);
  }, [refreshUser]);

  const login = useCallback((nextToken: string, nextUser: SessionUser) => {
    persistSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
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
