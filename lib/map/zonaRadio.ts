/** Distancia Haversine en metros entre dos coordenadas. */
export function distanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

export interface PuntoConCoords {
  id: number;
  latitud: number;
  longitud: number;
}

export interface ZonaRadioLike {
  latitud: number;
  longitud: number;
  radio_metros: number;
}

export function clienteDentroDeZona(
  cliente: PuntoConCoords,
  zona: ZonaRadioLike
): boolean {
  return (
    distanciaMetros(
      zona.latitud,
      zona.longitud,
      cliente.latitud,
      cliente.longitud
    ) <= zona.radio_metros
  );
}

export function clientesDentroDeZona<T extends PuntoConCoords>(
  clientes: T[],
  zona: ZonaRadioLike
): T[] {
  return clientes.filter((cliente) => clienteDentroDeZona(cliente, zona));
}

export function contarClientesEnZona(
  clientes: PuntoConCoords[],
  zona: ZonaRadioLike
): number {
  return clientesDentroDeZona(clientes, zona).length;
}

export function formatearRadio(metros: number): string {
  if (metros >= 1000) {
    const km = metros / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
  }
  return `${Math.round(metros)} m`;
}

export const COLORES_ZONA = [
  '#0d9488',
  '#2563eb',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#059669',
  '#db2777',
] as const;

export const RADIO_MIN_METROS = 100;
export const RADIO_MAX_METROS = 15000;
export const RADIO_DEFAULT_METROS = 1500;
