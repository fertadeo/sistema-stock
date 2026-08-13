import { authFetch } from '@/lib/api/fetchWithAuth';
import type { PuntoMapa, TipoZona } from '@/lib/map/zonaRadio';

export interface ZonaRadio {
  id: number;
  nombre: string;
  tipo: TipoZona;
  latitud: number;
  longitud: number;
  radio_metros: number | null;
  poligono: PuntoMapa[] | null;
  barrio_nombre: string | null;
  origen_limites: string | null;
  color: string;
  repartidor: string | null;
  activo: boolean;
  creado_at?: string;
  actualizado_at?: string;
}

export type ZonaRadioInput = {
  nombre: string;
  tipo: TipoZona;
  latitud?: number;
  longitud?: number;
  radio_metros?: number | null;
  poligono?: PuntoMapa[] | null;
  barrio_nombre?: string | null;
  origen_limites?: string | null;
  color?: string;
  repartidor?: string | null;
  activo?: boolean;
};

export type LimitesBarrioResponse = {
  barrio: string;
  poligono: PuntoMapa[];
  centro: PuntoMapa;
  fuente: 'osm' | 'clientes';
  clientes_usados: number;
  mensaje: string;
};

function apiBase(): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/api/zonas-radio`;
}

function parsePoligono(raw: unknown): PuntoMapa[] | null {
  if (!raw) return null;
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value)) return null;
  const puntos: PuntoMapa[] = [];
  for (const p of value) {
    if (!p || typeof p !== 'object') continue;
    const lat = Number((p as PuntoMapa).lat);
    const lng = Number((p as PuntoMapa).lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    puntos.push({ lat, lng });
  }
  return puntos.length >= 3 ? puntos : null;
}

function normalizarZona(raw: Record<string, unknown>): ZonaRadio {
  const tipoRaw = String(raw.tipo || 'radio');
  const tipo: TipoZona =
    tipoRaw === 'barrio' || tipoRaw === 'poligono' ? tipoRaw : 'radio';

  return {
    id: Number(raw.id),
    nombre: String(raw.nombre ?? ''),
    tipo,
    latitud: Number(raw.latitud),
    longitud: Number(raw.longitud),
    radio_metros:
      raw.radio_metros == null || raw.radio_metros === ''
        ? null
        : Number(raw.radio_metros),
    poligono: parsePoligono(raw.poligono),
    barrio_nombre: typeof raw.barrio_nombre === 'string' ? raw.barrio_nombre : null,
    origen_limites:
      typeof raw.origen_limites === 'string' ? raw.origen_limites : null,
    color: typeof raw.color === 'string' && raw.color ? raw.color : '#0d9488',
    repartidor: typeof raw.repartidor === 'string' ? raw.repartidor : null,
    activo: Boolean(raw.activo),
    creado_at: typeof raw.creado_at === 'string' ? raw.creado_at : undefined,
    actualizado_at:
      typeof raw.actualizado_at === 'string' ? raw.actualizado_at : undefined,
  };
}

export const zonaRadioService = {
  async listar(): Promise<ZonaRadio[]> {
    const response = await authFetch(apiBase());
    if (!response.ok) {
      throw new Error('Error al obtener zonas');
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map((z) => normalizarZona(z)) : [];
  },

  async limitesBarrio(barrio: string): Promise<LimitesBarrioResponse> {
    const response = await authFetch(`${apiBase()}/limites-barrio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barrio }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Error al obtener límites del barrio');
    }
    const data = await response.json();
    return {
      barrio: String(data.barrio ?? barrio),
      poligono: parsePoligono(data.poligono) || [],
      centro: {
        lat: Number(data.centro?.lat),
        lng: Number(data.centro?.lng),
      },
      fuente: data.fuente === 'clientes' ? 'clientes' : 'osm',
      clientes_usados: Number(data.clientes_usados ?? 0),
      mensaje: String(data.mensaje ?? ''),
    };
  },

  async crear(input: ZonaRadioInput): Promise<ZonaRadio> {
    const response = await authFetch(apiBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Error al crear zona');
    }
    return normalizarZona(await response.json());
  },

  async actualizar(id: number, input: Partial<ZonaRadioInput>): Promise<ZonaRadio> {
    const response = await authFetch(`${apiBase()}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Error al actualizar zona');
    }
    return normalizarZona(await response.json());
  },

  async eliminar(id: number): Promise<void> {
    const response = await authFetch(`${apiBase()}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Error al eliminar zona');
    }
  },
};
