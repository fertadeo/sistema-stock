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
      <div className="flex justify-center items-center h-screen text-gray-500">
        Cargando sesión...
      </div>
    );
  }

  if (isLoginPage || isRecoverPasswordPage || isRepartidorRoute || isRepartidor) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SideBar />
      <main style={{ flexGrow: 1, overflow: 'auto', padding: '20px' }}>{children}</main>
    </div>
  );
};

export default ConditionalLayout;
