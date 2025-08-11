"use client";
import React, { useState, useEffect } from 'react';
import { 
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Envase {
  id: number;
  clienteId: number;
  cliente: string;
  direccion: string;
  telefono: string;
  tipo: string;
  cantidad: number;
  fechaPrestamo: string;
  fechaDevolucion?: string;
  devuelto: boolean;
  observaciones?: string;
  diasPrestado?: number;
}

interface ResumenEnvases {
  totalPrestado: number;
  totalDevuelto: number;
  totalPendiente: number;
  cantidadClientes: number;
  envasesVencidos: number;
  promedioDias: number;
  tipoMasPrestado: string;
  clienteMasEnvases: string;
}

const EnvasesPage: React.FC = () => {
  const [envases, setEnvases] = useState<Envase[]>([]);
  const [resumen, setResumen] = useState<ResumenEnvases>({
    totalPrestado: 0,
    totalDevuelto: 0,
    totalPendiente: 0,
    cantidadClientes: 0,
    envasesVencidos: 0,
    promedioDias: 0,
    tipoMasPrestado: '',
    clienteMasEnvases: ''
  });
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'prestados' | 'devueltos' | 'vencidos'>('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    // Simular datos de envases
    const envasesSimulados: Envase[] = [
      {
        id: 1,
        clienteId: 1,
        cliente: "María González",
        direccion: "Av. San Martín 1234",
        telefono: "3541222719",
        tipo: "Botella 2L",
        cantidad: 3,
        fechaPrestamo: '2024-01-10T10:00:00Z',
        devuelto: false,
        observaciones: 'Para evento familiar',
        diasPrestado: 5
      },
      {
        id: 2,
        clienteId: 1,
        cliente: "María González",
        direccion: "Av. San Martín 1234",
        telefono: "3541222719",
        tipo: "Garrafa 20L",
        cantidad: 1,
        fechaPrestamo: '2024-01-05T14:30:00Z',
        fechaDevolucion: '2024-01-12T09:00:00Z',
        devuelto: true,
        diasPrestado: 7
      },
      {
        id: 3,
        clienteId: 2,
        cliente: "Carlos Rodríguez",
        direccion: "Belgrano 567",
        telefono: "3541222719",
        tipo: "Botella 1L",
        cantidad: 5,
        fechaPrestamo: '2024-01-08T16:00:00Z',
        devuelto: false,
        diasPrestado: 7
      },
      {
        id: 4,
        clienteId: 3,
        cliente: "Ana Martínez",
        direccion: "Rivadavia 890",
        telefono: "3541222719",
        tipo: "Botella 500ml",
        cantidad: 2,
        fechaPrestamo: '2024-01-03T11:00:00Z',
        devuelto: false,
        diasPrestado: 12
      },
      {
        id: 5,
        clienteId: 4,
        cliente: "Roberto Silva",
        direccion: "San Juan 123",
        telefono: "3541222719",
        tipo: "Garrafa 10L",
        cantidad: 2,
        fechaPrestamo: '2024-01-01T09:00:00Z',
        devuelto: false,
        diasPrestado: 14
      }
    ];

    setEnvases(envasesSimulados);

    // Calcular resumen
    const prestados = envasesSimulados.filter(e => !e.devuelto);
    const devueltos = envasesSimulados.filter(e => e.devuelto);
    const vencidos = envasesSimulados.filter(e => !e.devuelto && (e.diasPrestado || 0) > 10);

    // Encontrar tipo más prestado
    const tiposCount = envasesSimulados.reduce((acc, e) => {
      acc[e.tipo] = (acc[e.tipo] || 0) + e.cantidad;
      return acc;
    }, {} as { [key: string]: number });

    const tipoMasPrestado = Object.entries(tiposCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Encontrar cliente con más envases
    const envasesPorCliente = envasesSimulados
      .filter(e => !e.devuelto)
      .reduce((acc, e) => {
        acc[e.cliente] = (acc[e.cliente] || 0) + e.cantidad;
        return acc;
      }, {} as { [key: string]: number });

    const clienteMasEnvases = Object.entries(envasesPorCliente)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const clientesUnicos = new Set(envasesSimulados.map(e => e.cliente)).size;
    const promedioDias = envasesSimulados.length > 0 
      ? envasesSimulados.reduce((sum, e) => sum + (e.diasPrestado || 0), 0) / envasesSimulados.length 
      : 0;

    setResumen({
      totalPrestado: envasesSimulados.reduce((sum, e) => sum + e.cantidad, 0),
      totalDevuelto: devueltos.reduce((sum, e) => sum + e.cantidad, 0),
      totalPendiente: prestados.reduce((sum, e) => sum + e.cantidad, 0),
      cantidadClientes: clientesUnicos,
      envasesVencidos: vencidos.reduce((sum, e) => sum + e.cantidad, 0),
      promedioDias,
      tipoMasPrestado,
      clienteMasEnvases
    });
  }, []);

  const envasesFiltrados = envases.filter(envase => {
    // Filtro por estado
    const cumpleEstado = 
      filtroEstado === 'todos' ||
      (filtroEstado === 'prestados' && !envase.devuelto) ||
      (filtroEstado === 'devueltos' && envase.devuelto) ||
      (filtroEstado === 'vencidos' && !envase.devuelto && (envase.diasPrestado || 0) > 10);

    // Filtro por búsqueda
    const cumpleBusqueda = 
      !busqueda ||
      envase.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      envase.direccion.toLowerCase().includes(busqueda.toLowerCase()) ||
      envase.tipo.toLowerCase().includes(busqueda.toLowerCase());

    return cumpleEstado && cumpleBusqueda;
  });

  const registrarDevolucion = (envaseId: number) => {
    setEnvases(prev => prev.map(e => 
      e.id === envaseId 
        ? { 
            ...e, 
            devuelto: true, 
            fechaDevolucion: new Date().toISOString()
          }
        : e
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reporte de Envases</h1>
        <p className="text-gray-600">Gestión y seguimiento de envases prestados</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Prestado</p>
              <p className="text-2xl font-bold text-gray-800">{resumen.totalPrestado}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-blue-600">Envases en circulación</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Devuelto</p>
              <p className="text-2xl font-bold text-gray-800">{resumen.totalDevuelto}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">Envases recuperados</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-800">{resumen.totalPendiente}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-orange-600">Por devolver</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-gray-800">{resumen.envasesVencidos}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-600">+10 días</span>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'todos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroEstado('prestados')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'prestados'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Prestados
            </button>
            <button
              onClick={() => setFiltroEstado('vencidos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'vencidos'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vencidos
            </button>
            <button
              onClick={() => setFiltroEstado('devueltos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'devueltos'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Devueltos
            </button>
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por cliente, dirección o tipo de envase..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Resumen por tipo y cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <CubeIcon className="w-5 h-5 mr-2" />
            Resumen por Tipo de Envase
          </h3>
          <div className="space-y-4">
            {Object.entries(
              envases.reduce((acc, e) => {
                if (!acc[e.tipo]) {
                  acc[e.tipo] = { prestado: 0, devuelto: 0 };
                }
                if (e.devuelto) {
                  acc[e.tipo].devuelto += e.cantidad;
                } else {
                  acc[e.tipo].prestado += e.cantidad;
                }
                return acc;
              }, {} as { [key: string]: { prestado: number; devuelto: number } })
            ).map(([tipo, datos]) => (
              <div key={tipo} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-800">{tipo}</span>
                  <div className="text-sm text-gray-600">
                    {datos.prestado} prestados, {datos.devuelto} devueltos
                  </div>
                </div>
                <span className="font-semibold text-blue-600">{datos.prestado + datos.devuelto}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Resumen por Cliente
          </h3>
          <div className="space-y-4">
            {Object.entries(
              envases.reduce((acc, e) => {
                if (!acc[e.cliente]) {
                  acc[e.cliente] = { prestado: 0, devuelto: 0, direccion: e.direccion };
                }
                if (e.devuelto) {
                  acc[e.cliente].devuelto += e.cantidad;
                } else {
                  acc[e.cliente].prestado += e.cantidad;
                }
                return acc;
              }, {} as { [key: string]: { prestado: number; devuelto: number; direccion: string } })
            ).map(([cliente, datos]) => (
              <div key={cliente} className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 mb-1">{cliente}</h4>
                <p className="text-sm text-gray-600 mb-2">{datos.direccion}</p>
                <div className="flex justify-between text-sm">
                  <span>Prestados: <span className="font-semibold text-blue-600">{datos.prestado}</span></span>
                  <span>Devueltos: <span className="font-semibold text-green-600">{datos.devuelto}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de envases */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-lg">Historial de Envases</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {envasesFiltrados.map(envase => (
            <div key={envase.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-800">{envase.cliente}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      envase.devuelto 
                        ? 'bg-green-100 text-green-800' 
                        : (envase.diasPrestado || 0) > 10
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {envase.devuelto ? 'Devuelto' : (envase.diasPrestado || 0) > 10 ? 'Vencido' : 'Prestado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{envase.direccion}</p>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <CubeIcon className="w-4 h-4 mr-1" />
                    <span>{envase.tipo} - {envase.cantidad} unidades</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    <span>Prestado: {new Date(envase.fechaPrestamo).toLocaleDateString('es-ES')}</span>
                    {!envase.devuelto && envase.diasPrestado && envase.diasPrestado > 10 && (
                      <>
                        <span className="mx-2">•</span>
                        <ClockIcon className="w-3 h-3 mr-1" />
                        <span className="text-red-600">{envase.diasPrestado} días prestado</span>
                      </>
                    )}
                  </div>
                  {envase.observaciones && (
                    <p className="text-sm text-gray-500 mt-1">{envase.observaciones}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{envase.cantidad} unidades</p>
                  {envase.devuelto && envase.fechaDevolucion && (
                    <p className="text-xs text-green-600">
                      Devuelto: {new Date(envase.fechaDevolucion).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
              </div>
              
              {!envase.devuelto && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => registrarDevolucion(envase.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Registrar Devolución
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {envasesFiltrados.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No hay envases que coincidan con los filtros seleccionados
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvasesPage;
