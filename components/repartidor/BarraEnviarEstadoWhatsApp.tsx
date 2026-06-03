'use client';

import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import {
  abrirWhatsAppConMensaje,
  construirMensajeEstadoCuentaCliente,
  normalizarTelefonoWhatsApp,
  type DatosEstadoCuentaWhatsApp,
} from '@/lib/whatsappResumenCliente';

type BarraEnviarEstadoWhatsAppProps = {
  datos: DatosEstadoCuentaWhatsApp;
  telefono: string;
  className?: string;
  onErrorTelefono?: (mensaje: string) => void;
};

export default function BarraEnviarEstadoWhatsApp({
  datos,
  telefono,
  className = '',
  onErrorTelefono,
}: BarraEnviarEstadoWhatsAppProps) {
  const telefonoValido = Boolean(normalizarTelefonoWhatsApp(telefono));

  const enviar = () => {
    if (!telefonoValido) {
      onErrorTelefono?.(
        'El teléfono del cliente no es válido para WhatsApp. Revisá el número en la ficha.'
      );
      return;
    }
    const mensaje = construirMensajeEstadoCuentaCliente(datos);
    const ok = abrirWhatsAppConMensaje(telefono, mensaje);
    if (!ok) {
      onErrorTelefono?.('No se pudo abrir WhatsApp. Verificá el teléfono del cliente.');
    }
  };

  return (
    <div
      className={`border-t border-[#25D366]/30 bg-[#e8f8ee] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-xs text-center text-gray-600">
          Reporte de cuenta y envases · se abre con tu WhatsApp personal
        </p>
        {telefonoValido ? (
          <button
            type="button"
            onClick={enviar}
            className="flex gap-2 justify-center items-center px-4 py-3.5 w-full text-sm font-semibold text-white bg-[#25D366] rounded-xl hover:bg-[#1ebe57] active:bg-[#128C7E]"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Enviar estado de cuenta por WhatsApp
          </button>
        ) : (
          <p className="text-xs text-center text-amber-800">
            Cargá un teléfono válido en la ficha del cliente para enviar el reporte.
          </p>
        )}
      </div>
    </div>
  );
}
