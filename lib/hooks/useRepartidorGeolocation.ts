'use client';

import { useEffect, useRef } from 'react';
import { repartidorRapidoService } from '@/lib/services/repartidorRapidoService';
import { calcularDistanciaMetros } from '@/lib/geolocation/distancia';

const INTERVALO_MS = 45_000;
const DISTANCIA_MINIMA_METROS = 50;

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
        ? calcularDistanciaMetros(ultima.lat, ultima.lng, lat, lng)
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
