'use client';

import React, { useState } from 'react';
import {
  COLORES_ZONA,
  RADIO_MAX_METROS,
  RADIO_MIN_METROS,
  TIPOS_ZONA_UI,
  TipoZona,
  formatearRadio,
} from '@/lib/map/zonaRadio';

export type BarrioOption = { id: number; nombre: string };
export type RepartidorOption = { id: number; nombre: string };

type Props = {
  /** sidebar = panel izquierdo (desktop). dock = barra inferior compacta (mobile). */
  layout: 'sidebar' | 'dock';
  modoCrear: boolean;
  tipoCreacion: TipoZona;
  tipoActivo: TipoZona;
  formNombre: string;
  formRadio: number;
  formRepartidor: string;
  formColor: string;
  formBarrio: string;
  puntosPoligono: number;
  clientesEnZona: number | null;
  guardando: boolean;
  cargandoLimites: boolean;
  mensajeLimites: string | null;
  puedeGuardar: boolean;
  barrios: BarrioOption[];
  repartidores: RepartidorOption[];
  onCancelar: () => void;
  onSeleccionarTipo: (tipo: TipoZona) => void;
  onNombreChange: (v: string) => void;
  onRadioChange: (v: number) => void;
  onRepartidorChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onBarrioChange: (v: string) => void;
  onDetectarBarrio: () => void;
  onDeshacerPunto: () => void;
  onLimpiarPoligono: () => void;
  onGuardar: () => void;
  onEliminar?: () => void;
  /** En dock: ir al mapa tras una acción (mobile). */
  onIrAlMapa?: () => void;
};

function hintFor(tipo: TipoZona): string {
  if (tipo === 'radio') return 'En el mapa: tocá para ubicar el centro';
  if (tipo === 'poligono') return 'En el mapa: tocá para agregar vértices (mín. 3)';
  return 'Detectá límites y revisá el contorno en el mapa';
}

