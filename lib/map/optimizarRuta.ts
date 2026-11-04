import { distanciaMetros } from '@/lib/map/zonaRadio';

/** Mismo punto de partida que el mapa de zonas/repartos. */
export const ORIGEN_RUTA = {
  latitud: -33.141709,
  longitud: -64.3634274,
} as const;

export type PuntoRuta = {
  id: number;
  latitud: number;
  longitud: number;
};

/**
 * Ordena clientes con el algoritmo del vecino más cercano
 * partiendo desde la empresa (misma lógica que zonasyrepartos).
 */
export function optimizarRutaVecinoMasCercano<T extends PuntoRuta>(
  lista: T[],
  origen: { latitud: number; longitud: number } = ORIGEN_RUTA
): T[] {
  if (lista.length === 0) return [];

  const ruta: T[] = [];
  const noVisitados = [...lista];
  let puntoActual = { latitud: origen.latitud, longitud: origen.longitud };

  while (noVisitados.length > 0) {
    let idxMasCercano = 0;
    let distanciaMinima = distanciaMetros(
      puntoActual.latitud,
      puntoActual.longitud,
      noVisitados[0].latitud,
      noVisitados[0].longitud
    );

    for (let i = 1; i < noVisitados.length; i++) {
      const distancia = distanciaMetros(
        puntoActual.latitud,
        puntoActual.longitud,
        noVisitados[i].latitud,
        noVisitados[i].longitud
      );
      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        idxMasCercano = i;
      }
    }

    const siguiente = noVisitados.splice(idxMasCercano, 1)[0];
    ruta.push(siguiente);
    puntoActual = {
      latitud: siguiente.latitud,
      longitud: siguiente.longitud,
    };
  }

  return ruta;
}
