'use client';

import React, { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import { SideBar } from './sidebar';
import { useAuth } from '@/contexts/AuthContext';

const ConditionalLayout: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const pathname = usePathname();
  const { isRepartidor, loading } = useAuth();

  const currentPath = pathname ?? '';
  const isLoginPage = currentPath === '/';
  const isRecoverPasswordPage = currentPath === '/recuperar-password';
  const isRepartidorRoute = currentPath.startsWith('/repartidor');

  if (loading && !isLoginPage) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Cargando sesión...
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
