'use client';

import { useEffect, useRef } from 'react';
import { repartidorRapidoService } from '@/lib/services/repartidorRapidoService';

const INTERVALO_MS = 45_000;
const DISTANCIA_MINIMA_METROS = 50;

function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Envía la ubicación GPS del repartidor al backend usando la API del navegador (sin costo Google).
 */
export function useRepartidorGeolocation(activo: boolean = true) {
  const ultimaPosicionRef = useRef<{ lat: number; lng: number } | null>(null);
  const ultimoEnvioRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activo || typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    const enviarSiCorresponde = (lat: number, lng: number, forzar = false) => {
      const ahora = Date.now();
      const ultima = ultimaPosicionRef.current;
      const distancia = ultima
        ? distanciaMetros(ultima.lat, ultima.lng, lat, lng)
        : DISTANCIA_MINIMA_METROS + 1;
      const pasoTiempo = ahora - ultimoEnvioRef.current >= INTERVALO_MS;

      if (!forzar && !pasoTiempo && distancia < DISTANCIA_MINIMA_METROS) {
        return;
      }

      ultimaPosicionRef.current = { lat, lng };
      ultimoEnvioRef.current = ahora;

      void repartidorRapidoService.enviarUbicacion(lat, lng).catch((error) => {
        console.warn('No se pudo enviar ubicación del repartidor:', error);
      });
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        enviarSiCorresponde(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn('Geolocalización no disponible:', error.message);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 30_000,
        timeout: 20_000,
      }
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        enviarSiCorresponde(position.coords.latitude, position.coords.longitude, true);
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activo]);
}
