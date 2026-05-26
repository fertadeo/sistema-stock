"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  ClienteDeudor,
  CuentaCorrienteResumen,
  MovimientoCuentaCorriente,
} from '@/lib/services/repartidorRapidoService';

export default function FiadosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteParam = searchParams.get('cliente');

  const [deudores, setDeudores] = useState<ClienteDeudor[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDeudor | null>(null);
  const [resumen, setResumen] = useState<CuentaCorrienteResumen | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCuentaCorriente[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    let mounted = true;

    const cargar = async () => {
      setCargando(true);
      setError('');

      try {
        const response = await repartidorRapidoService.obtenerClientesDeudores({
          search: busqueda.trim() || undefined,
          page: 1,
          limit: 100,
        });

        if (!mounted) return;
        setDeudores(response.clientes);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'No se pudo cargar la lista de deudores.');
      } finally {
        if (mounted) setCargando(false);
      }
    };

    cargar();
    return () => {
      mounted = false;
    };
  }, [busqueda]);

  useEffect(() => {
    if (!clienteParam || deudores.length === 0) return;
    const cliente = deudores.find((item) => item.cliente_id === Number(clienteParam));
    if (cliente) {
      void abrirDetalle(cliente);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteParam, deudores]);

  const abrirDetalle = async (cliente: ClienteDeudor) => {
    setClienteSeleccionado(cliente);
    setCargandoDetalle(true);
    try {
      const data = await repartidorRapidoService.obtenerCuentaCorriente(cliente.cliente_id, {
        page: 1,
        limit: 20,
      });
      setResumen(data.resumen);
      setMovimientos(data.movimientos);
    } catch {
      setResumen(null);
      setMovimientos([]);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const resumenGeneral = useMemo(
    () => ({
      totalPendiente: deudores.reduce((total, cliente) => total + cliente.saldo_actual, 0),
      totalClientes: deudores.length,
      promedio: deudores.length
        ? deudores.reduce((total, cliente) => total + cliente.saldo_actual, 0) / deudores.length
        : 0,
      maximo: deudores.reduce((maximo, cliente) => Math.max(maximo, cliente.saldo_actual), 0),
    }),
    [deudores]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Clientes con deuda</h1>
        <p className="mt-2 text-sm text-gray-600">
          Cuenta corriente real desde backend para consultar saldos y avanzar a cobros.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saldo total</p>
              <p className="text-2xl font-bold text-red-600">
                ${resumenGeneral.totalPendiente.toLocaleString('es-AR')}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clientes deudores</p>
              <p className="text-2xl font-bold text-orange-600">{resumenGeneral.totalClientes}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Promedio por cliente</p>
              <p className="text-2xl font-bold text-blue-600">
                ${Math.round(resumenGeneral.promedio).toLocaleString('es-AR')}
              </p>
            </div>
            <CreditCardIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Mayor saldo</p>
              <p className="text-2xl font-bold text-amber-600">
                ${resumenGeneral.maximo.toLocaleString('es-AR')}
              </p>
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
            placeholder="Buscar por nombre, dirección o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900">Listado de deudores</h2>
          </div>
          {cargando ? (
            <div className="p-6 text-sm text-gray-500">Cargando deudores...</div>
          ) : deudores.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No hay clientes con deuda.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {deudores.map((cliente) => (
                <button
                  key={cliente.cliente_id}
                  onClick={() => abrirDetalle(cliente)}
                  className={`w-full p-6 text-left transition-colors hover:bg-gray-50 ${
                    clienteSeleccionado?.cliente_id === cliente.cliente_id ? 'bg-gray-50' : ''
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
                      <p className="text-xs text-gray-500">Saldo actual</p>
                      <p className="font-bold text-red-600">
                        ${cliente.saldo_actual.toLocaleString('es-AR')}
                      </p>
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
              Seleccioná un cliente para ver su cuenta corriente y avanzar al cobro.
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs text-red-600">Saldo</p>
                    <p className="font-bold text-red-700">
                      ${resumen.saldo_actual.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Movimientos</p>
                    <p className="font-bold text-gray-800">{resumen.cantidad_movimientos}</p>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3">
                    <p className="text-xs text-orange-600">Débitos</p>
                    <p className="font-bold text-orange-700">
                      ${resumen.total_debitos.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs text-green-600">Créditos</p>
                    <p className="font-bold text-green-700">
                      ${resumen.total_creditos.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() =>
                    router.push(`/repartidor/rapido?cliente=${clienteSeleccionado.cliente_id}&accion=cobro`)
                  }
                  className="w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700"
                >
                  Registrar cobro
                </button>
                <button
                  onClick={() =>
                    router.push(`/repartidor/rapido?cliente=${clienteSeleccionado.cliente_id}`)
                  }
                  className="w-full rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 hover:bg-gray-200"
                >
                  Abrir ficha en Repartidor Rápido
                </button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Últimos movimientos</h3>
                <div className="mt-3 space-y-2">
                  {movimientos.length === 0 ? (
                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                      No hay movimientos recientes.
                    </p>
                  ) : (
                    movimientos.slice(0, 8).map((movimiento) => (
                      <div key={movimiento.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">{movimiento.descripcion}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(movimiento.fecha).toLocaleString('es-AR')}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              movimiento.credito > 0 ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {movimiento.credito > 0 ? '+' : '-'}$
                            {(movimiento.credito > 0 ? movimiento.credito : movimiento.debito).toLocaleString('es-AR')}
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
