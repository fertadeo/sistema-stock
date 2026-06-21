import {
  createPinIcon,
  MarkerIconConfig,
  PIN_ICONS,
  REPARTIDOR_PIN_COLORS,
} from './markerPinIcon';
import { clienteCoincideFiltros, FiltrosCliente } from './clienteFiltros';

export type { MarkerIconConfig };
export const MARKER_ICONS = PIN_ICONS;

export const LEGEND_COLOR_CLASSES = [
  'bg-blue-600',
  'bg-green-600',
  'bg-red-600',
  'bg-purple-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-cyan-600',
  'bg-indigo-600',
] as const;

export type RepartidorPaletteItem = {
  nombre: string;
  color: string;
  icon: MarkerIconConfig;
  legendClass: string;
};

export function buildRepartidorPalette(nombres: Array<string | null | undefined>): RepartidorPaletteItem[] {
  return nombres
    .map((nombre) => (typeof nombre === 'string' ? nombre.trim() : ''))
    .filter((nombre): nombre is string => nombre.length > 0)
    .map((nombre, index) => {
    const color = REPARTIDOR_PIN_COLORS[index % REPARTIDOR_PIN_COLORS.length];
    return {
      nombre,
      color,
      icon: createPinIcon(color, 'cliente'),
      legendClass: LEGEND_COLOR_CLASSES[index % LEGEND_COLOR_CLASSES.length],
    };
  });
}

function normalizeRepartidorName(name: string | null | undefined): string {
  if (name == null || typeof name !== 'string') return '';
  return name.trim().toLowerCase();
}

export function nombresCoinciden(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const nombreA = normalizeRepartidorName(a);
  const nombreB = normalizeRepartidorName(b);
  if (!nombreA || !nombreB) return false;
  if (nombreA === nombreB) return true;
  return nombreA.includes(nombreB) || nombreB.includes(nombreA);
}

export function coincideRepartidor(
  clienteRepartidor: string | null | undefined,
  filtroRepartidor: string | null | undefined
): boolean {
  if (!filtroRepartidor || filtroRepartidor === 'todos') return true;
  if (!clienteRepartidor?.trim()) return false;
  return nombresCoinciden(clienteRepartidor, filtroRepartidor);
}

function findPaletteItem(
  repartidor: string | null | undefined,
  palette: RepartidorPaletteItem[]
): RepartidorPaletteItem | undefined {
  if (!normalizeRepartidorName(repartidor)) return undefined;
  return palette.find((item) => nombresCoinciden(repartidor, item.nombre));
}

export function getRepartidorIcon(
  repartidor: string | null | undefined,
  palette: RepartidorPaletteItem[] = []
): MarkerIconConfig {
  if (!normalizeRepartidorName(repartidor)) {
    return MARKER_ICONS.gris;
  }
  const item = findPaletteItem(repartidor, palette);
  if (item) return item.icon;
  if (palette.length > 0) return palette[0].icon;
  return createPinIcon(REPARTIDOR_PIN_COLORS[0], 'cliente');
}

interface ClienteMapa {
  id: number;
  repartidor?: string | null;
  dia_reparto?: string | null;
  zona?: string | number | null;
  nombre?: string | null;
  direccion?: string | null;
  telefono?: string | null;
}

export function getMarkerIcon(
  cliente: ClienteMapa,
  options: {
    filtros?: FiltrosCliente;
    mostrarRuta?: boolean;
    seguirRecorrido?: boolean;
    enRuta?: boolean;
    atendido?: boolean;
    palette?: RepartidorPaletteItem[];
    incluidoManualmente?: boolean;
  }
): MarkerIconConfig {
  const {
    filtros,
    mostrarRuta,
    seguirRecorrido,
    enRuta,
    atendido,
    palette = [],
    incluidoManualmente = false,
  } = options;

  const coincide =
    incluidoManualmente || !filtros || clienteCoincideFiltros(cliente, filtros);

  if (seguirRecorrido && coincide) {
    if (!atendido) {
      return MARKER_ICONS.gris;
    }
    const repartidorColor =
      filtros?.repartidor && filtros.repartidor !== 'todos'
        ? filtros.repartidor
        : cliente.repartidor;
    return getRepartidorIcon(repartidorColor, palette);
  }

  if (mostrarRuta && enRuta) {
    if (!atendido) {
      return MARKER_ICONS.gris;
    }
    const repartidorColor =
      filtros?.repartidor && filtros.repartidor !== 'todos'
        ? filtros.repartidor
        : cliente.repartidor;
    return getRepartidorIcon(repartidorColor, palette);
  }

  if (!coincide) {
    return MARKER_ICONS.gris;
  }
  if (!cliente.repartidor?.trim()) {
    return MARKER_ICONS.gris;
  }

  return getRepartidorIcon(cliente.repartidor, palette);
}
