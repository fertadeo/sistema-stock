import { authFetch } from '@/lib/api/fetchWithAuth';

export interface CoordenadasGeocodificadas {
  latitud: string;
  longitud: string;
  direccion?: string;
}

export async function geocodificarDireccion(
  direccion: string
): Promise<CoordenadasGeocodificadas | null> {
  const query = direccion.trim();
  if (query.length < 3) return null;

  try {
    const response = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/geocode/search?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const resultado = data[0];
    if (!resultado?.lat || !resultado?.lon) return null;

    return {
      latitud: String(resultado.lat),
      longitud: String(resultado.lon),
      direccion: resultado.formatted_address || resultado.display_name || query,
    };
  } catch {
    return null;
  }
}
