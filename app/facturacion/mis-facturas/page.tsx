"use client"

import { useState, useEffect } from 'react';
import { SideBar } from '@/components/sidebar';
import TopBar from '@/components/topBar';

// Tipos para las facturas
interface Factura {
  id: string;
  numero: string;
  fecha: string;
  cliente: string;
  total: number;
  estado: 'pagada' | 'pendiente' | 'vencida';
  tipo: 'A' | 'B' | 'C';
}

export default function MisFacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Datos de ejemplo para las facturas
  const facturasEjemplo: Factura[] = [
    {
      id: '1',
      numero: '0001-00000001',
      fecha: '2024-01-15',
      cliente: 'Juan Pérez',
      total: 15000,
      estado: 'pagada',
      tipo: 'A'
    },
    {
      id: '2',
      numero: '0001-00000002',
      fecha: '2024-01-16',
      cliente: 'María González',
      total: 8500,
      estado: 'pendiente',
      tipo: 'B'
    },
    {
      id: '3',
      numero: '0001-00000003',
      fecha: '2024-01-10',
      cliente: 'Carlos López',
      total: 22000,
      estado: 'vencida',
      tipo: 'A'
    },
    {
      id: '4',
      numero: '0001-00000004',
      fecha: '2024-01-18',
      cliente: 'Ana Martínez',
      total: 12000,
      estado: 'pagada',
      tipo: 'C'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setFacturas(facturasEjemplo);
      setLoading(false);
    }, 1000);
  }, []);

  // Filtrar facturas
  const facturasFiltradas = facturas.filter(factura => {
    const cumpleEstado = filtroEstado === 'todos' || factura.estado === filtroEstado;
    const cumpleTipo = filtroTipo === 'todos' || factura.tipo === filtroTipo;
    const cumpleBusqueda = busqueda === '' || 
      factura.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      factura.cliente.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleEstado && cumpleTipo && cumpleBusqueda;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'A':
        return 'bg-blue-100 text-blue-800';
      case 'B':
        return 'bg-purple-100 text-purple-800';
      case 'C':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SideBar />
      <div className="md:ml-60">
        <TopBar />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Facturas</h1>
              <p className="text-gray-600">Gestiona y visualiza todas tus facturas emitidas</p>
            </div>

            {/* Filtros y búsqueda */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div className="md:col-span-2">
                  <label htmlFor="factura-busqueda" className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar factura
                  </label>
                  <div className="relative">
                    <input
                      id="factura-busqueda"
                      type="text"
                      placeholder="Número de factura o cliente..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Filtro por estado */}
                <div>
                  <label htmlFor="factura-estado" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    id="factura-estado"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="todos">Todos</option>
                    <option value="pagada">Pagada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="vencida">Vencida</option>
                  </select>
                </div>

                {/* Filtro por tipo */}
                <div>
                  <label htmlFor="factura-tipo" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    id="factura-tipo"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="todos">Todos</option>
                    <option value="A">Tipo A</option>
                    <option value="B">Tipo B</option>
                    <option value="C">Tipo C</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de facturas */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                  <p className="mt-2 text-gray-600">Cargando facturas...</p>
                </div>
              ) : facturasFiltradas.length === 0 ? (
                <div className="p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {busqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos'
                      ? 'No se encontraron facturas con los filtros aplicados.'
                      : 'No tienes facturas registradas aún.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {facturasFiltradas.map((factura) => (
                        <tr key={factura.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {factura.numero}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatearFecha(factura.fecha)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {factura.cliente}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(factura.tipo)}`}>
                              {factura.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(factura.estado)}`}>
                              {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatearPrecio(factura.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-teal-600 hover:text-teal-900">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button className="text-blue-600 hover:text-blue-900">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Resumen */}
            {!loading && facturasFiltradas.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Facturas</p>
                      <p className="text-2xl font-semibold text-gray-900">{facturasFiltradas.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Monto Total</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatearPrecio(facturasFiltradas.reduce((sum, factura) => sum + factura.total, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pendientes</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {facturasFiltradas.filter(f => f.estado === 'pendiente').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

