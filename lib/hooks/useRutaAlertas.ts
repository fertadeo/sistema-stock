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
  const disparadasRef = useRef<Set<number>>(new Set());
  const pushServidorRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!activo) return;

    let cancelado = false;

    const revisar = async () => {
      try {
        if (pushServidorRef.current === null) {
          const estado = await repartidorRutaService.obtenerEstadoPush();
          if (cancelado) return;
          pushServidorRef.current = estado.vapid_configurado;
        }

        // Con push del servidor, el cron del backend envía y marca "enviada"
        if (pushServidorRef.current) return;

        const paradas = await repartidorRutaService.listarParadas();
        if (cancelado) return;

        for (const parada of paradas) {
          if (!debeDispararAlerta(parada)) continue;
          if (disparadasRef.current.has(parada.id)) continue;

          const nombre = parada.cliente?.nombre || 'Cliente';
          const direccion = parada.cliente?.direccion || '';
          const comentario = parada.comentario ? ` — ${parada.comentario}` : '';

          const mostrada = await mostrarNotificacionLocal(`Visita programada: ${nombre}`, {
            body: `${direccion}${comentario}`.trim(),
            tag: `ruta-parada-${parada.id}`,
            url: `/repartidor/rapido?cliente=${parada.cliente_id}`,
          });

          if (mostrada) {
            disparadasRef.current.add(parada.id);
            await repartidorRutaService.marcarAlertaEnviada(parada.id);
          }
        }
      } catch {
        // reintenta en el próximo ciclo
      }
    };

    void revisar();
    const interval = setInterval(revisar, 15_000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [activo]);
}
