"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CreditCardIcon, 
  CubeIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

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

const RepartidorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [fechaActual, setFechaActual] = useState('');
  const [horaActual, setHoraActual] = useState('');
  const [zonaActual, setZonaActual] = useState('Zona Centro');

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

  const navItems = [
    {
      href: '/repartidor',
      label: 'Inicio',
      icon: <HomeIcon className="w-6 h-6" />
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
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo con info del repartidor */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Repartidor</h1>
            <p className="text-sm text-gray-600">Zona: {zonaActual}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-700">{fechaActual}</p>
            <p className="text-xs text-gray-500">{horaActual}</p>
          </div>
        </div>
      </header>

      {/* Contenido principal con padding para el header */}
      <main className="pt-20 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={pathname === item.href}
              onClick={() => router.push(item.href)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

export default RepartidorLayout;
