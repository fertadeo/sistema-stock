'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import {
  avisoRepartidorService,
  AvisoRepartidor,
} from '@/lib/services/avisoRepartidorService';

export default function AvisosCampana() {
  const [abierto, setAbierto] = useState(false);
  const [avisos, setAvisos] = useState<AvisoRepartidor[]>([]);
  const [noLeidos, setNoLeidos] = useState(0);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await avisoRepartidorService.listar();
      setAvisos(data.avisos);
      setNoLeidos(data.no_leidos);
    } catch {
      // silencioso: campana opcional
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const t = setInterval(() => void cargar(), 60_000);
    return () => clearInterval(t);
  }, [cargar]);

  const toggle = async () => {
    const next = !abierto;
    setAbierto(next);
    if (next) {
      await cargar();
    }
  };

  const marcarTodos = async () => {
    await avisoRepartidorService.marcarTodosLeidos();
    await cargar();
  };

  const marcarUno = async (id: number) => {
    await avisoRepartidorService.marcarLeido(id);
    await cargar();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        aria-label="Avisos"
      >
        <BellIcon className="h-6 w-6" />
        {noLeidos > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {noLeidos > 9 ? '9+' : noLeidos}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar avisos"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <p className="text-sm font-semibold text-gray-900">Avisos</p>
              {noLeidos > 0 && (
                <button
                  type="button"
                  onClick={() => void marcarTodos()}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800"
                >
                  Marcar todos
                </button>
              )}
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {cargando && avisos.length === 0 && (
                <li className="px-3 py-4 text-sm text-gray-500">Cargando…</li>
              )}
              {!cargando && avisos.length === 0 && (
                <li className="px-3 py-4 text-sm text-gray-500">Sin avisos por ahora.</li>
              )}
              {avisos.map((aviso) => (
                <li
                  key={aviso.id}
                  className={`border-b border-gray-50 px-3 py-2.5 last:border-0 ${
                    aviso.leido ? 'bg-white' : 'bg-amber-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{aviso.titulo}</p>
                  <p className="mt-0.5 text-xs text-gray-600">{aviso.mensaje}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {new Date(aviso.creado_at).toLocaleString('es-AR')}
                    </span>
                    {!aviso.leido && (
                      <button
                        type="button"
                        onClick={() => void marcarUno(aviso.id)}
                        className="text-[10px] font-medium text-teal-700"
                      >
                        Marcar leído
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
