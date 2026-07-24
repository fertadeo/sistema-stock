import { getStoredToken, isPublicPath, redirectToLogin } from '@/lib/auth/session';

export const createApiUrl = (path: string): string => {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  const normalizedPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;
  return `${baseUrl}/${normalizedPath}`;
};

export const getAuthHeaders = (headers?: HeadersInit): HeadersInit => {
  const token = getStoredToken();
  return {
    ...(headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const resolveRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

const shouldHandleUnauthorized = (url: string): boolean => {
  return !url.includes('/api/auth/login') && !url.includes('/api/auth/register');
};

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 && shouldHandleUnauthorized(resolveRequestUrl(input))) {
    // /api/auth/me lo maneja AuthContext (distingue 401 vs errores temporales).
    const url = resolveRequestUrl(input);
    if (url.includes('/api/auth/me')) {
      return response;
    }

    if (typeof window !== 'undefined' && !isPublicPath(window.location.pathname)) {
      redirectToLogin();
    }
  }

  return response;
}

/** Para EventSource/SSE, que no admite headers Authorization. */
export function createAuthStreamUrl(path: string): string {
  const url = createApiUrl(path);
  const token = getStoredToken();
  if (!token) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
