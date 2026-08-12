import { authFetch } from '@/lib/api/fetchWithAuth';

export interface ZonaRadio {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  radio_metros: number;
  color: string;
  repartidor: string | null;
  activo: boolean;
  creado_at?: string;
  actualizado_at?: string;
}

export type ZonaRadioInput = {
  nombre: string;
  latitud: number;
  longitud: number;
  radio_metros: number;
  color?: string;
  repartidor?: string | null;
  activo?: boolean;
};

function apiBase(): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/api/zonas-radio`;
}

function normalizarZona(raw: Record<string, unknown>): ZonaRadio {
  return {
    id: Number(raw.id),
    nombre: String(raw.nombre ?? ''),
    latitud: Number(raw.latitud),
    longitud: Number(raw.longitud),
    radio_metros: Number(raw.radio_metros),
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
      throw new Error('Error al obtener zonas de radio');
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map((z) => normalizarZona(z)) : [];
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
