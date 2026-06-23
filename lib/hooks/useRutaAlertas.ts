'use client';

import { useEffect, useRef } from 'react';
import {
  repartidorRutaService,
  mostrarNotificacionLocal,
  type RutaParada,
} from '@/lib/services/repartidorRutaService';

function horaActualHHMM(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

function debeDispararAlerta(parada: RutaParada): boolean {
  if (!parada.hora_alerta || parada.alerta_enviada || parada.visitado) return false;
  return parada.hora_alerta <= horaActualHHMM();
}

export function useRutaAlertas(activo: boolean) {
  const paradasRef = useRef<RutaParada[]>([]);
  const disparadasRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!activo) return;

    let cancelado = false;

    const revisar = async () => {
      try {
        const paradas = await repartidorRutaService.listarParadas();
        if (cancelado) return;
        paradasRef.current = paradas;

        for (const parada of paradas) {
          if (!debeDispararAlerta(parada)) continue;
          if (disparadasRef.current.has(parada.id)) continue;

          disparadasRef.current.add(parada.id);
          const nombre = parada.cliente?.nombre || 'Cliente';
          const direccion = parada.cliente?.direccion || '';
          const comentario = parada.comentario ? ` — ${parada.comentario}` : '';

          mostrarNotificacionLocal(`Visita programada: ${nombre}`, {
            body: `${direccion}${comentario}`.trim(),
            tag: `ruta-parada-${parada.id}`,
            url: `/repartidor/rapido?cliente=${parada.cliente_id}`,
          });

          void repartidorRutaService.marcarAlertaEnviada(parada.id);
        }
      } catch {
        // silencioso: reintenta en el próximo ciclo
      }
    };

    void revisar();
    const interval = setInterval(revisar, 30_000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [activo]);
}