export default function ZonaComposer({
  layout,
  modoCrear,
  tipoCreacion,
  tipoActivo,
  formNombre,
  formRadio,
  formRepartidor,
  formColor,
  formBarrio,
  puntosPoligono,
  clientesEnZona,
  guardando,
  cargandoLimites,
  mensajeLimites,
  puedeGuardar,
  barrios,
  repartidores,
  onCancelar,
  onSeleccionarTipo,
  onNombreChange,
  onRadioChange,
  onRepartidorChange,
  onColorChange,
  onBarrioChange,
  onDetectarBarrio,
  onDeshacerPunto,
  onLimpiarPoligono,
  onGuardar,
  onEliminar,
  onIrAlMapa,
}: Props) {
  const [masOpciones, setMasOpciones] = useState(false);
  // Empieza colapsado para no tapar el mapa; se expande si el usuario lo pide.
  const [dockExpandido, setDockExpandido] = useState(false);
  const hint = hintFor(tipoActivo);
  const uid = layout === 'sidebar' ? 'side' : 'dock';

  const formBody = (
    <div className="space-y-2.5">
      {modoCrear && (
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
          {TIPOS_ZONA_UI.map((opt) => {
            const activo = tipoCreacion === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSeleccionarTipo(opt.id)}
                className={`rounded-lg px-1 py-2 text-center transition ${
                  activo
                    ? 'bg-white text-teal-800 shadow-sm ring-1 ring-teal-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="block text-[11px] font-bold">{opt.titulo}</span>
              </button>
            );
          })}
        </div>
      )}

      <div>
        <label className="sr-only" htmlFor={`${uid}-zonaNombre`}>
          Nombre
        </label>
        <input
          id={`${uid}-zonaNombre`}
          type="text"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          value={formNombre}
          onChange={(e) => onNombreChange(e.target.value)}
          disabled={guardando}
          placeholder="Nombre de la zona"
        />
      </div>

      {tipoActivo === 'radio' && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-semibold text-gray-700" htmlFor={`${uid}-zonaRadio`}>
              Radio
            </label>
            <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-teal-800 shadow-sm">
              {formatearRadio(formRadio)}
            </span>
          </div>
          <input
            id={`${uid}-zonaRadio`}
            type="range"
            min={RADIO_MIN_METROS}
            max={RADIO_MAX_METROS}
            step={50}
            className="w-full accent-teal-600"
            value={formRadio}
            onChange={(e) => onRadioChange(Number(e.target.value))}
            disabled={guardando}
          />
        </div>
      )}

      {tipoActivo === 'barrio' && (
        <div className="space-y-2">
          <label className="sr-only" htmlFor={`${uid}-zonaBarrio`}>
            Barrio
          </label>
          <select
            id={`${uid}-zonaBarrio`}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
            value={formBarrio}
            onChange={(e) => onBarrioChange(e.target.value)}
            disabled={guardando || cargandoLimites || !modoCrear}
          >
            <option value="">Seleccioná un barrio…</option>
            {barrios.map((b) => (
              <option key={b.id} value={b.nombre}>
                {b.nombre}
              </option>
            ))}
          </select>
          {modoCrear && (
            <button
              type="button"
              className="w-full rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              onClick={onDetectarBarrio}
              disabled={!formBarrio || cargandoLimites || guardando}
            >
              {cargandoLimites ? 'Detectando límites…' : 'Detectar límites automáticamente'}
            </button>
          )}
          {mensajeLimites && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-950">
              {mensajeLimites}
            </p>
          )}
          {puntosPoligono > 0 && (
            <p className="text-[11px] font-medium text-gray-600">
              Contorno: {puntosPoligono} vértices
            </p>
          )}
        </div>
      )}

      {tipoActivo === 'poligono' && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2">
          <div>
            <p className="text-xs font-bold text-violet-900">{puntosPoligono} puntos</p>
            <p className="text-[10px] text-violet-700">Mínimo 3 para guardar</p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm disabled:opacity-40"
              onClick={onDeshacerPunto}
              disabled={puntosPoligono === 0 || guardando}
            >
              Deshacer
            </button>
            <button
              type="button"
              className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm disabled:opacity-40"
              onClick={onLimpiarPoligono}
              disabled={puntosPoligono === 0 || guardando}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800"
        onClick={() => setMasOpciones((v) => !v)}
      >
        <span>Repartidor y color</span>
        <span aria-hidden>{masOpciones ? '▴' : '▾'}</span>
      </button>

      {masOpciones && (
        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
          <label className="sr-only" htmlFor={`${uid}-zonaRepartidor`}>
            Repartidor
          </label>
          <select
            id={`${uid}-zonaRepartidor`}
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm"
            value={formRepartidor}
            onChange={(e) => onRepartidorChange(e.target.value)}
            disabled={guardando}
          >
            <option value="">Sin repartidor</option>
            {repartidores.map((rep) => (
              <option key={rep.id} value={rep.nombre}>
                {rep.nombre}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Color de la zona">
            {COLORES_ZONA.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Color ${color}`}
                aria-pressed={formColor === color}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  formColor === color ? 'border-gray-900 scale-110' : 'border-white shadow'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
                disabled={guardando}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-0.5">
        {layout === 'sidebar' && onIrAlMapa && (
          <button
            type="button"
            className="w-full rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 lg:hidden"
            onClick={onIrAlMapa}
          >
            Ver mapa para dibujar →
          </button>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl bg-teal-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
            onClick={onGuardar}
            disabled={guardando || !puedeGuardar}
          >
            {guardando ? 'Guardando…' : modoCrear ? 'Guardar zona' : 'Guardar cambios'}
          </button>
          {!modoCrear && onEliminar && (
            <button
              type="button"
              className="rounded-xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              onClick={onEliminar}
              disabled={guardando}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (layout === 'sidebar') {
    return (
      <div className="overflow-hidden rounded-xl border border-teal-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-2 border-b border-teal-100 bg-teal-50/80 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
              {modoCrear ? 'Nueva zona' : 'Editar zona'}
            </p>
            <p className="truncate text-sm font-bold text-gray-900">
              {formNombre.trim() || 'Sin nombre'}
            </p>
            <p className="mt-0.5 text-[11px] text-teal-800/80">{hint}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {clientesEnZona != null && (
              <div className="rounded-lg bg-teal-700 px-2.5 py-1 text-center text-white shadow-sm">
                <p className="text-base font-bold leading-none">{clientesEnZona}</p>
                <p className="text-[9px] leading-tight opacity-90">clientes</p>
              </div>
            )}
            <button
              type="button"
              onClick={onCancelar}
              disabled={guardando}
              className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              aria-label="Cerrar editor"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-3">{formBody}</div>
      </div>
    );
  }

  // layout === 'dock' (mobile): barra fina; el mapa queda mayormente libre
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {dockExpandido && (
        <div className="mx-2 mb-2 max-h-[42dvh] overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-xl backdrop-blur-md">
          {formBody}
        </div>
      )}

      <div className="border-t border-gray-200 bg-white/95 px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="mb-1.5 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-600">{hint}</p>
          <button
            type="button"
            className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700"
            onClick={() => setDockExpandido((v) => !v)}
          >
            {dockExpandido ? 'Ocultar' : 'Opciones'}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2">
          {clientesEnZona != null && (
            <div className="rounded-lg bg-teal-700 px-2 py-1 text-center text-white">
              <span className="text-sm font-bold">{clientesEnZona}</span>
              <span className="ml-1 text-[10px] opacity-90">cli.</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-gray-900">
              {modoCrear ? 'Nueva' : 'Editando'}: {formNombre.trim() || 'zona'}
            </p>
            <p className="truncate text-[10px] text-gray-500 capitalize">{tipoActivo}</p>
          </div>
          {tipoActivo === 'poligono' && (
            <button
              type="button"
              className="rounded-lg bg-violet-100 px-2 py-1.5 text-[11px] font-semibold text-violet-800 disabled:opacity-40"
              onClick={onDeshacerPunto}
              disabled={puntosPoligono === 0 || guardando}
            >
              Deshacer
            </button>
          )}
          <button
            type="button"
            className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            onClick={onGuardar}
            disabled={guardando || !puedeGuardar}
          >
            {guardando ? '…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Chip mínimo sobre el mapa: no tapa el dibujo. */
export function ZonaMapHint({ tipo }: { tipo: TipoZona }) {
  return (
    <div className="pointer-events-none absolute top-3 left-1/2 z-20 -translate-x-1/2 max-w-[90%]">
      <div className="rounded-full bg-gray-900/80 px-3 py-1.5 text-center text-[11px] font-medium text-white shadow-lg backdrop-blur-sm">
        {hintFor(tipo)}
      </div>
    </div>
  );
}
