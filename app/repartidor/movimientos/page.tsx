"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  MovimientoOperativoRepartidor,
  FiltroMovimientoRepartidor,
} from '@/lib/services/repartidorRapidoService';

const TABS: Array<{ key: FiltroMovimientoRepartidor; label: string }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'venta', label: 'Venta' },
  { key: 'fiado', label: 'Fiado' },
  { key: 'cobro', label: 'Cobro' },
  { key: 'envase', label: 'Envases' },
];

const ETIQUETA_CATEGORIA: Record<Exclude<FiltroMovimientoRepartidor, 'todos'>, string> = {
  venta: 'Venta',
  fiado: 'Fiado',
  cobro: 'Cobro',
  envase: 'Envase',
};

const ESTILO_CATEGORIA: Record<Exclude<FiltroMovimientoRepartidor, 'todos'>, string> = {
  venta: 'bg-yellow-100 text-yellow-800',
  fiado: 'bg-orange-100 text-orange-800',
  cobro: 'bg-green-100 text-green-800',
  envase: 'bg-blue-100 text-blue-800',
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

function MovimientosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoParam = (searchParams?.get('tipo') ?? 'todos') as FiltroMovimientoRepartidor;

  const [movimientos, setMovimientos] = useState<MovimientoOperativoRepartidor[]>([]);
  const [tab, setTab] = useState<FiltroMovimientoRepartidor>(
    TABS.some((item) => item.key === tipoParam) ? tipoParam : 'todos'
  );
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const data = await repartidorRapidoService.obtenerMovimientosOperativos();
      setMovimientos(data);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudieron cargar los movimientos.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarMovimientos();
  }, [cargarMovimientos]);

  useEffect(() => {
    if (TABS.some((item) => item.key === tipoParam)) {
      setTab(tipoParam);
    }
  }, [tipoParam]);

  const cambiarTab = (nuevoTab: FiltroMovimientoRepartidor) => {
    setTab(nuevoTab);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (nuevoTab === 'todos') {
      params.delete('tipo');
    } else {
      params.set('tipo', nuevoTab);
    }
    const query = params.toString();
    router.replace(query ? `/repartidor/movimientos?${query}` : '/repartidor/movimientos');
  };

  const movimientosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return movimientos.filter((mov) => {
      if (tab !== 'todos' && mov.categoria !== tab) return false;
      if (!termino) return true;
      const texto = [
        mov.titulo,
        mov.subtitulo,
        mov.clienteNombre,
        mov.detalleExtra,
        ETIQUETA_CATEGORIA[mov.categoria],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return texto.includes(termino);
    });
  }, [movimientos, tab, busqueda]);

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

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
            <p className="mt-2 text-sm text-gray-600">
              Ventas, fiados, cobros y préstamos o devoluciones de envases registrados en el sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void cargarMovimientos()}
            disabled={cargando}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => cambiarTab(item.key)}
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

        <div className="relative mt-4">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por cliente, descripción o producto..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm">No hay movimientos para mostrar en este filtro.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {movimientosFiltrados.map((movimiento) => (
              <li key={movimiento.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          ESTILO_CATEGORIA[movimiento.categoria]
                        }`}
                      >
                        {ETIQUETA_CATEGORIA[movimiento.categoria]}
                      </span>
                      {movimiento.clienteNombre && (
                        <span className="truncate text-xs font-medium text-teal-700">
                          {movimiento.clienteNombre}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-medium text-gray-900">{movimiento.titulo}</p>
                    {movimiento.subtitulo && (
                      <p className="text-sm text-gray-600">{movimiento.subtitulo}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">{formatearFechaHora(movimiento.fecha)}</p>
                    {movimiento.detalleExtra && (
                      <p className="mt-1 text-xs text-gray-500">{movimiento.detalleExtra}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {movimiento.monto != null && movimiento.categoria !== 'envase' && (
                      <p
                        className={`text-lg font-bold ${
                          movimiento.esCredito ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {movimiento.esCredito ? '+' : '-'}$
                        {movimiento.monto.toLocaleString('es-AR')}
                      </p>
                    )}
                    {movimiento.categoria === 'envase' && movimiento.monto != null && (
                      <p className="text-lg font-bold text-blue-700">
                        {movimiento.esCredito ? '-' : '+'}
                        {movimiento.monto} u.
                      </p>
                    )}
                    {movimiento.clienteId && (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/repartidor/rapido?cliente=${movimiento.clienteId}`)
                        }
                        className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-800"
                      >
                        Ver cliente
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function MovimientosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      }
    >
      <MovimientosPageContent />
    </Suspense>
  );
}
