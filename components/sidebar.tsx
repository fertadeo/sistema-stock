"use client"

import { useState, useEffect, useRef } from 'react';
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

export const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Cerrar sidebar cuando cambia la ruta
  useEffect(() => {
    if (window.innerWidth < 640) { // Solo en mobile
      setIsOpen(false);
    }
  }, [pathname]); // Se ejecuta cuando cambia la ruta

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <section className="font-sans antialiased">
      <div
        className={`
          fixed left-0 overflow-x-hidden px-3 h-screen bg-white shadow-xl w-60
          transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
        `}
        id="sidebar"
      >
        <div className="mt-[50px] mb-5 space-y-6 md:space-y-10">
          <h1 className="text-sm font-bold text-center md:block md:text-xl">
            Soderia Don Javier<span className="text-red-700">.</span>
          </h1>
          <div id="profile" className="space-y-3">
            {/* <Image
              src="https://images.unsplash.com/photo-1628157588553-5eeea00af15c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80"
              alt="Avatar user"
              className="mx-auto w-10 rounded-full md:w-16"
              width={150} // Añade las dimensiones
              height={150} // Añade las dimensiones
            /> */}
            <div>
              <h2
                className="hidden text-xs font-medium text-center text-teal-500 md:text-sm"
              >
                Eduard Pantazi
              </h2>
              <p className="hidden text-xs text-center text-gray-500">Administrador/Empleado</p>
            </div>
          </div>
          <div id="menu" className="flex flex-col self-end space-y-2">
            <Link
              href="/home"
              className={`
                px-2 py-2 text-sm font-medium rounded-md
                ${pathname === "/home"
                  ? "bg-teal-500 text-white"
                  : "text-gray-700 hover:bg-teal-200 hover:text-teal-900"}
              `}
            >
              <svg
                className="inline-block w-6 h-6 fill-current"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                ></path>
              </svg>
              <span className="justify-center pl-2 align-middle" style={{ fontSize: '1.1rem' }}>Inicio</span>
            </Link>
            {/*
            <Link
              href="/metricas"
              className={`
                px-2 py-2 text-sm font-medium rounded-md
                ${pathname === "/metricas"
                  ? "bg-teal-500 text-white"
                  : "text-gray-700 hover:bg-teal-200 hover:text-teal-900"}
              `}
            >
              <svg
                className="inline-block w-6 h-6 fill-current"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6zm6-4a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V7zm6-6a1 1 0 011-1h2a1 1 0 011 1v16a1 1 0 01-1 1h-2a1 1 0 01-1-1V1z" />
              </svg>
              <span className="justify-center pl-2 align-middle" style={{ fontSize: '1.1rem' }}>Métricas</span>
            </Link>
            */}
            <Link
              href="/clientes"
              className={`
                px-2 py-2 text-sm font-medium rounded-md
                ${pathname === "/clientes"
                  ? "bg-teal-500 text-white"
                  : "text-gray-700 hover:bg-teal-200 hover:text-teal-900"}
              `}
            >
              <svg
                className="inline-block w-6 h-6 fill-current"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
                ></path>
              </svg>
              <span className="justify-center pl-2 align-middle" style={{ fontSize: '1.1rem' }} >Clientes</span>
            </Link>
            <Link
              href="/zonasyrepartos"
              className={`
                px-2 py-2 text-sm font-medium rounded-md
                ${pathname === "/zonasyrepartos"
                  ? "bg-teal-500 text-white"
                  : "text-gray-700 hover:bg-teal-200 hover:text-teal-900"}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="inline-block w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              <span className="inline-flex items-center pl-2" style={{ fontSize: '1.1rem' }} >Zonas y Repartos</span>
            </Link>
            <Link
              href="/productos"
              className={`
                px-2 py-2 text-sm font-medium rounded-md
                ${pathname === "/productos"
                  ? "bg-teal-500 text-white"
                  : "text-gray-700 hover:bg-teal-200 hover:text-teal-900"}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="inline-block w-6 h-6 fill-current">
                <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03ZM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 0 0 .372-.648V7.93ZM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 0 0 .372.648l8.628 5.033Z" />
              </svg>

              <span className="justify-center pl-2 align-middle" style={{ fontSize: '1.1rem' }} >Productos</span>
            </Link>

            <Link
              href="/ventas"
              className={`
                px-2 py-2 text-sm font-medium rounded-md
                ${pathname === "/ventas"
                  ? "bg-teal-500 text-white"
                  : "text-gray-700 hover:bg-teal-200 hover:text-teal-900"}
              `}
            >
              <svg
                className="inline-block w-6 h-6 fill-current"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 10h2v6H3v-6zm4-4h2v10H7V6zm4-2h2v12h-2V4zm4 4h2v8h-2V8z"
                ></path>
              </svg>
              <span className="justify-center pl-2 align-middle" style={{ fontSize: '1.1rem' }}>Ventas</span>
            </Link>

                         <Link
               href="/repartidor"
               className={`
                 px-2 py-2 text-sm font-medium rounded-md
                 ${pathname?.startsWith("/repartidor")
                   ? "bg-teal-500 text-white"
                   : "text-gray-700 hover:bg-teal-200 hover:text-teal-900"}
               `}
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="inline-block w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
               </svg>
               <span className="justify-center pl-2 align-middle" style={{ fontSize: '1.1rem' }}>Repartidor</span>
             </Link>

           

            <Link
              href="https://api.whatsapp.com/send?phone=5493517552258"
              className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md transition duration-150 ease-in-out hover:bg-teal-500 hover:text-white hover:scale-105"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 26 26"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="inline-block hover:bg-white"
                style={{ transition: 'fill 0.3s ease-in-out' }}
              >
                <path
                  d="M22.1058 3.77812C19.6741 1.34062 16.4357 0 12.9942 0C5.89062 0 0.110268 5.78036 0.110268 12.8839C0.110268 15.1531 0.702232 17.3701 1.82812 19.3259L0 26L6.8308 24.2067C8.71116 25.2339 10.8295 25.7737 12.9884 25.7737H12.9942C20.092 25.7737 26 19.9933 26 12.8897C26 9.44821 24.5375 6.21562 22.1058 3.77812ZM12.9942 23.6031C11.0674 23.6031 9.18125 23.0866 7.53884 22.1116L7.15 21.8795L3.09911 22.9415L4.17857 18.9893L3.92321 18.583C2.84955 16.8768 2.28661 14.9094 2.28661 12.8839C2.28661 6.9817 7.09196 2.17634 13 2.17634C15.8612 2.17634 18.5482 3.29062 20.5679 5.31607C22.5875 7.34152 23.8295 10.0286 23.8237 12.8897C23.8237 18.7978 18.8964 23.6031 12.9942 23.6031ZM18.8674 15.5826C18.5482 15.4201 16.9638 14.6424 16.6679 14.5379C16.3719 14.4277 16.1571 14.3754 15.9424 14.7004C15.7277 15.0254 15.1125 15.7451 14.921 15.9656C14.7353 16.1804 14.5437 16.2094 14.2246 16.0469C12.3326 15.1009 11.0906 14.358 9.84286 12.2165C9.51205 11.6478 10.1737 11.6884 10.7888 10.458C10.8933 10.2433 10.8411 10.0576 10.7598 9.89509C10.6786 9.73259 10.0344 8.14821 9.76741 7.50402C9.50625 6.87723 9.23929 6.96429 9.04196 6.95268C8.85625 6.94107 8.64152 6.94107 8.42679 6.94107C8.21205 6.94107 7.86384 7.02232 7.56786 7.34152C7.27187 7.66652 6.44196 8.4442 6.44196 10.0286C6.44196 11.6129 7.59688 13.1451 7.75357 13.3598C7.91607 13.5746 10.0228 16.8246 13.2554 18.2232C15.2982 19.1054 16.0991 19.1808 17.1205 19.0299C17.7415 18.9371 19.0241 18.2522 19.2911 17.4978C19.558 16.7433 19.558 16.0991 19.4768 15.9656C19.4013 15.8205 19.1866 15.7393 18.8674 15.5826Z"
                  fill="#25D366"
                  style={{ transition: 'fill 0.3s ease-in-out' }}
                />
              </svg>

              <span className="pl-2 text-lg">Contactar a Soporte</span>
            </Link>

            <div className="mt-auto">
              <button
                onClick={() => {
                  // Eliminar la cookie del token
                  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  handleNavigation('/');
                }}
                className="flex gap-2 items-center px-4 py-2 text-sm font-medium text-red-700 rounded-md transition duration-150 ease-in-out hover:bg-red-500 hover:text-white hover:scale-105"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 9V5C10 3.89543 10.8954 3 12 3H16C17.1046 3 18 3.89543 18 5V19C18 20.1046 17.1046 21 16 21H12C10.8954 21 10 20.1046 10 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 12H3M3 12L6 9M3 12L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <span className="pr-10 text-lg">
                  Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay solo para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity sm:hidden"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Botón de toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-0 left-0 z-50 p-2 text-gray-500 bg-white rounded-md border-2 border-gray-200 shadow-lg focus:bg-teal-500 focus:outline-none focus:text-white sm:hidden"
      >
        {isOpen ? (
          // Ícono X para cerrar
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Ícono de menú hamburguesa
          <svg
            className="w-5 h-5 fill-current"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </section>
  )
}

export default SideBar;
