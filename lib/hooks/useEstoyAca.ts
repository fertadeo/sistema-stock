'use client';

import { useState, useCallback } from 'react';
import { calcularDistanciaMetros, RADIO_BUSQUEDA_CERCANOS_METROS, formatearDistancia } from '@/lib/geolocation/distancia';
import { GEOLOCATION_OPTIONS } from '@/lib/geolocation/config';
import { tieneCoordenadasValidas } from '@/lib/map/clienteCoords';

export interface ClienteConDistancia<T> {
  cliente: T;
  distancia: number;
  distanciaFormateada: string;
}

export interface UbicacionActual {
  latitud: number;
  longitud: number;
}

export interface EstadoEstoyAca {
  buscando: boolean;
  errorPermiso: boolean;
  errorMensaje: string | null;
  ubicacionActual: UbicacionActual | null;
}

/**
 * Hook para manejar la funcionalidad "Estoy acá" - encuentra clientes cercanos usando GPS.
 */
export function useEstoyAca<T extends { latitud?: number | null; longitud?: number | null; id: number }>() {
  const [estado, setEstado] = useState<EstadoEstoyAca>({
    buscando: false,
    errorPermiso: false,
    errorMensaje: null,
    ubicacionActual: null,
  });

  /**
   * Obtiene la ubicación actual del dispositivo.
   */
  const obtenerUbicacionActual = useCallback((): Promise<UbicacionActual> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Tu navegador no soporta geolocalización'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
          });
        },
        (error) => {
          let mensaje = 'No se pudo obtener tu ubicación';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              mensaje = 'Permiso de ubicación denegado. Activá la ubicación en tu dispositivo y otorgá permisos en el navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              mensaje = 'Ubicación no disponible. Verificá que el GPS esté activado.';
              break;
            case error.TIMEOUT:
              mensaje = 'Tiempo de espera agotado. Intentá nuevamente.';
              break;
          }
          
          reject(new Error(mensaje));
        },
        GEOLOCATION_OPTIONS
      );
    });
  }, []);

  /**
   * Filtra y ordena clientes por distancia desde una ubicación.
   */
  const filtrarClientesCercanos = useCallback(
    <TCliente extends { latitud?: number | null; longitud?: number | null; id: number }>(
      clientes: TCliente[],
      ubicacion: UbicacionActual,
      radioMetros: number = RADIO_BUSQUEDA_CERCANOS_METROS
    ): ClienteConDistancia<TCliente>[] => {
      const clientesConDistancia: ClienteConDistancia<TCliente>[] = [];

      for (const cliente of clientes) {
        const coords = tieneCoordenadasValidas(cliente.latitud, cliente.longitud);
        if (!coords) continue;

        const distancia = calcularDistanciaMetros(
          ubicacion.latitud,
          ubicacion.longitud,
          coords.latitud,
          coords.longitud
        );

        if (distancia <= radioMetros) {
          clientesConDistancia.push({
            cliente,
            distancia,
            distanciaFormateada: formatearDistancia(distancia),
          });
        }
      }

      return clientesConDistancia.sort((a, b) => a.distancia - b.distancia);
    },
    []
  );

  /**
   * Busca clientes cercanos a la ubicación actual del dispositivo.
   */
  const buscarClientesCercanos = useCallback(
    async <TCliente extends { latitud?: number | null; longitud?: number | null; id: number }>(
      todosClientes: TCliente[],
      radioMetros?: number
    ): Promise<ClienteConDistancia<TCliente>[]> => {
      setEstado({
        buscando: true,
        errorPermiso: false,
        errorMensaje: null,
        ubicacionActual: null,
      });

      try {
        const ubicacion = await obtenerUbicacionActual();
        
        setEstado({
          buscando: false,
          errorPermiso: false,
          errorMensaje: null,
          ubicacionActual: ubicacion,
        });

        return filtrarClientesCercanos(todosClientes, ubicacion, radioMetros);
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error al obtener ubicación';
        const esErrorPermiso = mensaje.toLowerCase().includes('permiso') || mensaje.toLowerCase().includes('denied');
        
        setEstado({
          buscando: false,
          errorPermiso: esErrorPermiso,
          errorMensaje: mensaje,
          ubicacionActual: null,
        });

        throw error;
      }
    },
    [obtenerUbicacionActual, filtrarClientesCercanos]
  );

  /**
   * Limpia el estado de error.
   */
  const limpiarError = useCallback(() => {
    setEstado((prev) => ({
      ...prev,
      errorPermiso: false,
      errorMensaje: null,
    }));
  }, []);

  return {
    estado,
    buscarClientesCercanos,
    filtrarClientesCercanos,
    limpiarError,
  };
}
