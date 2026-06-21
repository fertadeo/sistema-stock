"use client"

import { useState, useEffect, useMemo } from 'react';
import Link from "next/link"
import Image from 'next/image';
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  MapPinIcon,
  CubeIcon,
  ShoppingCartIcon,
  TruckIcon,
  BoltIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, canAccessSalubridad, canManageAccounts } = useAuth();

  const navItems = useMemo(() => {
    const items: NavItem[] = [
      { href: '/home', label: 'Inicio', icon: <HomeIcon className="w-5 h-5 shrink-0" /> },
      { href: '/clientes', label: 'Clientes', icon: <UserGroupIcon className="w-5 h-5 shrink-0" /> },
      { href: '/zonasyrepartos', label: 'Zonas y Repartos', icon: <MapPinIcon className="w-5 h-5 shrink-0" /> },
      { href: '/productos', label: 'Productos', icon: <CubeIcon className="w-5 h-5 shrink-0" /> },
      { href: '/ventas', label: 'Ventas', icon: <ShoppingCartIcon className="w-5 h-5 shrink-0" /> },
      { href: '/repartidor', label: 'Repartidor', icon: <TruckIcon className="w-5 h-5 shrink-0" /> },
      { href: '/repartidor/rapido', label: 'Repartidor Rápido', icon: <BoltIcon className="w-5 h-5 shrink-0" /> },
    ];

    if (canManageAccounts) {
      items.push({
        href: '/reportes',
        label: 'Reportes',
        icon: <ChartBarIcon className="w-5 h-5 shrink-0" />,
      });
      items.push({
        href: '/centro-cuentas',
        label: 'Centro de cuentas',
        icon: <UsersIcon className="w-5 h-5 shrink-0" />,
      });
    }

    if (canAccessSalubridad) {
      items.push({
        href: '/salubridad',
        label: 'Salubridad',
        icon: <ShieldCheckIcon className="w-5 h-5 shrink-0" />,
      });
    }

    return items;
  }, [canAccessSalubridad, canManageAccounts]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [pathname]);

  return (
    <section className="font-sans antialiased">
      <div
        className={`
          fixed left-0 flex flex-col overflow-hidden px-3 h-screen bg-white shadow-xl w-60
          transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
        `}
        id="sidebar"
      >
        <div className="flex flex-col flex-1 min-h-0 pt-14 md:pt-[50px]">
          <div className="flex flex-col items-center px-2 pb-6">
            <Image
              src="/images/soderialogo.png"
              alt="Sodería Don Javier"
              width={200}
              height={80}
              className="object-contain w-full max-w-[200px] h-auto"
              priority
            />
          </div>

          <div id="menu" className="flex flex-col flex-1 min-h-0 overflow-y-auto space-y-1 pb-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/home' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md
                    ${isActive
                      ? 'bg-teal-500 text-white'
                      : 'text-gray-700 hover:bg-teal-100 hover:text-teal-900'}
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <Link
              href="https://api.whatsapp.com/send?phone=5493517552258"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md transition duration-150 ease-in-out hover:bg-teal-500 hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 26 26"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d="M22.1058 3.77812C19.6741 1.34062 16.4357 0 12.9942 0C5.89062 0 0.110268 5.78036 0.110268 12.8839C0.110268 15.1531 0.702232 17.3701 1.82812 19.3259L0 26L6.8308 24.2067C8.71116 25.2339 10.8295 25.7737 12.9884 25.7737H12.9942C20.092 25.7737 26 19.9933 26 12.8897C26 9.44821 24.5375 6.21562 22.1058 3.77812ZM12.9942 23.6031C11.0674 23.6031 9.18125 23.0866 7.53884 22.1116L7.15 21.8795L3.09911 22.9415L4.17857 18.9893L3.92321 18.583C2.84955 16.8768 2.28661 14.9094 2.28661 12.8839C2.28661 6.9817 7.09196 2.17634 13 2.17634C15.8612 2.17634 18.5482 3.29062 20.5679 5.31607C22.5875 7.34152 23.8295 10.0286 23.8237 12.8897C23.8237 18.7978 18.8964 23.6031 12.9942 23.6031ZM18.8674 15.5826C18.5482 15.4201 16.9638 14.6424 16.6679 14.5379C16.3719 14.4277 16.1571 14.3754 15.9424 14.7004C15.7277 15.0254 15.1125 15.7451 14.921 15.9656C14.7353 16.1804 14.5437 16.2094 14.2246 16.0469C12.3326 15.1009 11.0906 14.358 9.84286 12.2165C9.51205 11.6478 10.1737 11.6884 10.7888 10.458C10.8933 10.2433 10.8411 10.0576 10.7598 9.89509C10.6786 9.73259 10.0344 8.14821 9.76741 7.50402C9.50625 6.87723 9.23929 6.96429 9.04196 6.95268C8.85625 6.94107 8.64152 6.94107 8.42679 6.94107C8.21205 6.94107 7.86384 7.02232 7.56786 7.34152C7.27187 7.66652 6.44196 8.4442 6.44196 10.0286C6.44196 11.6129 7.59688 13.1451 7.75357 13.3598C7.91607 13.5746 10.0228 16.8246 13.2554 18.2232C15.2982 19.1054 16.0991 19.1808 17.1205 19.0299C17.7415 18.9371 19.0241 18.2522 19.2911 17.4978C19.558 16.7433 19.558 16.0991 19.4768 15.9656C19.4013 15.8205 19.1866 15.7393 18.8674 15.5826Z"
                  fill="#25D366"
                />
              </svg>
              <span>Contactar a Soporte</span>
            </Link>

            <div className="pt-2 mt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="flex gap-3 items-center px-3 py-2.5 w-full text-sm font-medium text-red-700 rounded-md transition duration-150 ease-in-out hover:bg-red-500 hover:text-white"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path d="M10 9V5C10 3.89543 10.8954 3 12 3H16C17.1046 3 18 3.89543 18 5V19C18 20.1046 17.1046 21 16 21H12C10.8954 21 10 20.1046 10 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 12H3M3 12L6 9M3 12L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>

        <div id="profile" className="shrink-0 px-2 py-4 border-t border-gray-200 text-center">
          {user?.email && (
            <p className="text-xs text-gray-600 truncate" title={user.email}>
              {user.email}
            </p>
          )}
          <p className="text-xs font-medium text-teal-600">
            {user?.role_label || 'Usuario'}
          </p>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity md:hidden"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-0 left-0 z-50 p-2 m-2 text-gray-500 bg-white rounded-md border-2 border-gray-200 shadow-lg focus:bg-teal-500 focus:outline-none focus:text-white md:hidden safe-top"
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isOpen ? (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 fill-current" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </section>
  )
}

export default SideBar;
