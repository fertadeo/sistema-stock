"use client";

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  ClienteDeudor,
  CuentaCorrienteResumen,
  MovimientoCuentaCorriente,
  ResumenFiadosDiario,
} from '@/lib/services/repartidorRapidoService';

const obtenerFechaLocal = (fecha: Date = new Date()): string => {
  return fecha.toISOString().split('T')[0];
};

const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

function FiadosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteParam = searchParams?.get('cliente') ?? null;

  const [deudores, setDeudores] = useState<ClienteDeudor[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams?.get('search') ?? '');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDeudor | null>(null);
  const [resumen, setResumen] = useState<CuentaCorrienteResumen | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCuentaCorriente[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaLocal());
  const [resumenDiario, setResumenDiario] = useState<ResumenFiadosDiario | null>(null);
  const [cargandoResumenDiario, setCargandoResumenDiario] = useState(true);
  const [errorResumenDiario, setErrorResumenDiario] = useState('');

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
    let mounted = true;

    const cargarResumenDiario = async () => {
      setCargandoResumenDiario(true);
      setErrorResumenDiario('');

      try {
        const data = await repartidorRapidoService.obtenerResumenFiadosPorFecha(fechaSeleccionada);
        if (!mounted) return;
        setResumenDiario(data);
      } catch (err: any) {
        if (!mounted) return;
        setErrorResumenDiario(err?.message || 'No se pudo cargar el resumen diario de fiados.');
        setResumenDiario(null);
      } finally {
        if (mounted) setCargandoResumenDiario(false);
      }
    };

    cargarResumenDiario();
    return () => {
      mounted = false;
    };
  }, [fechaSeleccionada]);

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

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-teal-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Fiados del d├¡a</h2>
              <p className="text-sm text-gray-500">
                Resumen del {formatearFecha(fechaSeleccionada)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={() => setFechaSeleccionada(obtenerFechaLocal())}
              className="whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
            >
              Hoy
            </button>
          </div>
        </div>

        {errorResumenDiario && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorResumenDiario}
          </div>
        )}

        {cargandoResumenDiario ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Cargando resumen diario...
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-medium text-orange-700">Total fiado</p>
                <p className="mt-1 text-2xl font-bold text-orange-800">
                  ${(resumenDiario?.totalFiado ?? 0).toLocaleString('es-AR')}
                </p>
                <p className="mt-1 text-xs text-orange-600">
                  {resumenDiario?.cantidadFiados ?? 0} fiado
                  {(resumenDiario?.cantidadFiados ?? 0) !== 1 ? 's' : ''} generado
                  {(resumenDiario?.cantidadFiados ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">Cobrados</p>
                <p className="mt-1 text-2xl font-bold text-green-800">
                  {resumenDiario?.cantidadCobrados ?? 0} de {resumenDiario?.cantidadFiados ?? 0}
                </p>
                <p className="mt-1 text-xs text-green-600">
                  ${(resumenDiario?.totalCobrado ?? 0).toLocaleString('es-AR')} recaudado
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">Pendientes</p>
                <p className="mt-1 text-2xl font-bold text-red-800">
                  {resumenDiario?.cantidadPendientes ?? 0}
                </p>
                <p className="mt-1 text-xs text-red-600">
                  ${(resumenDiario?.totalPendiente ?? 0).toLocaleString('es-AR')} sin cobrar
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-700">Tasa de cobro</p>
                <p className="mt-1 text-2xl font-bold text-blue-800">
                  {resumenDiario?.porcentajeCobrados ?? 0}%
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-blue-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${resumenDiario?.porcentajeCobrados ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-900">
                Detalle de fiados ΓÇö {formatearFecha(fechaSeleccionada)}
              </h3>
              <div className="mt-3 space-y-2">
                {(resumenDiario?.fiados.length ?? 0) === 0 ? (
                  <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    No hay fiados registrados para esta fecha.
                  </p>
                ) : (
                  resumenDiario?.fiados.map((fiado) => (
                    <div
                      key={fiado.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">{fiado.clienteNombre}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              fiado.cobrado
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {fiado.cobrado ? 'Cobrado' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{fiado.descripcion}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(fiado.fecha).toLocaleString('es-AR')}
                          {fiado.cobrado && fiado.fechaCobro && (
                            <span className="ml-2 text-green-600">
                              ┬╖ Cobrado: {new Date(fiado.fechaCobro).toLocaleDateString('es-AR')}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ${fiado.monto.toLocaleString('es-AR')}
                        </p>
                        {fiado.cobrado && (
                          <p className="mt-1 flex items-center justify-end gap-1 text-xs text-green-600">
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            ${fiado.montoCobrado.toLocaleString('es-AR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
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

export default function FiadosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Cargando deudores...</div>}>
      <FiadosPageContent />
    </Suspense>
  );
}
