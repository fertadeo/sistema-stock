"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  CubeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  ClienteBasico,
  CuentaCorrienteResumen,
  ResumenEnvases,
  ZonaCliente,
} from '@/lib/services/repartidorRapidoService';
import MovimientosCliente from '@/components/repartidor/MovimientosCliente';
import BarraEnviarEstadoWhatsApp from '@/components/repartidor/BarraEnviarEstadoWhatsApp';

type ClienteDetalleState = {
  cliente: ClienteBasico;
  resumenCuenta: CuentaCorrienteResumen | null;
  resumenEnvases: ResumenEnvases | null;
};

function sumarEnvases(cliente: ClienteBasico) {
  return (cliente.envases_prestados || []).reduce(
    (total, envase) => total + (Number(envase.cantidad) || 0),
    0
  );
}

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteBasico[]>([]);
  const [zonas, setZonas] = useState<ZonaCliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState<ClienteDetalleState | null>(null);
  const [mostrarMovimientos, setMostrarMovimientos] = useState(false);

  useEffect(() => {
    let mounted = true;

    const cargar = async () => {
      setCargando(true);
      setError('');

      try {
        const [clientesData, zonasData] = await Promise.all([
          repartidorRapidoService.obtenerTodosClientes(),
          repartidorRapidoService.obtenerZonas(),
        ]);

        if (!mounted) return;
        setClientes(clientesData);
        setZonas(zonasData);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'No se pudo cargar el listado de clientes.');
      } finally {
        if (mounted) setCargando(false);
      }
    };

    cargar();
    return () => {
      mounted = false;
    };
  }, []);

  const clientesFiltrados = useMemo(
    () =>
      clientes.filter((cliente) => {
        const coincideBusqueda =
          !searchTerm.trim() ||
          cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cliente.direccion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cliente.telefono || '').includes(searchTerm.trim()) ||
          (cliente.dni || '').includes(searchTerm.trim());

        const coincideZona = !filtroZona || String(cliente.zona ?? '') === filtroZona;
        return coincideBusqueda && coincideZona;
      }),
    [clientes, searchTerm, filtroZona]
  );

  const abrirDetalle = async (cliente: ClienteBasico) => {
    setCargandoDetalle(true);
    setDetalle({
      cliente,
      resumenCuenta: null,
      resumenEnvases: null,
    });

    try {
      const [clienteCompleto, resumenCuenta, resumenEnvases] = await Promise.allSettled([
        repartidorRapidoService.obtenerCliente(cliente.id),
        repartidorRapidoService.obtenerCuentaCorrienteResumen(cliente.id),
        repartidorRapidoService.obtenerResumenEnvases(cliente.id),
      ]);

      setDetalle({
        cliente: clienteCompleto.status === 'fulfilled' ? clienteCompleto.value : cliente,
        resumenCuenta: resumenCuenta.status === 'fulfilled' ? resumenCuenta.value : null,
        resumenEnvases: resumenEnvases.status === 'fulfilled' ? resumenEnvases.value : null,
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  if (detalle) {
    const zonaNombre =
      zonas.find((zona) => zona.id === detalle.cliente.zona)?.nombre ||
      (detalle.cliente.zona != null ? `Zona ${detalle.cliente.zona}` : 'Sin zona');

    const datosWhatsApp = {
      clienteNombre: detalle.cliente.nombre,
      cuenta: detalle.resumenCuenta,
      saldoActual: detalle.resumenCuenta?.saldo_actual,
      envases: detalle.resumenEnvases,
      direccion: detalle.cliente.direccion,
    };

    return (
      <div className="relative pb-32 space-y-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setDetalle(null)}
              className="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{detalle.cliente.nombre}</h1>
              <p className="text-sm text-gray-500">Ficha operativa del cliente</p>
            </div>
          </div>

          {cargandoDetalle && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
              Cargando resumen actualizado...
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900">Contacto</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex gap-3">
                  <MapPinIcon className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Dirección</p>
                    <p className="font-medium text-gray-800">
                      {detalle.cliente.direccion || 'Sin dirección cargada'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <PhoneIcon className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Teléfono</p>
                    <p className="font-medium text-gray-800">
                      {detalle.cliente.telefono || 'Sin teléfono'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <EnvelopeIcon className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">
                      {detalle.cliente.email || 'Sin email'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900">Reparto y saldo</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Zona</p>
                  <p className="font-medium text-gray-800">{zonaNombre}</p>
                </div>
                <div>
                  <p className="text-gray-500">Día</p>
                  <p className="font-medium text-gray-800">
                    {detalle.cliente.dia_reparto || 'Sin definir'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Saldo actual</p>
                  <p className="font-semibold text-red-600">
                    ${detalle.resumenCuenta?.saldo_actual?.toLocaleString('es-AR') || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Envases actuales</p>
                  <p className="font-semibold text-blue-600">
                    {detalle.resumenEnvases?.cantidad_total ?? sumarEnvases(detalle.cliente)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Acciones rápidas</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => setMostrarMovimientos(true)}
              className="rounded-xl border-2 border-teal-200 bg-teal-50 p-4 text-left hover:bg-teal-100"
            >
              <ClipboardDocumentListIcon className="h-6 w-6 text-teal-700" />
              <p className="mt-3 font-semibold text-teal-900">Ver movimientos</p>
              <p className="mt-1 text-xs text-teal-700">
                Ventas, fiados, cobros y envases de este cliente
              </p>
            </button>
            <button
              onClick={() => router.push(`/repartidor/rapido?cliente=${detalle.cliente.id}&accion=venta`)}
              className="rounded-xl bg-green-600 p-4 text-left text-white hover:bg-green-700"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              <p className="mt-3 font-semibold">Registrar venta</p>
            </button>
            <button
              onClick={() => router.push(`/repartidor/rapido?cliente=${detalle.cliente.id}&accion=cobro`)}
              className="rounded-xl bg-orange-600 p-4 text-left text-white hover:bg-orange-700"
            >
              <CreditCardIcon className="h-6 w-6" />
              <p className="mt-3 font-semibold">Registrar cobro</p>
            </button>
            <button
              onClick={() => router.push(`/repartidor/rapido?cliente=${detalle.cliente.id}&accion=envases`)}
              className="rounded-xl bg-blue-600 p-4 text-left text-white hover:bg-blue-700"
            >
              <CubeIcon className="h-6 w-6" />
              <p className="mt-3 font-semibold">Gestionar envases</p>
            </button>
          </div>
        </div>

        {mostrarMovimientos && (
          <MovimientosCliente
            clienteId={detalle.cliente.id}
            clienteNombre={detalle.cliente.nombre}
            onCerrar={() => setMostrarMovimientos(false)}
          />
        )}

        {!mostrarMovimientos && (
          <div className="fixed bottom-16 left-0 right-0 z-40 lg:left-64">
            <BarraEnviarEstadoWhatsApp
              datos={datosWhatsApp}
              telefono={detalle.cliente.telefono}
              onErrorTelefono={(msg) => setError(msg)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="mt-2 text-sm text-gray-600">
              Listado operativo conectado al backend para buscar, revisar y accionar sobre clientes.
            </p>
          </div>
          <button
            onClick={() => router.push('/repartidor/rapido?nuevo=1')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo cliente
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, dirección, teléfono o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todas las zonas</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={String(zona.id)}>
                {zona.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900">
            Clientes {cargando ? '' : `(${clientesFiltrados.length})`}
          </h2>
        </div>

        {cargando ? (
          <div className="p-6 text-sm text-gray-500">Cargando clientes...</div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No se encontraron clientes.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {clientesFiltrados.map((cliente) => {
              const zonaNombre =
                zonas.find((zona) => zona.id === cliente.zona)?.nombre ||
                (cliente.zona != null ? `Zona ${cliente.zona}` : 'Sin zona');

              return (
                <button
                  key={cliente.id}
                  className="flex w-full items-center gap-4 p-6 text-left transition-colors hover:bg-gray-50"
                  onClick={() => abrirDetalle(cliente)}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                    <UserIcon className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{cliente.nombre}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{cliente.direccion || 'Sin dirección cargada'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded bg-gray-100 px-2 py-1 text-gray-600">{zonaNombre}</span>
                      {sumarEnvases(cliente) > 0 && (
                        <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
                          {sumarEnvases(cliente)} envases
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{cliente.telefono || 'Sin teléfono'}</p>
                    <ArrowRightIcon className="ml-auto mt-2 h-5 w-5 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
