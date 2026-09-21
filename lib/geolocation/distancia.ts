/**
 * Calcula la distancia en metros entre dos puntos GPS usando la fórmula de Haversine.
 */
export function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
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

/**
 * Radio por defecto para búsqueda de clientes cercanos en metros.
 * ~200m es una distancia razonable para un par de cuadras en Río Cuarto.
 */
export const RADIO_BUSQUEDA_CERCANOS_METROS = 200;

/**
 * Radio máximo configurable en metros.
 */
export const RADIO_MAXIMO_METROS = 500;

/**
 * Formatea una distancia en metros a un string legible.
 * Si es menos de 1000m, muestra en metros, sino en kilómetros.
 */
export function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)}m`;
  }
  return `${(metros / 1000).toFixed(1)}km`;
}
