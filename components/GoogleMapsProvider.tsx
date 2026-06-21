'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

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

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'es',
    region: 'AR',
  });

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-red-600">
        Error al cargar Google Maps. Verifique la API key.
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
  return useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'es',
    region: 'AR',
  });
}
