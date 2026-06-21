export const MARKER_ICONS = {
  axel: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  gustavo: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  david: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  gris: 'http://maps.google.com/mapfiles/ms/icons/grey-dot.png',
  empresa: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
} as const;

export function coincideRepartidor(clienteRepartidor: string, filtroRepartidor: string): boolean {
  if (!filtroRepartidor || filtroRepartidor === 'todos') return true;
  if (!clienteRepartidor?.trim()) return false;
  if (
    filtroRepartidor.toLowerCase().includes('david') &&
    clienteRepartidor.toLowerCase().includes('david')
  ) {
    return true;
  }
  return clienteRepartidor.trim().toLowerCase() === filtroRepartidor.trim().toLowerCase();
}

export function getRepartidorIcon(repartidor: string): string {
  if (repartidor === 'Gustavo Careaga') return MARKER_ICONS.gustavo;
  if (repartidor?.toLowerCase().includes('david')) return MARKER_ICONS.david;
  if (repartidor === 'Axel Torres') return MARKER_ICONS.axel;
  return MARKER_ICONS.axel;
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
  }
): string {
  const { repartidorSeleccionado, mostrarRuta, enRuta, atendido } = options;

  if (mostrarRuta && enRuta) {
    if (!atendido) {
      return MARKER_ICONS.gris;
    }
    const repartidorColor =
      repartidorSeleccionado && repartidorSeleccionado !== 'todos'
        ? repartidorSeleccionado
        : cliente.repartidor;
    return getRepartidorIcon(repartidorColor);
  }

  if (repartidorSeleccionado) {
    if (!coincideRepartidor(cliente.repartidor, repartidorSeleccionado) && cliente.repartidor?.trim()) {
      return MARKER_ICONS.gris;
    }
  } else if (!cliente.repartidor?.trim()) {
    return MARKER_ICONS.gris;
  }

  return getRepartidorIcon(cliente.repartidor);
}
