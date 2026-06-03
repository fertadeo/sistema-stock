'use client';

import React, { useEffect, useState } from 'react';
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import {
  abrirWhatsAppConMensaje,
  construirMensajeReporteCliente,
  normalizarTelefonoWhatsApp,
  OPCIONES_REPORTE_WHATSAPP_DEFECTO,
  type DatosEstadoCuentaWhatsApp,
  type MovimientoReporteWhatsApp,
  type OpcionesReporteWhatsApp,
} from '@/lib/whatsappResumenCliente';
import { repartidorRapidoService } from '@/lib/services/repartidorRapidoService';

type ModalReporteWhatsAppProps = {
  abierto: boolean;
  onCerrar: () => void;
  telefono: string;
  datos: DatosEstadoCuentaWhatsApp;
  clienteId: number;
  onErrorTelefono?: (mensaje: string) => void;
};

export default function ModalReporteWhatsApp({
  abierto,
  onCerrar,
  telefono,
  datos,
  clienteId,
  onErrorTelefono,
}: ModalReporteWhatsAppProps) {
  const [opciones, setOpciones] = useState<OpcionesReporteWhatsApp>(OPCIONES_REPORTE_WHATSAPP_DEFECTO);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [movimientos, setMovimientos] = useState<MovimientoReporteWhatsApp[]>([]);

  useEffect(() => {
    if (!abierto) {
      setOpciones(OPCIONES_REPORTE_WHATSAPP_DEFECTO);
      setMovimientos([]);
      return;
    }

    if (!opciones.incluirMovimientos || opciones.tipo === 'simple') {
      setMovimientos([]);
      return;
    }

    let mounted = true;
    setCargandoMovimientos(true);

    repartidorRapidoService
      .obtenerMovimientosOperativosCliente(clienteId, datos.clienteNombre)
      .then((lista) => {
        if (!mounted) return;
        setMovimientos(
          lista.map((m) => ({
            categoria: m.categoria,
            fecha: m.fecha,
            titulo: m.titulo,
            subtitulo: m.subtitulo,
            monto: m.monto,
            esCredito: m.esCredito,
            detalleExtra: m.detalleExtra,
          }))
        );
      })
      .catch(() => {
        if (mounted) setMovimientos([]);
      })
      .finally(() => {
        if (mounted) setCargandoMovimientos(false);
      });

    return () => {
      mounted = false;
    };
  }, [abierto, clienteId, datos.clienteNombre, opciones.incluirMovimientos, opciones.tipo]);

  if (!abierto) return null;

  const telefonoValido = Boolean(normalizarTelefonoWhatsApp(telefono));

  const enviar = () => {
    if (!telefonoValido) {
      onErrorTelefono?.('El teléfono del cliente no es válido para WhatsApp.');
      return;
    }
    const mensaje = construirMensajeReporteCliente(datos, opciones, movimientos);
    const ok = abrirWhatsAppConMensaje(telefono, mensaje);
    if (!ok) {
      onErrorTelefono?.('No se pudo abrir WhatsApp.');
      return;
    }
    onCerrar();
  };

  const setTipo = (tipo: OpcionesReporteWhatsApp['tipo']) => {
    if (tipo === 'simple') {
      setOpciones({ tipo: 'simple', incluirMovimientos: false, incluirEnvases: false });
    } else {
      setOpciones({ tipo: 'completo', incluirMovimientos: true, incluirEnvases: true });
    }
  };

  return (
    <div className="flex fixed inset-0 z-[75] justify-center items-end p-0 bg-black/50 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Enviar reporte por WhatsApp</h2>
          <button type="button" onClick={onCerrar} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Se abrirá tu <strong>WhatsApp personal</strong> con el mensaje listo para {datos.clienteNombre}.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">Tipo de reporte</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setTipo('simple')}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  opciones.tipo === 'simple'
                    ? 'border-[#25D366] bg-[#e8f8ee]'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <p className="font-semibold text-gray-900">Simple (recomendado)</p>
                <p className="mt-1 text-xs text-gray-600">
                  Saldo y cantidad de envases, mensaje breve.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTipo('completo')}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  opciones.tipo === 'completo'
                    ? 'border-[#25D366] bg-[#e8f8ee]'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <p className="font-semibold text-gray-900">Completo</p>
                <p className="mt-1 text-xs text-gray-600">
                  Detalle de cuenta con opciones de movimientos y envases.
                </p>
              </button>
            </div>
          </div>

          {opciones.tipo === 'completo' && (
            <div className="p-3 space-y-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-800">Incluir en el mensaje</p>
              <label className="flex gap-3 items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={opciones.incluirMovimientos}
                  onChange={(e) =>
                    setOpciones((prev) => ({ ...prev, incluirMovimientos: e.target.checked }))
                  }
                  className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Listado de movimientos (hasta 25 recientes)</span>
              </label>
              <label className="flex gap-3 items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={opciones.incluirEnvases}
                  onChange={(e) =>
                    setOpciones((prev) => ({ ...prev, incluirEnvases: e.target.checked }))
                  }
                  className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Detalle de envases prestados</span>
              </label>
              {opciones.incluirMovimientos && cargandoMovimientos && (
                <p className="text-xs text-gray-500">Cargando movimientos...</p>
              )}
              {opciones.incluirMovimientos && !cargandoMovimientos && (
                <p className="text-xs text-gray-500">{movimientos.length} movimientos disponibles</p>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200">
          {telefonoValido ? (
            <button
              type="button"
              onClick={enviar}
              className="flex gap-2 justify-center items-center px-4 py-3.5 w-full text-sm font-semibold text-white bg-[#25D366] rounded-xl hover:bg-[#1ebe57]"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Abrir WhatsApp y enviar
            </button>
          ) : (
            <p className="text-sm text-center text-amber-800">
              Cargá un teléfono válido en la ficha del cliente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
