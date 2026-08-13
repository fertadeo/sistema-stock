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
};

/**
 * Editor flotante sobre el mapa: bottom sheet en mobile, card en desktop.
 * Mantiene mapa + controles visibles a la vez.
 */
export default function ZonaComposer({
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
}: Props) {
  const [masOpciones, setMasOpciones] = useState(false);

  const hint =
    tipoActivo === 'radio'
      ? 'Tocá el mapa para ubicar el centro'
      : tipoActivo === 'poligono'
        ? 'Tocá el mapa para agregar vértices (mín. 3)'
        : 'Elegí el barrio y detectá sus límites';

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end lg:inset-auto lg:bottom-auto lg:left-3 lg:top-3 lg:w-[min(100%-1.5rem,360px)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Chip de instrucción: no tapa el mapa */}
      <div className="pointer-events-none mb-2 flex justify-center px-3 lg:justify-start">
        <div className="rounded-full bg-gray-900/85 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-sm">
          {hint}
        </div>
      </div>

      <div className="pointer-events-auto mx-0 overflow-hidden rounded-t-2xl border border-gray-200/80 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md lg:mx-0 lg:rounded-2xl lg:shadow-xl">
        {/* Handle mobile */}
        <div className="flex justify-center pt-2 lg:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-3 pb-2 pt-1 lg:pt-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
              {modoCrear ? 'Nueva zona' : 'Editar zona'}
            </p>
            <p className="truncate text-sm font-bold text-gray-900">
              {formNombre.trim() || 'Sin nombre'}
            </p>
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
              className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              aria-label="Cerrar editor"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[min(48dvh,420px)] space-y-2.5 overflow-y-auto px-3 pb-3 lg:max-h-[min(70vh,560px)]">
          {/* Tipos: solo al crear */}
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

          {/* Fila principal: nombre */}
          <div>
            <label className="sr-only" htmlFor="composerZonaNombre">
              Nombre
            </label>
            <input
              id="composerZonaNombre"
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              value={formNombre}
              onChange={(e) => onNombreChange(e.target.value)}
              disabled={guardando}
              placeholder="Nombre de la zona"
            />
          </div>

          {/* Controles por tipo */}
          {tipoActivo === 'radio' && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-700" htmlFor="composerZonaRadio">
                  Radio
                </label>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-teal-800 shadow-sm">
                  {formatearRadio(formRadio)}
                </span>
              </div>
              <input
                id="composerZonaRadio"
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
              <label className="sr-only" htmlFor="composerZonaBarrio">
                Barrio
              </label>
              <select
                id="composerZonaBarrio"
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

          {/* Opciones secundarias colapsables */}
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
              <label className="sr-only" htmlFor="composerZonaRepartidor">
                Repartidor
              </label>
              <select
                id="composerZonaRepartidor"
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
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="Color de la zona"
              >
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

          {/* Acciones */}
          <div className="flex gap-2 pt-0.5">
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
    </div>
  );
}
