'use client';

import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import type { DatosEstadoCuentaWhatsApp } from '@/lib/whatsappResumenCliente';
import ModalReporteWhatsApp from '@/components/repartidor/ModalReporteWhatsApp';

type BarraEnviarEstadoWhatsAppProps = {
  datos: DatosEstadoCuentaWhatsApp;
  telefono: string;
  clienteId: number;
  className?: string;
  onErrorTelefono?: (mensaje: string) => void;
};

export default function BarraEnviarEstadoWhatsApp({
  datos,
  telefono,
  clienteId,
  className = '',
  onErrorTelefono,
}: BarraEnviarEstadoWhatsAppProps) {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <>
      <div
        className={`border-t border-[#25D366]/30 bg-[#e8f8ee] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${className}`}
      >
        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="mb-2 text-xs text-center text-gray-600">
            Reporte de cuenta · WhatsApp personal
          </p>
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex gap-2 justify-center items-center px-4 py-3.5 w-full text-sm font-semibold text-white bg-[#25D366] rounded-xl hover:bg-[#1ebe57] active:bg-[#128C7E]"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Enviar reporte por WhatsApp
          </button>
        </div>
      </div>

      <ModalReporteWhatsApp
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        telefono={telefono}
        datos={datos}
        clienteId={clienteId}
        onErrorTelefono={onErrorTelefono}
      />
    </>
  );
}
