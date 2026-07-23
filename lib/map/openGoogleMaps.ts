/** Abre Google Maps (app nativa o web) con coordenadas o dirección. */
export function buildGoogleMapsUrl(options: {
  latitud?: number | null;
  longitud?: number | null;
  direccion?: string | null;
}): string | null {
  const { latitud, longitud, direccion } = options;
  const lat = typeof latitud === 'number' ? latitud : Number(latitud);
  const lng = typeof longitud === 'number' ? longitud : Number(longitud);

  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const texto = (direccion || '').trim();
  if (texto) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
  }

  return null;
}

export function openInGoogleMaps(options: {
  latitud?: number | null;
  longitud?: number | null;
  direccion?: string | null;
}): boolean {
  const url = buildGoogleMapsUrl(options);
  if (!url || typeof window === 'undefined') return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
