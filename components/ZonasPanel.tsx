'use client';

import React from 'react';
import type { ZonaRadio } from '@/lib/services/zonaRadioService';
import {
  COLORES_ZONA,
  RADIO_DEFAULT_METROS,
  RADIO_MAX_METROS,
  RADIO_MIN_METROS,
  TIPOS_ZONA_UI,
  TipoZona,
  etiquetaTipoZona,
  formatearRadio,
  resumenZona,
} from '@/lib/map/zonaRadio';

export type BarrioOption = { id: number; nombre: string };

export type RepartidorOption = { id: number; nombre: string };

type Props = {
  zonas: ZonaRadio[];
  contadores: Map<number, number>;
  repartidores: RepartidorOption[];
  barrios: BarrioOption[];
  zonaSeleccionadaId: number | null;
  modoCrear: boolean;
  tipoCreacion: TipoZona;
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
  disabled?: boolean;
  onIniciarCrear: () => void;
  onCancelar: () => void;
  onSeleccionarTipo: (tipo: TipoZona) => void;
  onSeleccionarZona: (id: number | null) => void;
  onNombreChange: (v: string) => void;
  onRadioChange: (v: number) => void;
  onRepartidorChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onBarrioChange: (v: string) => void;
  onDetectarBarrio: () => void;
  onDeshacerPunto: () => void;
  onLimpiarPoligono: () => void;
  onGuardar: () => void;
  onEliminar: () => void;
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

export default function ZonasPanel({
  zonas,
  contadores,
  repartidores,
  barrios,
  zonaSeleccionadaId,
  modoCrear,
  tipoCreacion,
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
  disabled = false,
  onIniciarCrear,
  onCancelar,
  onSeleccionarTipo,
  onSeleccionarZona,
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
  const editando = modoCrear || zonaSeleccionadaId != null;
  const tipoActivo = modoCrear
    ? tipoCreacion
    : zonas.find((z) => z.id === zonaSeleccionadaId)?.tipo || 'radio';

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white px-3 py-2.5">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Zonas de reparto</h3>
          <p className="text-[11px] text-gray-500">Radio · Barrio · Trazado manual</p>
        </div>
        {!modoCrear ? (
          <button
            type="button"
            className="shrink-0 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            onClick={onIniciarCrear}
            disabled={disabled || guardando}
          >
            + Nueva
          </button>
        ) : (
          <button
            type="button"
            className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="space-y-3 p-3">
        {modoCrear && (
          <div className="grid grid-cols-3 gap-1.5">
            {TIPOS_ZONA_UI.map((opt) => {
              const activo = tipoCreacion === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSeleccionarTipo(opt.id)}
                  className={`rounded-lg border px-1.5 py-2 text-left transition ${
                    activo
                      ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-400'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[11px] font-bold text-gray-900">{opt.titulo}</span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-gray-500">
                    {opt.descripcion}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {editando && (
          <div className="space-y-2.5 rounded-lg border border-teal-100 bg-teal-50/40 p-2.5">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-700" htmlFor="zonaNombre">
                Nombre
              </label>
              <input
                id="zonaNombre"
                type="text"
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                value={formNombre}
                onChange={(e) => onNombreChange(e.target.value)}
                disabled={guardando}
                placeholder="Ej: Zona Norte"
              />
            </div>

            {tipoActivo === 'radio' && (
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-700" htmlFor="zonaRadio">
                  Radio: {formatearRadio(formRadio)}
                </label>
                <input
                  id="zonaRadio"
                  type="range"
                  min={RADIO_MIN_METROS}
                  max={RADIO_MAX_METROS}
                  step={50}
                  className="w-full accent-teal-600"
                  value={formRadio}
                  onChange={(e) => onRadioChange(Number(e.target.value))}
                  disabled={guardando}
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Tocá el mapa para ubicar el centro{modoCrear ? '' : ' o arrastrá el marcador'}.
                </p>
              </div>
            )}

            {tipoActivo === 'barrio' && (
              <div className="space-y-2">
                <label className="mb-1 block text-[11px] font-semibold text-gray-700" htmlFor="zonaBarrio">
                  Barrio
                </label>
                <select
                  id="zonaBarrio"
                  className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm"
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
                    className="w-full rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                    onClick={onDetectarBarrio}
                    disabled={!formBarrio || cargandoLimites || guardando}
                  >
                    {cargandoLimites ? 'Detectando límites…' : 'Detectar límites automáticamente'}
                  </button>
                )}
                {mensajeLimites && (
                  <p className="rounded-md bg-white/80 px-2 py-1.5 text-[11px] text-amber-900 border border-amber-200">
                    {mensajeLimites}
                  </p>
                )}
                {puntosPoligono > 0 && (
                  <p className="text-[11px] font-medium text-gray-700">
                    Contorno: {puntosPoligono} vértices. Podés ajustarlos arrastrando en el mapa tras guardar.
                  </p>
                )}
              </div>
            )}

            {tipoActivo === 'poligono' && (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-600">
                  Tocá el mapa para agregar vértices. Necesitás al menos 3 puntos.
                </p>
                <div className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1.5 text-xs border border-gray-200">
                  <span className="font-semibold text-gray-800">{puntosPoligono} puntos</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                      onClick={onDeshacerPunto}
                      disabled={puntosPoligono === 0 || guardando}
                    >
                      Deshacer
                    </button>
                    <button
                      type="button"
                      className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                      onClick={onLimpiarPoligono}
                      disabled={puntosPoligono === 0 || guardando}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-gray-700" htmlFor="zonaRepartidor">
                Repartidor
              </label>
              <select
                id="zonaRepartidor"
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm"
                value={formRepartidor}
                onChange={(e) => onRepartidorChange(e.target.value)}
                disabled={guardando}
              >
                <option value="">Sin asignar</option>
                {repartidores.map((rep) => (
                  <option key={rep.id} value={rep.nombre}>
                    {rep.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p id="zonaColorLabel" className="mb-1 text-[11px] font-semibold text-gray-700">
                Color
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="zonaColorLabel">
                {COLORES_ZONA.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    aria-label={`Color ${color}`}
                    aria-pressed={formColor === color}
                    className={`h-6 w-6 rounded-full border-2 ${
                      formColor === color ? 'border-gray-900 scale-110' : 'border-white shadow'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onColorChange(color)}
                    disabled={guardando}
                  />
                ))}
              </div>
            </div>

            {clientesEnZona != null && (
              <div className="rounded-lg bg-teal-700 px-3 py-2 text-center text-white shadow-sm">
                <p className="text-lg font-bold leading-none">{clientesEnZona}</p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  cliente{clientesEnZona === 1 ? '' : 's'} dentro de la zona
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                onClick={onGuardar}
                disabled={guardando || !puedeGuardar}
              >
                {guardando ? 'Guardando…' : modoCrear ? 'Guardar zona' : 'Guardar cambios'}
              </button>
              {!modoCrear && zonaSeleccionadaId != null && (
                <button
                  type="button"
                  className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                  onClick={onEliminar}
                  disabled={guardando}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        )}

        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {zonas.length === 0 && (
            <li className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-500">
              Todavía no hay zonas. Creá una con radio, barrio o trazado manual.
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
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export { RADIO_DEFAULT_METROS };
