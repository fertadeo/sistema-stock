'use client';

import React from 'react';
import type { ZonaRadio } from '@/lib/services/zonaRadioService';
import {
  etiquetaTipoZona,
  resumenZona,
} from '@/lib/map/zonaRadio';

export type Props = {
  zonas: ZonaRadio[];
  contadores: Map<number, number>;
  zonaSeleccionadaId: number | null;
  modoCrear: boolean;
  disabled?: boolean;
  onIniciarCrear: () => void;
  onSeleccionarZona: (id: number | null) => void;
};

function BadgeTipo({ tipo }: { tipo?: string | null }) {
  const label = etiquetaTipoZona(tipo);
  const styles =
    tipo === 'barrio'
      ? 'bg-amber-100 text-amber-800'
      : tipo === 'poligono'
        ? 'bg-violet-100 text-violet-800'
        : 'bg-sky-100 text-sky-800';
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}>
      {label}
    </span>
  );
}

/** Lista compacta de zonas para el panel lateral. La edición vive sobre el mapa. */
export default function ZonasLista({
  zonas,
  contadores,
  zonaSeleccionadaId,
  modoCrear,
  disabled = false,
  onIniciarCrear,
  onSeleccionarZona,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white px-3 py-2.5">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Zonas de reparto</h3>
          <p className="text-[11px] text-gray-500">
            {zonas.length} zona{zonas.length === 1 ? '' : 's'} · se editan sobre el mapa
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          onClick={onIniciarCrear}
          disabled={disabled || modoCrear}
        >
          + Nueva
        </button>
      </div>

      <ul className="max-h-56 space-y-1 overflow-y-auto p-2">
        {zonas.length === 0 && (
          <li className="rounded-lg border border-dashed border-gray-200 px-3 py-5 text-center text-xs text-gray-500">
            Creá una zona con radio, barrio o trazado manual. El editor se abre sobre el mapa.
          </li>
        )}
        {zonas.map((zona) => {
          const count = contadores.get(zona.id) ?? 0;
          const activa = zonaSeleccionadaId === zona.id && !modoCrear;
          return (
            <li key={zona.id}>
              <button
                type="button"
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                  activa
                    ? 'bg-teal-100 ring-1 ring-teal-400'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => onSeleccionarZona(activa ? null : zona.id)}
                disabled={modoCrear}
              >
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white shadow"
                  style={{ backgroundColor: zona.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-gray-900">{zona.nombre}</span>
                    <BadgeTipo tipo={zona.tipo} />
                  </span>
                  <span className="mt-0.5 block text-[11px] text-gray-500">
                    {count} clientes · {resumenZona(zona)}
                    {zona.repartidor ? ` · ${zona.repartidor}` : ''}
                  </span>
                </span>
                <span className="text-[10px] font-semibold text-teal-700 shrink-0">Editar</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
