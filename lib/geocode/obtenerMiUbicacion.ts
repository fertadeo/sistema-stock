import { authFetch } from '@/lib/api/fetchWithAuth';

const RIO_CUARTO_BOUNDS = {
  north: -33.0,
  south: -33.2,
  east: -64.2,
  west: -64.4,
};

function isInRioCuartoBounds(lat: number, lng: number): boolean {
  return (
    lat >= RIO_CUARTO_BOUNDS.south &&
    lat <= RIO_CUARTO_BOUNDS.north &&
    lng >= RIO_CUARTO_BOUNDS.west &&
    lng <= RIO_CUARTO_BOUNDS.east
  );
}

export interface MiUbicacionResultado {
  latitud: string;
  longitud: string;
  direccion: string;
}

export class MiUbicacionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MiUbicacionError';
  }
}

function leerPosicionActual(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(
        new MiUbicacionError(
          'Tu dispositivo no soporta geolocalización.'
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        reject(
          new MiUbicacionError(
            'Permiso de ubicación denegado. Activá el GPS en el navegador.'
          )
        );
        return;
      }
      if (error.code === error.TIMEOUT) {
        reject(
          new MiUbicacionError(
            'No se pudo obtener la ubicación a tiempo. Intentá de nuevo.'
          )
        );
        return;
      }
      reject(
        new MiUbicacionError(
          'No se pudo obtener tu ubicación. Verificá que el GPS esté activo.'
        )
      );
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  const response = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/geocode/reverse?lat=${lat}&lon=${lon}`
  );
  if (!response.ok) {
    throw new MiUbicacionError('No se pudo obtener la dirección de tu ubicación.');
  }
  const data = await response.json();
  return data.formatted_address || data.display_name || '';
}

/**
 * Obtiene las coordenadas GPS actuales.
 * Si `direccionActual` tiene texto, se conserva y solo se actualizan las coords.
 * Si está vacía, se completa con reverse geocode.
 */
export async function obtenerMiUbicacion(
  direccionActual = ''
): Promise<MiUbicacionResultado> {
  const position = await leerPosicionActual();
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  if (!isInRioCuartoBounds(lat, lon)) {
    throw new MiUbicacionError(
      'Tu ubicación actual está fuera de Río Cuarto.'
    );
  }

  const direccionTrim = direccionActual.trim();
  let direccion = direccionTrim;

  if (!direccion) {
    try {
      direccion = await reverseGeocode(lat, lon);
    } catch {
      direccion = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  }

  return {
    latitud: String(lat),
    longitud: String(lon),
    direccion,
  };
}
