'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  CubeIcon,
  ShoppingCartIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  MovimientoOperativoRepartidor,
  FiltroMovimientoRepartidor,
} from '@/lib/services/repartidorRapidoService';

const TABS: Array<{ key: FiltroMovimientoRepartidor; label: string }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'venta', label: 'Ventas' },
  { key: 'fiado', label: 'Fiados' },
  { key: 'cobro', label: 'Cobros' },
  { key: 'envase', label: 'Envases' },
];

const ETIQUETA_CATEGORIA: Record<Exclude<FiltroMovimientoRepartidor, 'todos'>, string> = {
  venta: 'Venta',
  fiado: 'Fiado',
  cobro: 'Cobro',
  envase: 'Envase',
};

const ESTILO_CATEGORIA: Record<Exclude<FiltroMovimientoRepartidor, 'todos'>, string> = {
  venta: 'bg-amber-100 text-amber-800 border-amber-200',
  fiado: 'bg-orange-100 text-orange-800 border-orange-200',
  cobro: 'bg-green-100 text-green-800 border-green-200',
  envase: 'bg-blue-100 text-blue-800 border-blue-200',
};

const ICONO_CATEGORIA: Record<
  Exclude<FiltroMovimientoRepartidor, 'todos'>,
  React.ComponentType<{ className?: string }>
> = {
  venta: ShoppingCartIcon,
  fiado: CreditCardIcon,
  cobro: BanknotesIcon,
  envase: CubeIcon,
};

function formatearFechaHora(fecha: string) {
  try {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fecha;
  }
}

function etiquetaGrupoFecha(fechaIso: string) {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const diffDias = Math.round((inicioHoy.getTime() - inicioFecha.getTime()) / 86400000);

  if (diffDias === 0) return 'Hoy';
  if (diffDias === 1) return 'Ayer';
  return fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

type MovimientosClienteProps = {
  clienteId: number;
  clienteNombre: string;
  onCerrar?: () => void;
  modo?: 'modal' | 'embedded';
};

export default function MovimientosCliente({
  clienteId,
  clienteNombre,
  onCerrar,
  modo = 'modal',
}: MovimientosClienteProps) {
  const [movimientos, setMovimientos] = useState<MovimientoOperativoRepartidor[]>([]);
  const [tab, setTab] = useState<FiltroMovimientoRepartidor>('todos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const data = await repartidorRapidoService.obtenerMovimientosOperativosCliente(
        clienteId,
        clienteNombre
      );
      setMovimientos(data);
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'No se pudieron cargar los movimientos del cliente.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [clienteId, clienteNombre]);

  useEffect(() => {
    void cargarMovimientos();
  }, [cargarMovimientos]);

  const movimientosFiltrados = useMemo(() => {
    if (tab === 'todos') return movimientos;
    return movimientos.filter((mov) => mov.categoria === tab);
  }, [movimientos, tab]);

  const contadores = useMemo(() => {
    const base: Record<FiltroMovimientoRepartidor, number> = {
      todos: movimientos.length,
      venta: 0,
      fiado: 0,
      cobro: 0,
      envase: 0,
    };
    for (const mov of movimientos) {
      base[mov.categoria] += 1;
    }
    return base;
  }, [movimientos]);

  const gruposPorFecha = useMemo(() => {
    const mapa = new Map<string, MovimientoOperativoRepartidor[]>();
    for (const mov of movimientosFiltrados) {
      const clave = new Date(mov.fecha).toDateString();
      const lista = mapa.get(clave) ?? [];
      lista.push(mov);
      mapa.set(clave, lista);
    }
    return Array.from(mapa.entries()).map(([clave, items]) => ({
      clave,
      etiqueta: etiquetaGrupoFecha(items[0].fecha),
      items,
    }));
  }, [movimientosFiltrados]);

  const contenido = (
    <div className={modo === 'modal' ? 'flex flex-col h-full min-h-0' : 'space-y-4'}>
      <div
        className={`flex flex-shrink-0 items-start justify-between gap-3 ${
          modo === 'modal' ? 'px-4 py-3 border-b border-gray-200 bg-white' : ''
        }`}
      >
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">Movimientos del cliente</h2>
          <p className="mt-0.5 text-sm text-gray-500 truncate">{clienteNombre}</p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void cargarMovimientos()}
            disabled={cargando}
            className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            title="Actualizar"
          >
            <ArrowPathIcon className={`w-5 h-5 ${cargando ? 'animate-spin' : ''}`} />
          </button>
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              className="p-2 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className={`flex-shrink-0 ${modo === 'modal' ? 'px-4 pt-3' : ''}`}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === item.key
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
              <span className="ml-1 opacity-80">({contadores[item.key]})</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className={
          modo === 'modal'
            ? 'overflow-y-auto flex-1 px-4 py-3 min-h-0'
            : 'rounded-xl border border-gray-200 bg-white p-4'
        }
      >
        {error && (
          <div className="p-3 mb-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-teal-500 animate-spin border-t-transparent" />
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <ClipboardDocumentListIcon className="mx-auto w-12 h-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium">Sin movimientos en esta categoría</p>
            <p className="mt-1 text-xs text-gray-400">
              Las ventas, fiados, cobros y envases de este cliente aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {gruposPorFecha.map((grupo) => (
              <section key={grupo.clave}>
                <h3 className="sticky top-0 z-[1] py-1 mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase bg-white/95">
                  {grupo.etiqueta}
                </h3>
                <ul className="space-y-2">
                  {grupo.items.map((movimiento) => {
                    const Icono = ICONO_CATEGORIA[movimiento.categoria];
                    return (
                      <li
                        key={movimiento.id}
                        className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                      >
                        <div
                          className={`flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full border ${
                            ESTILO_CATEGORIA[movimiento.categoria]
                          }`}
                        >
                          <Icono className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
                                ESTILO_CATEGORIA[movimiento.categoria]
                              }`}
                            >
                              {ETIQUETA_CATEGORIA[movimiento.categoria]}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatearFechaHora(movimiento.fecha)}
                            </span>
                          </div>
                          <p className="mt-1 font-medium text-gray-900">{movimiento.titulo}</p>
                          {movimiento.subtitulo && (
                            <p className="text-sm text-gray-600">{movimiento.subtitulo}</p>
                          )}
                          {movimiento.detalleExtra && (
                            <p className="mt-1 text-xs text-gray-500">{movimiento.detalleExtra}</p>
                          )}
                        </div>
                        {movimiento.monto != null && (
                          <div className="flex-shrink-0 text-right">
                            {movimiento.categoria === 'envase' ? (
                              <p className="text-base font-bold text-blue-700">
                                {movimiento.esCredito ? '−' : '+'}
                                {movimiento.monto} u.
                              </p>
                            ) : (
                              <p
                                className={`text-base font-bold tabular-nums ${
                                  movimiento.esCredito ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {movimiento.esCredito ? '+' : '−'}$
                                {movimiento.monto.toLocaleString('es-AR')}
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (modo === 'embedded') {
    return <div className="rounded-xl bg-gray-50 border border-gray-200 shadow-sm">{contenido}</div>;
  }

  return (
    <div className="flex fixed inset-0 z-[70] justify-center items-end p-0 bg-black/50 sm:items-center sm:p-4">
      <div className="bg-gray-50 rounded-t-2xl sm:rounded-2xl w-full max-w-lg h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {contenido}
      </div>
    </div>
  );
}
