export const MARKER_ICONS = {
  gris: 'http://maps.google.com/mapfiles/ms/icons/grey-dot.png',
  empresa: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
} as const;

const MARKER_ICON_URLS = [
  'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/lightblue-dot.png',
] as const;

export const LEGEND_COLOR_CLASSES = [
  'bg-blue-500',
  'bg-green-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-sky-400',
] as const;

export type RepartidorPaletteItem = {
  nombre: string;
  iconUrl: string;
  legendClass: string;
};

export function buildRepartidorPalette(nombres: string[]): RepartidorPaletteItem[] {
  return nombres.map((nombre, index) => ({
    nombre,
    iconUrl: MARKER_ICON_URLS[index % MARKER_ICON_URLS.length],
    legendClass: LEGEND_COLOR_CLASSES[index % LEGEND_COLOR_CLASSES.length],
  }));
}

function normalizeRepartidorName(name: string): string {
  return name.trim().toLowerCase();
}

export function nombresCoinciden(a: string, b: string): boolean {
  const nombreA = normalizeRepartidorName(a);
  const nombreB = normalizeRepartidorName(b);
  if (!nombreA || !nombreB) return false;
  if (nombreA === nombreB) return true;
  return nombreA.includes(nombreB) || nombreB.includes(nombreA);
}

export function coincideRepartidor(clienteRepartidor: string, filtroRepartidor: string): boolean {
  if (!filtroRepartidor || filtroRepartidor === 'todos') return true;
  if (!clienteRepartidor?.trim()) return false;
  return nombresCoinciden(clienteRepartidor, filtroRepartidor);
}

function findPaletteItem(
  repartidor: string,
  palette: RepartidorPaletteItem[]
): RepartidorPaletteItem | undefined {
  return palette.find((item) => nombresCoinciden(repartidor, item.nombre));
}

export function getRepartidorIcon(
  repartidor: string,
  palette: RepartidorPaletteItem[] = []
): string {
  const item = findPaletteItem(repartidor, palette);
  if (item) return item.iconUrl;
  if (palette.length > 0) return palette[0].iconUrl;
  return MARKER_ICON_URLS[0];
}

interface ClienteMapa {
  id: number;
  repartidor: string;
}

export function getMarkerIcon(
  cliente: ClienteMapa,
  options: {
    repartidorSeleccionado?: string;
    mostrarRuta?: boolean;
    enRuta?: boolean;
    atendido?: boolean;
    palette?: RepartidorPaletteItem[];
  }
): string {
  const { repartidorSeleccionado, mostrarRuta, enRuta, atendido, palette = [] } = options;

  if (mostrarRuta && enRuta) {
    if (!atendido) {
      return MARKER_ICONS.gris;
    }
    const repartidorColor =
      repartidorSeleccionado && repartidorSeleccionado !== 'todos'
        ? repartidorSeleccionado
        : cliente.repartidor;
    return getRepartidorIcon(repartidorColor, palette);
  }

  if (repartidorSeleccionado) {
    if (!coincideRepartidor(cliente.repartidor, repartidorSeleccionado) && cliente.repartidor?.trim()) {
      return MARKER_ICONS.gris;
    }
  } else if (!cliente.repartidor?.trim()) {
    return MARKER_ICONS.gris;
  }

  return getRepartidorIcon(cliente.repartidor, palette);
}
