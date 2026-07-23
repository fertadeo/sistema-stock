/** Abre Google Maps (app nativa o web) con coordenadas o dirección. */

type MapsTarget = {
  latitud?: number | null;
  longitud?: number | null;
  direccion?: string | null;
};

function resolveDestination(options: MapsTarget): string | null {
  const lat = typeof options.latitud === 'number' ? options.latitud : Number(options.latitud);
  const lng = typeof options.longitud === 'number' ? options.longitud : Number(options.longitud);

  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    return `${lat},${lng}`;
  }

  const texto = (options.direccion || '').trim();
  return texto || null;
}

/** Búsqueda / ficha del lugar. */
export function buildGoogleMapsUrl(options: MapsTarget): string | null {
  const destino = resolveDestination(options);
  if (!destino) return null;

  if (destino.includes(',') && !destino.includes(' ')) {
    const [lat, lng] = destino.split(',');
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}`;
}

/** Navegación / “cómo llegar” (abre la app de Maps en el celular). */
export function buildGoogleMapsDirectionsUrl(options: MapsTarget): string | null {
  const destino = resolveDestination(options);
  if (!destino) return null;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&travelmode=driving`;
}

export function openInGoogleMaps(options: MapsTarget): boolean {
  const url = buildGoogleMapsUrl(options);
  if (!url || typeof window === 'undefined') return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function openGoogleMapsNavigation(options: MapsTarget): boolean {
  const url = buildGoogleMapsDirectionsUrl(options);
  if (!url || typeof window === 'undefined') return false;
  // location.assign favorece abrir la app nativa en Android/iOS frente a un tab vacío.
  window.location.assign(url);
  return true;
}
