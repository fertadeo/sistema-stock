export function parseCoordenada(value: unknown): number | null {
  if (value == null || value === '') return null;
  const numero = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(numero)) return null;
  return numero;
}

export function tieneCoordenadasValidas(
  latitud: unknown,
  longitud: unknown
): { latitud: number; longitud: number } | null {
  const lat = parseCoordenada(latitud);
  const lng = parseCoordenada(longitud);
  if (lat === null || lng === null) return null;
  if (lat === 0 && lng === 0) return null;
  return { latitud: lat, longitud: lng };
}

export function normalizarClienteConCoords<T extends { latitud: unknown; longitud: unknown }>(
  cliente: T
): (T & { latitud: number; longitud: number }) | null {
  const coords = tieneCoordenadasValidas(cliente.latitud, cliente.longitud);
  if (!coords) return null;
  return {
    ...cliente,
    latitud: coords.latitud,
    longitud: coords.longitud,
  };
}
