'use client';

import React from 'react';
import { ChatBubbleLeftRightIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export type TipoPieResumen = 'venta' | 'fiado' | 'cobro' | 'envase' | 'exito';

type PieResumenOperacionProps = {
  tipo: TipoPieResumen;
  clienteNombre?: string;
  saldoActual?: number;
  totalEnvases?: number;
  montoTotal?: number;
  montoPagado?: number;
  saldoProyectado?: number;
  montoCobro?: number;
  itemsOperacion?: number;
  mensajeExito?: string;
  mostrarWhatsapp?: boolean;
  whatsappInvalido?: boolean;
  onConfirmar?: () => void;
  onCancelar?: () => void;
  onWhatsapp?: () => void;
  confirmarLabel?: string;
  confirmarDisabled?: boolean;
  cargando?: boolean;
  mostrarHintNav?: boolean;
};

function formatearMonto(valor: number) {
  return `$${Math.round(valor).toLocaleString('es-AR')}`;
}

export default function PieResumenOperacion({
  tipo,
  clienteNombre,
  saldoActual = 0,
  totalEnvases = 0,
  montoTotal = 0,
  montoPagado,
  saldoProyectado,
  montoCobro = 0,
  itemsOperacion = 0,
  mensajeExito,
  mostrarWhatsapp = false,
  whatsappInvalido = false,
  onConfirmar,
  onCancelar,
  onWhatsapp,
  confirmarLabel = 'Confirmar',
  confirmarDisabled = false,
  cargando = false,
  mostrarHintNav = true,
}: PieResumenOperacionProps) {
  const esExito = tipo === 'exito';
  const saldoFinal =
    saldoProyectado ??
    (tipo === 'cobro' ? Math.max(0, saldoActual - montoCobro) : saldoActual);

  return (
    <div
      className={`relative z-30 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.12)] ${
        esExito ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
        {mostrarHintNav && !esExito && !onCancelar && (
          <p className="flex gap-1 justify-center items-center text-xs text-gray-500">
            <ChevronUpIcon className="w-4 h-4" />
            Deslizá hacia arriba para ver el menú inferior
          </p>
        )}

        {esExito && mensajeExito && (
          <p className="text-sm font-semibold text-center text-green-800">{mensajeExito}</p>
        )}

        {!esExito && clienteNombre && (
          <p className="text-xs font-medium text-center text-gray-500 truncate">{clienteNombre}</p>
        )}

        {!esExito && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500">Saldo actual</p>
              <p
                className={`font-bold tabular-nums ${
                  saldoActual > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatearMonto(saldoActual)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-500">Envases</p>
              <p className="font-bold text-blue-700 tabular-nums">{totalEnvases} u.</p>
            </div>

            {(tipo === 'venta' || tipo === 'fiado') && itemsOperacion > 0 && (
              <>
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500">
                    {tipo === 'venta' ? 'Total venta' : 'Total fiado'}
                  </p>
                  <p className="font-bold text-gray-900 tabular-nums">{formatearMonto(montoTotal)}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500">
                    {tipo === 'venta' ? 'Saldo final' : 'Saldo proyectado'}
                  </p>
                  <p
                    className={`font-bold tabular-nums ${
                      saldoFinal > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatearMonto(saldoFinal)}
                  </p>
                </div>
                {tipo === 'venta' && montoPagado != null && montoPagado > 0 && (
                  <div className="col-span-2 p-2 rounded-lg border border-blue-100 bg-blue-50">
                    <p className="text-xs text-blue-700">Pagado en esta venta</p>
                    <p className="font-bold text-blue-900 tabular-nums">
                      {formatearMonto(montoPagado)}
                    </p>
                  </div>
                )}
              </>
            )}

            {tipo === 'envase' && itemsOperacion > 0 && (
              <div className="col-span-2 p-2 rounded-lg border border-teal-100 bg-teal-50">
                <p className="text-xs text-teal-700">Ítems en este movimiento</p>
                <p className="font-bold text-teal-900 tabular-nums">{itemsOperacion}</p>
              </div>
            )}

            {tipo === 'cobro' && montoCobro > 0 && (
              <>
                <div className="p-2 rounded-lg border border-green-100 bg-green-50">
                  <p className="text-xs text-green-700">Cobro</p>
                  <p className="font-bold text-green-800 tabular-nums">
                    {formatearMonto(montoCobro)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500">Saldo después</p>
                  <p
                    className={`font-bold tabular-nums ${
                      saldoFinal > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatearMonto(saldoFinal)}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {esExito && !mostrarWhatsapp && whatsappInvalido && (
          <p className="text-xs text-center text-green-900">
            Agregá un teléfono válido al cliente para enviar el resumen por WhatsApp.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {!esExito && onCancelar && onConfirmar && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelar}
                disabled={cargando}
                className="flex-1 px-4 py-3.5 text-base font-semibold text-gray-800 bg-gray-200 rounded-xl hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirmar}
                disabled={confirmarDisabled || cargando}
                className="flex-1 px-4 py-3.5 text-base font-semibold text-white bg-teal-600 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700"
              >
                {cargando ? 'Guardando...' : confirmarLabel}
              </button>
            </div>
          )}

          {mostrarWhatsapp && onWhatsapp && (
            <button
              type="button"
              onClick={onWhatsapp}
              className="flex gap-2 justify-center items-center px-4 py-3 w-full text-sm font-semibold text-white bg-[#25D366] rounded-xl hover:bg-[#1ebe57]"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Enviar resumen por WhatsApp
            </button>
          )}

          {!esExito && onConfirmar && !onCancelar && (
            <button
              type="button"
              onClick={onConfirmar}
              disabled={confirmarDisabled || cargando}
              className="px-4 py-3.5 w-full text-base font-semibold text-white bg-teal-600 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700"
            >
              {cargando ? 'Guardando...' : confirmarLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
