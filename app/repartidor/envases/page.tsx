"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CubeIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  ClienteBasico,
  ResumenEnvases,
  MovimientoEnvaseDetalle,
} from '@/lib/services/repartidorRapidoService';

type ClienteConEnvases = ClienteBasico & { cantidad_envases: number };

export default function EnvasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteParam = searchParams.get('cliente');

  const [clientes, setClientes] = useState<ClienteConEnvases[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConEnvases | null>(null);
  const [resumen, setResumen] = useState<ResumenEnvases | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoEnvaseDetalle[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    let mounted = true;

    const cargar = async () => {
      setCargando(true);
      setError('');

      try {
        const data = await repartidorRapidoService.obtenerTodosClientes();
        if (!mounted) return;

        const clientesConEnvases = data
          .map((cliente) => ({
            ...cliente,
            cantidad_envases: (cliente.envases_prestados || []).reduce(
              (total, envase) => total + (Number(envase.cantidad) || 0),
              0
            ),
          }))
          .filter((cliente) => cliente.cantidad_envases > 0)
          .sort((a, b) => b.cantidad_envases - a.cantidad_envases);

        setClientes(clientesConEnvases);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'No se pudo cargar el estado de envases.');
      } finally {
        if (mounted) setCargando(false);
      }
    };

    cargar();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!clienteParam || clientes.length === 0) return;
    const cliente = clientes.find((item) => item.id === Number(clienteParam));
    if (cliente) {
      void abrirDetalle(cliente);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteParam, clientes]);

  const abrirDetalle = async (cliente: ClienteConEnvases) => {
    setClienteSeleccionado(cliente);
    setCargandoDetalle(true);

    try {
      const [resumenData, movimientosData] = await Promise.all([
        repartidorRapidoService.obtenerResumenEnvases(cliente.id),
        repartidorRapidoService.obtenerMovimientosEnvases(cliente.id, { page: 1, limit: 20 }),
      ]);

      setResumen(resumenData);
      setMovimientos(movimientosData.movimientos);
    } catch {
      setResumen(null);
      setMovimientos([]);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const clientesFiltrados = useMemo(
    () =>
      clientes.filter((cliente) => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return true;

        return (
          cliente.nombre.toLowerCase().includes(termino) ||
          (cliente.direccion || '').toLowerCase().includes(termino) ||
          (cliente.telefono || '').toLowerCase().includes(termino)
        );
      }),
    [clientes, busqueda]
  );

  const totalEnvases = useMemo(
    () => clientes.reduce((total, cliente) => total + cliente.cantidad_envases, 0),
    [clientes]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Envases por cliente</h1>
        <p className="mt-2 text-sm text-gray-600">
          Seguimiento real de saldos de envases y movimientos recientes.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clientes con envases</p>
              <p className="text-2xl font-bold text-blue-600">{clientes.length}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Envases prestados</p>
              <p className="text-2xl font-bold text-indigo-600">{totalEnvases}</p>
            </div>
            <CubeIcon className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gestión operativa</p>
              <p className="text-sm font-semibold text-amber-700">Alta, devolución y ajuste</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, dirección o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900">Clientes con envases activos</h2>
          </div>

          {cargando ? (
            <div className="p-6 text-sm text-gray-500">Cargando clientes...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No hay clientes con envases pendientes.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => abrirDetalle(cliente)}
                  className={`w-full p-6 text-left transition-colors hover:bg-gray-50 ${
                    clienteSeleccionado?.id === cliente.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {cliente.direccion || 'Sin dirección cargada'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{cliente.telefono || 'Sin teléfono'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Envases</p>
                      <p className="font-bold text-blue-600">{cliente.cantidad_envases}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-xl bg-white p-6 shadow-sm">
          {!clienteSeleccionado ? (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              Seleccioná un cliente para ver su saldo actual y sus movimientos de envases.
            </div>
          ) : cargandoDetalle ? (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Cargando detalle...
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{clienteSeleccionado.nombre}</h2>
                <p className="text-sm text-gray-500">{clienteSeleccionado.direccion}</p>
              </div>

              {resumen && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Saldo actual</p>
                      <p className="text-2xl font-bold text-blue-600">{resumen.cantidad_total}</p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resumen.saldo_actual.map((item) => (
                      <span
                        key={item.producto_id}
                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {item.producto_nombre}: {item.cantidad}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() =>
                  router.push(`/repartidor/rapido?cliente=${clienteSeleccionado.id}&accion=envases`)
                }
                className="w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700"
              >
                Gestionar envases
              </button>

              <div>
                <h3 className="font-semibold text-gray-900">Últimos movimientos</h3>
                <div className="mt-3 space-y-2">
                  {movimientos.length === 0 ? (
                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                      No hay movimientos recientes.
                    </p>
                  ) : (
                    movimientos.map((movimiento) => (
                      <div key={movimiento.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {movimiento.producto_nombre} · {movimiento.tipo}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(movimiento.fecha_movimiento).toLocaleString('es-AR')}
                            </p>
                            {movimiento.observaciones && (
                              <p className="mt-1 text-xs text-gray-600">{movimiento.observaciones}</p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {movimiento.cantidad > 0 ? '+' : ''}
                            {movimiento.cantidad}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
