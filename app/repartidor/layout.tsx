"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { RepartidorUiProvider, useRepartidorUi } from '@/contexts/RepartidorUiContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CreditCardIcon, 
  CubeIcon, 
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  BoltIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { useRutaAlertas } from '@/lib/hooks/useRutaAlertas';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-2 px-1 min-w-0 flex-1 ${
        isActive 
          ? 'text-teal-600' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <div className="w-6 h-6 mb-1">
        {icon}
      </div>
      <span className="text-xs font-medium truncate">{label}</span>
    </button>
  );
};

const isRouteActive = (pathname: string, href: string) => {
  if (href === '/repartidor') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
};

const RepartidorLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname ?? '';
  const { isRepartidor, user, logout } = useAuth();
  useRutaAlertas(Boolean(user));
  const { modalOperacionAbierto, enOperacion, navInferiorVisible } = useRepartidorUi();
  const ocultarNavInferior =
    modalOperacionAbierto || (enOperacion && !navInferiorVisible);
  const [fechaActual, setFechaActual] = useState('');
  const [horaActual, setHoraActual] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const actualizarTiempo = () => {
      const ahora = new Date();
      setFechaActual(ahora.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
      setHoraActual(ahora.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };

    actualizarTiempo();
    const interval = setInterval(actualizarTiempo, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  const allNavItems = [
    {
      href: '/repartidor',
      label: 'Inicio',
      icon: <HomeIcon className="w-6 h-6" />
    },
    {
      href: '/repartidor/rapido',
      label: 'Rápido',
      icon: <BoltIcon className="w-6 h-6" />
    },
    {
      href: '/repartidor/ruta',
      label: 'Ruta',
      icon: <MapPinIcon className="w-6 h-6" />
    },
    {
      href: '/repartidor/ventas',
      label: 'Ventas',
      icon: <ShoppingCartIcon className="w-6 h-6" />
    },
    {
      href: '/repartidor/fiados',
      label: 'Fiados',
      icon: <CreditCardIcon className="w-6 h-6" />
    },
    {
      href: '/repartidor/envases',
      label: 'Envases',
      icon: <CubeIcon className="w-6 h-6" />
    },
    {
      href: '/repartidor/clientes',
      label: 'Clientes',
      icon: <UserGroupIcon className="w-6 h-6" />
    },
  ];

  const navItems = allNavItems;

  const tituloActual =
    navItems.find((item) => isRouteActive(currentPathname, item.href) && item.href !== '/repartidor')?.label ||
    navItems.find((item) => item.href === currentPathname)?.label ||
    (currentPathname.startsWith('/repartidor/clientes/') ? 'Clientes' : 'Repartidor');

  const subtituloActual = (() => {
    if (currentPathname === '/repartidor') return 'Panel operativo';
    if (currentPathname === '/repartidor/rapido') return 'Flujo principal conectado al backend';
    if (currentPathname === '/repartidor/ruta') return 'Clientes fijados y alertas del día';
    if (currentPathname === '/repartidor/ventas') return 'Preparación y acceso a ventas';
    if (currentPathname === '/repartidor/fiados') return 'Cuenta corriente y cobros';
    if (currentPathname === '/repartidor/envases') return 'Seguimiento de envases';
    if (currentPathname.startsWith('/repartidor/clientes')) return 'Listado y ficha de clientes';
    return 'Operación diaria';
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header responsivo */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 lg:left-64">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {/* Botón de menú solo en móvil */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {sidebarOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">{tituloActual}</h1>
              <p className="text-sm text-gray-600">{subtituloActual}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-700">{fechaActual}</p>
            <p className="text-xs text-gray-500">{horaActual}</p>
          </div>
        </div>
      </header>

      {/* Sidebar: desplegable en móvil, fijo en escritorio */}
      <aside className={`
        fixed left-0 top-0 h-full bg-white shadow-lg z-40 transition-transform duration-300 ease-in-out
        w-64 transform lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="pt-20 h-full flex flex-col min-h-0">
          {/* Logo/Nombre en sidebar */}
          <div className="px-4 py-6 border-b border-gray-200 shrink-0">
            <h2 className="text-xl font-bold text-gray-800">Soderia Don Javier</h2>
            <p className="text-sm text-gray-600 mt-1">Panel Repartidor</p>
          </div>
          
          {/* Navegación — scroll si hay muchos ítems */}
          <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors ${
                  isRouteActive(currentPathname, item.href)
                    ? 'bg-teal-100 text-teal-700 border-r-2 border-teal-600' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="w-5 h-5 mr-3">
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Pie del sidebar: usuario y cerrar sesión */}
          <div className="mt-auto shrink-0 px-4 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                <UserGroupIcon className="w-5 h-5 text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {isRepartidor ? user?.email || 'Repartidor' : 'Módulo Repartidor'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role_label || 'Usuario'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/');
                setSidebarOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 font-medium transition-colors hover:bg-red-100 hover:text-red-800"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <main
        className={`pt-20 lg:pl-64 transition-[padding] duration-300 ${
          ocultarNavInferior ? 'pb-4' : 'pb-20'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Bottom navigation para todas las pantallas */}
      <nav
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:left-64 transition-transform duration-300 ease-out ${
          ocultarNavInferior ? 'translate-y-full pointer-events-none' : 'translate-y-0'
        }`}
      >
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isRouteActive(currentPathname, item.href)}
              onClick={() => router.push(item.href)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

const RepartidorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RepartidorUiProvider>
    <RepartidorLayoutContent>{children}</RepartidorLayoutContent>
  </RepartidorUiProvider>
);

export default RepartidorLayout;
