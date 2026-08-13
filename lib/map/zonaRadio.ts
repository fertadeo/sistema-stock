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

export type TipoZona = 'radio' | 'barrio' | 'poligono';

export interface PuntoMapa {
  lat: number;
  lng: number;
}

export interface PuntoConCoords {
  id: number;
  latitud: number;
  longitud: number;
}

export interface ZonaGeometria {
  tipo?: TipoZona | string | null;
  latitud: number;
  longitud: number;
  radio_metros?: number | null;
  poligono?: PuntoMapa[] | null;
}

export function puntoEnPoligono(punto: PuntoMapa, poligono: PuntoMapa[]): boolean {
  if (!poligono || poligono.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const xi = poligono[i].lng;
    const yi = poligono[i].lat;
    const xj = poligono[j].lng;
    const yj = poligono[j].lat;
    const intersect =
      yi > punto.lat !== yj > punto.lat &&
      punto.lng < ((xj - xi) * (punto.lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function centroide(puntos: PuntoMapa[]): PuntoMapa {
  if (puntos.length === 0) return { lat: 0, lng: 0 };
  const sum = puntos.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / puntos.length, lng: sum.lng / puntos.length };
}

export function clienteDentroDeZona(
  cliente: PuntoConCoords,
  zona: ZonaGeometria
): boolean {
  const tipo = (zona.tipo || 'radio') as TipoZona;
  if (tipo === 'barrio' || tipo === 'poligono') {
    const poly = zona.poligono;
    if (!poly || poly.length < 3) return false;
    return puntoEnPoligono(
      { lat: cliente.latitud, lng: cliente.longitud },
      poly
    );
  }
  const radio = Number(zona.radio_metros);
  if (!Number.isFinite(radio) || radio <= 0) return false;
  return (
    distanciaMetros(
      Number(zona.latitud),
      Number(zona.longitud),
      cliente.latitud,
      cliente.longitud
    ) <= radio
  );
}

export function clientesDentroDeZona<T extends PuntoConCoords>(
  clientes: T[],
  zona: ZonaGeometria
): T[] {
  return clientes.filter((cliente) => clienteDentroDeZona(cliente, zona));
}

export function contarClientesEnZona(
  clientes: PuntoConCoords[],
  zona: ZonaGeometria
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

export function etiquetaTipoZona(tipo?: string | null): string {
  if (tipo === 'barrio') return 'Barrio';
  if (tipo === 'poligono') return 'Manual';
  return 'Radio';
}

export function resumenZona(zona: ZonaGeometria & { nombre?: string }): string {
  const tipo = (zona.tipo || 'radio') as TipoZona;
  if (tipo === 'radio') {
    return formatearRadio(Number(zona.radio_metros) || 0);
  }
  const n = zona.poligono?.length ?? 0;
  return `${n} pts`;
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

export const TIPOS_ZONA_UI: Array<{
  id: TipoZona;
  titulo: string;
  descripcion: string;
}> = [
  {
    id: 'radio',
    titulo: 'Radio',
    descripcion: 'Círculo desde un centro. Ideal para alcance del repartidor.',
  },
  {
    id: 'barrio',
    titulo: 'Barrio',
    descripcion: 'Detecta límites del barrio (OSM o clientes del barrio).',
  },
  {
    id: 'poligono',
    titulo: 'Manual',
    descripcion: 'Trazá los puntos a mano sobre el mapa.',
  },
];
