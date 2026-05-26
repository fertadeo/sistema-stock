"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingCartIcon,
  UserGroupIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  ClienteBasico,
} from '@/lib/services/repartidorRapidoService';

type Producto = {
  id: number;
  nombreProducto?: string;
  nombre?: string;
  precioPublico?: number;
  cantidadStock?: number;
};

export default function VentasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteParam = searchParams.get('cliente');
  const [clientes, setClientes] = useState<ClienteBasico[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clienteParam) return;
    router.replace(`/repartidor/rapido?cliente=${clienteParam}&accion=venta`);
  }, [clienteParam, router]);

  useEffect(() => {
    let mounted = true;

    const cargar = async () => {
      setCargando(true);
      setError('');
      try {
        const [clientesData, productosData] = await Promise.all([
          repartidorRapidoService.obtenerTodosClientes(),
          repartidorRapidoService.obtenerProductos(),
        ]);

        if (!mounted) return;
        setClientes(clientesData);
        setProductos(productosData);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'No se pudo cargar la información de ventas.');
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

  const productosOrdenados = useMemo(
    () =>
      [...productos]
        .sort((a, b) => (a.nombreProducto || a.nombre || '').localeCompare(b.nombreProducto || b.nombre || ''))
        .slice(0, 12),
    [productos]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Operación de ventas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Prepará la venta desde acá y ejecutala en `Repartidor Rápido`, que es el flujo conectado al backend.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clientes disponibles</p>
              <p className="text-2xl font-bold text-green-600">{clientes.length}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Productos cargados</p>
              <p className="text-2xl font-bold text-blue-600">{productos.length}</p>
            </div>
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Envases con clientes</p>
              <p className="text-2xl font-bold text-purple-600">
                {
                  clientes.filter(
                    (cliente) =>
                      (cliente.envases_prestados || []).reduce(
                        (total, envase) => total + (Number(envase.cantidad) || 0),
                        0
                      ) > 0
                  ).length
                }
              </p>
            </div>
            <CubeIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Elegí un cliente</h2>
              <p className="text-sm text-gray-500">Buscá al cliente y arrancá una venta o un fiado.</p>
            </div>
            <button
              onClick={() => router.push('/repartidor/rapido')}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Abrir flujo completo
            </button>
          </div>

          <div className="relative mt-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, dirección o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="mt-4 space-y-3">
            {cargando ? (
              <p className="text-sm text-gray-500">Cargando clientes...</p>
            ) : clientesFiltrados.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No se encontraron clientes.
              </p>
            ) : (
              clientesFiltrados.slice(0, 12).map((cliente) => (
                <div key={cliente.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {cliente.direccion || 'Sin dirección cargada'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{cliente.telefono || 'Sin teléfono'}</p>
                    </div>
                    <ShoppingCartIcon className="h-6 w-6 flex-shrink-0 text-green-600" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => router.push(`/repartidor/rapido?cliente=${cliente.id}&accion=venta`)}
                      className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Vender
                    </button>
                    <button
                      onClick={() => router.push(`/repartidor/rapido?cliente=${cliente.id}&accion=fiado`)}
                      className="flex-1 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      Fiar
                    </button>
                    <button
                      onClick={() => router.push(`/repartidor/clientes/${cliente.id}`)}
                      className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Ficha
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Catálogo disponible</h2>
          <p className="mt-1 text-sm text-gray-500">
            Referencia rápida de productos y precios antes de registrar la operación.
          </p>

          <div className="mt-4 space-y-2">
            {cargando ? (
              <p className="text-sm text-gray-500">Cargando productos...</p>
            ) : productosOrdenados.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                No hay productos disponibles.
              </p>
            ) : (
              productosOrdenados.map((producto) => (
                <div key={producto.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">
                        {producto.nombreProducto || producto.nombre || 'Producto'}
                      </p>
                      {producto.cantidadStock != null && (
                        <p className="mt-1 text-xs text-gray-500">
                          Stock: {producto.cantidadStock}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(producto.precioPublico || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Los reportes históricos globales de ventas no están expuestos por backend en este módulo.
            Por eso esta pantalla quedó enfocada en la operación real y en disparar el flujo productivo.
          </div>
        </aside>
      </div>
    </div>
  );
}
