import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/recuperar-password'];

const getRole = (request: NextRequest) => request.cookies.get('user_role')?.value || null;

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token');
  const role = getRole(request);

  if (PUBLIC_PATHS.includes(pathname)) {
    if (token && pathname === '/') {
      const destination = role === 'repartidor' ? '/repartidor/rapido' : '/home';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (role === 'repartidor') {
    if (pathname === '/repartidor/rapido') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/repartidor/rapido', request.url));
  }

  if (pathname.startsWith('/salubridad')) {
    if (role !== 'superadmin') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  if (pathname.startsWith('/centro-cuentas') || pathname.startsWith('/usuarios')) {
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/home',
    '/clientes/:path*',
    '/productos/:path*',
    '/ventas/:path*',
    '/zonasyrepartos/:path*',
    '/metricas/:path*',
    '/salubridad/:path*',
    '/centro-cuentas/:path*',
    '/usuarios/:path*',
    '/repartidor/:path*',
  ],
};
