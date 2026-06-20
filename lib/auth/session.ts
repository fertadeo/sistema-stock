import { SessionUser, UserRole } from './roles';

const SESSION_USER_KEY = 'session_user';

export const persistSession = (token: string, user: SessionUser) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('token', token);
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));

  if (user.repartidor_id) {
    localStorage.setItem('repartidor_id', user.repartidor_id);
  } else {
    localStorage.removeItem('repartidor_id');
  }

  document.cookie = `token=${token}; path=/; max-age=43200; SameSite=Lax`;
  document.cookie = `user_role=${user.role}; path=/; max-age=43200; SameSite=Lax`;
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('token');
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem('repartidor_id');

  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const getStoredUser = (): SessionUser | null => {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
};

export const getStoredRole = (): UserRole | null => {
  const user = getStoredUser();
  return user?.role ?? null;
};
