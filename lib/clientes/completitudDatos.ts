import { tieneCoordenadasValidas } from '@/lib/map/clienteCoords';

export type CampoCompletitud = 'nombre' | 'telefono' | 'direccion' | 'coordenadas';

export const ETIQUETAS_CAMPO: Record<CampoCompletitud, string> = {
  nombre: 'Nombre',
  telefono: 'Teléfono',
  direccion: 'Dirección',
  coordenadas: 'Coordenadas (Google Maps)',
};

export interface ResultadoCompletitud {
  porcentaje: number;
  completos: CampoCompletitud[];
  faltantes: CampoCompletitud[];
}

function tieneTexto(val: unknown): boolean {
  return typeof val === 'string' && val.trim().length > 0;
}

export function calcularCompletitudCliente(cliente: {
  nombre?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  latitud?: unknown;
  longitud?: unknown;
}): ResultadoCompletitud {
  const campos: { key: CampoCompletitud; ok: boolean }[] = [
    { key: 'nombre', ok: tieneTexto(cliente.nombre) },
    { key: 'telefono', ok: tieneTexto(cliente.telefono) },
    { key: 'direccion', ok: tieneTexto(cliente.direccion) },
    {
      key: 'coordenadas',
      ok: tieneCoordenadasValidas(cliente.latitud, cliente.longitud) !== null,
    },
  ];

  const completos = campos.filter((c) => c.ok).map((c) => c.key);
  const faltantes = campos.filter((c) => !c.ok).map((c) => c.key);
  const porcentaje = Math.round((completos.length / campos.length) * 100);

  return { porcentaje, completos, faltantes };
}

export function colorCompletitud(porcentaje: number): {
  barra: string;
  texto: string;
  fondo: string;
} {
  if (porcentaje === 100) {
    return { barra: 'bg-green-500', texto: 'text-green-700', fondo: 'bg-green-50' };
  }
  if (porcentaje >= 75) {
    return { barra: 'bg-teal-500', texto: 'text-teal-700', fondo: 'bg-teal-50' };
  }
  if (porcentaje >= 50) {
    return { barra: 'bg-amber-500', texto: 'text-amber-700', fondo: 'bg-amber-50' };
  }
  if (porcentaje >= 25) {
    return { barra: 'bg-orange-500', texto: 'text-orange-700', fondo: 'bg-orange-50' };
  }
  return { barra: 'bg-red-500', texto: 'text-red-700', fondo: 'bg-red-50' };
}
