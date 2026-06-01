"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  CreditCardIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  BoltIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  ClienteBasico,
  ClienteDeudor,
} from '@/lib/services/repartidorRapidoService';

type ResumenCardProps = {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: React.ReactNode;
  color: 'teal' | 'orange' | 'blue' | 'purple';
};

function ResumenCard({ titulo, valor, descripcion, icono, color }: ResumenCardProps) {
  const clases = {
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${clases[color]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-600">{titulo}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{valor}</p>
          <p className="mt-1 text-xs text-gray-500">{descripcion}</p>
        </div>
        <div className="rounded-full bg-white/70 p-2">{icono}</div>
      </div>
    </div>
  );
}

export default function RepartidorDashboard() {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteBasico[]>([]);
  const [deudores, setDeudores] = useState<ClienteDeudor[]>([]);
  const [cantidadProductos, setCantidadProductos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const cargarDashboard = async () => {
      setCargando(true);
      setError('');

      try {
        const [clientesData, deudoresData, productosData] = await Promise.all([
          repartidorRapidoService.obtenerTodosClientes(),
          repartidorRapidoService.obtenerClientesDeudores({ page: 1, limit: 10 }),
          repartidorRapidoService.obtenerProductos(),
        ]);

        if (!mounted) return;

        setClientes(clientesData);
        setDeudores(deudoresData.clientes);
        setCantidadProductos(productosData.length);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'No se pudo cargar la información operativa.');
      } finally {
        if (mounted) {
          setCargando(false);
        }
      }
    };

    cargarDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const totalEnvases = useMemo(
    () =>
      clientes.reduce(
        (total, cliente) =>
          total +
          (cliente.envases_prestados || []).reduce(
            (subtotal, envase) => subtotal + (Number(envase.cantidad) || 0),
            0
          ),
        0
      ),
    [clientes]
  );

  const clientesConEnvases = useMemo(
    () =>
      clientes
        .map((cliente) => ({
          ...cliente,
          cantidad_envases: (cliente.envases_prestados || []).reduce(
            (subtotal, envase) => subtotal + (Number(envase.cantidad) || 0),
            0
          ),
        }))
        .filter((cliente) => cliente.cantidad_envases > 0)
        .sort((a, b) => b.cantidad_envases - a.cantidad_envases)
        .slice(0, 5),
    [clientes]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Inicio operativo</h1>
        <p className="mt-2 text-sm text-gray-600">
          Accesos reales del módulo de repartidor para trabajar con clientes, cobros y envases.
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Acciones rápidas</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <button
            onClick={() => router.push('/repartidor/rapido')}
            className="rounded-xl bg-teal-600 px-4 py-4 text-left text-white transition-colors hover:bg-teal-700"
          >
            <BoltIcon className="h-6 w-6" />
            <p className="mt-3 font-semibold">Repartidor rápido</p>
            <p className="mt-1 text-xs text-teal-100">Ventas, fiados, cobros y envases</p>
          </button>
          <button
            onClick={() => router.push('/repartidor/rapido?nuevo=1')}
            className="rounded-xl bg-blue-600 px-4 py-4 text-left text-white transition-colors hover:bg-blue-700"
          >
            <UserPlusIcon className="h-6 w-6" />
            <p className="mt-3 font-semibold">Nuevo cliente</p>
            <p className="mt-1 text-xs text-blue-100">Alta rápida desde el recorrido</p>
          </button>
          <button
            onClick={() => router.push('/repartidor/fiados')}
            className="rounded-xl bg-orange-600 px-4 py-4 text-left text-white transition-colors hover:bg-orange-700"
          >
            <CreditCardIcon className="h-6 w-6" />
            <p className="mt-3 font-semibold">Deudores</p>
            <p className="mt-1 text-xs text-orange-100">Consultar y cobrar saldos</p>
          </button>
          <button
            onClick={() => router.push('/repartidor/envases')}
            className="rounded-xl bg-purple-600 px-4 py-4 text-left text-white transition-colors hover:bg-purple-700"
          >
            <CubeIcon className="h-6 w-6" />
            <p className="mt-3 font-semibold">Envases</p>
            <p className="mt-1 text-xs text-purple-100">Seguimiento y ajustes</p>
          </button>
          <button
            onClick={() => router.push('/repartidor/movimientos')}
            className="rounded-xl bg-gray-800 px-4 py-4 text-left text-white transition-colors hover:bg-gray-900"
          >
            <ClipboardDocumentListIcon className="h-6 w-6" />
            <p className="mt-3 font-semibold">Movimientos</p>
            <p className="mt-1 text-xs text-gray-300">Ventas, cobros, fiados y envases</p>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          titulo="Clientes activos"
          valor={cargando ? '...' : clientes.length.toString()}
          descripcion="Clientes disponibles para trabajar"
          icono={<UserGroupIcon className="h-6 w-6" />}
          color="teal"
        />
        <ResumenCard
          titulo="Clientes con deuda"
          valor={cargando ? '...' : deudores.length.toString()}
          descripcion="Tomado desde cuenta corriente"
          icono={<CreditCardIcon className="h-6 w-6" />}
          color="orange"
        />
        <ResumenCard
          titulo="Envases en calle"
          valor={cargando ? '...' : totalEnvases.toString()}
          descripcion="Cantidad total prestada hoy en sistema"
          icono={<CubeIcon className="h-6 w-6" />}
          color="blue"
        />
        <ResumenCard
          titulo="Productos disponibles"
          valor={cargando ? '...' : cantidadProductos.toString()}
          descripcion="Catálogo cargado para ventas"
          icono={<ClipboardDocumentListIcon className="h-6 w-6" />}
          color="purple"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cobros prioritarios</h2>
              <p className="text-sm text-gray-500">Clientes con saldo pendiente para accionar rápido.</p>
            </div>
            <button
              onClick={() => router.push('/repartidor/fiados')}
              className="text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {!cargando && deudores.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No hay clientes con deuda registrada.
              </p>
            )}

            {deudores.slice(0, 5).map((cliente) => (
              <div
                key={cliente.cliente_id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                    <p className="text-sm text-gray-500">{cliente.direccion || 'Sin dirección cargada'}</p>
                    <p className="mt-1 text-xs text-gray-500">{cliente.telefono || 'Sin teléfono'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Saldo</p>
                    <p className="font-bold text-red-600">
                      ${cliente.saldo_actual.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      router.push(`/repartidor/rapido?cliente=${cliente.cliente_id}&accion=cobro`)
                    }
                    className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Cobrar
                  </button>
                  <button
                    onClick={() => router.push(`/repartidor/clientes/${cliente.cliente_id}`)}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Ver ficha
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Envases a seguir</h2>
              <p className="text-sm text-gray-500">Clientes con saldo actual de envases.</p>
            </div>
            <button
              onClick={() => router.push('/repartidor/envases')}
              className="text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {!cargando && clientesConEnvases.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No hay envases pendientes en este momento.
              </p>
            )}

            {clientesConEnvases.map((cliente) => (
              <div
                key={cliente.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                    <p className="text-sm text-gray-500">{cliente.direccion || 'Sin dirección cargada'}</p>
                    <p className="mt-1 text-xs text-gray-500">{cliente.telefono || 'Sin teléfono'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Envases</p>
                    <p className="font-bold text-blue-600">{cliente.cantidad_envases}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      router.push(`/repartidor/rapido?cliente=${cliente.id}&accion=envases`)
                    }
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Gestionar
                  </button>
                  <button
                    onClick={() => router.push(`/repartidor/clientes/${cliente.id}`)}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Ver ficha
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>
            El registro de ventas, fiados, cobros y movimientos de envases se realiza desde
            `Repartidor Rápido`. Las pantallas del módulo ahora quedaron orientadas a consulta,
            búsqueda y acceso directo al flujo operativo real.
          </p>
        </div>
      </section>
    </div>
  );
}
