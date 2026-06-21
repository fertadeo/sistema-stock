'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';

interface GoogleMapsContextValue {
  isLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({ isLoaded: false });

export const RIO_CUARTO_BOUNDS = {
  north: -33.0,
  south: -33.2,
  east: -64.2,
  west: -64.4,
};

export const EMPRESA_COORDENADAS = { lat: -33.141709, lng: -64.3634274 };

function GoogleMapsSetupMessage() {
  return (
    <div className="flex flex-col gap-3 justify-center items-center p-6 h-full max-w-lg mx-auto text-sm text-gray-700">
      <p className="text-base font-semibold text-gray-900">Google Maps no está configurado</p>
      <p>
        El mapa muestra &quot;For development purposes only&quot; cuando falta la API key,
        no hay facturación activa o las APIs no están habilitadas en Google Cloud.
      </p>
      <ol className="list-decimal pl-5 space-y-1 text-left w-full">
        <li>Crear proyecto en Google Cloud Console y vincular facturación.</li>
        <li>Habilitar: Maps JavaScript API, Places API (New), Geocoding API y Directions API.</li>
        <li>Crear API key para el frontend (restricción por referrer HTTP).</li>
        <li>
          Agregar en <code className="px-1 bg-gray-100 rounded">.env.local</code>:
          <br />
          <code className="block mt-1 px-2 py-1 text-xs bg-gray-100 rounded break-all">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave_aqui
          </code>
        </li>
        <li>Reiniciar el servidor de Next.js (<code className="px-1 bg-gray-100 rounded">npm run dev</code>).</li>
      </ol>
      <a
        href="https://console.cloud.google.com/google/maps-apis/start"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        Abrir Google Maps Platform
      </a>
    </div>
  );
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'es',
    region: 'AR',
  });

  if (!GOOGLE_MAPS_API_KEY) {
    return <GoogleMapsSetupMessage />;
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-2 justify-center items-center p-6 h-full text-red-600">
        <p className="font-semibold">Error al cargar Google Maps</p>
        <p className="text-sm text-gray-600 text-center max-w-md">
          Verifique que la API key sea válida, que Maps JavaScript API esté habilitada
          y que el dominio actual esté permitido en las restricciones de la clave.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Cargando mapa...
      </div>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

export function useGoogleMapsLoader() {
  const loader = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'es',
    region: 'AR',
  });

  if (!GOOGLE_MAPS_API_KEY) {
    return {
      isLoaded: false,
      loadError: new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no configurada'),
    };
  }

  return loader;
}
