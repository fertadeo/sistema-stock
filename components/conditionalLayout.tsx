'use client';

import React, { PropsWithChildren, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SideBar } from './sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredToken, isPublicPath, redirectToLogin } from '@/lib/auth/session';

const ConditionalLayout: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isRepartidor, loading, user, defaultRoute } = useAuth();

  const currentPath = pathname ?? '';
  const isLoginPage = currentPath === '/';
  const isRecoverPasswordPage = currentPath === '/recuperar-password';
  const isRepartidorRoute = currentPath.startsWith('/repartidor');
  const isPublic = isPublicPath(currentPath);
  const hasStoredToken = Boolean(getStoredToken());

  useEffect(() => {
    if (loading) return;

    // Si hay token en storage pero user aún no hidrató (race post-login), no expulsar.
    if (!isPublic && !user) {
      if (!getStoredToken()) {
        redirectToLogin();
      }
      return;
    }

    if (isLoginPage && user) {
      router.replace(defaultRoute);
    }
  }, [loading, isPublic, isLoginPage, user, defaultRoute, router]);

  if ((loading || (!user && hasStoredToken)) && !isLoginPage) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Cargando sesión...
      </div>
    );
  }

  if (!loading && !isPublic && !user && !hasStoredToken) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Redirigiendo al login...
      </div>
    );
  }

  if (isLoginPage || isRecoverPasswordPage || isRepartidorRoute || isRepartidor) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F5F5F5]">
      <SideBar />
      <div className="page-shell pt-14 md:pt-0 md:ml-60 safe-top safe-bottom">
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

export default ConditionalLayout;
