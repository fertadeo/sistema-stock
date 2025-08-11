"use client";
import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Fiado {
  id: number;
  clienteId: number;
  cliente: string;
  direccion: string;
  telefono: string;
  monto: number;
  fecha: string;
  observaciones: string;
  pagado: boolean;
  fechaPago?: string;
  montoPagado?: number;
  diasVencido?: number;
}

interface ResumenFiados {
  totalPendiente: number;
  totalPagado: number;
  cantidadFiados: number;
  cantidadPagados: number;
  promedioFiado: number;
  clienteMayorDeuda: string;
  fiadosVencidos: number;
  totalVencido: number;
}

const FiadosPage: React.FC = () => {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [resumen, setResumen] = useState<ResumenFiados>({
    totalPendiente: 0,
    totalPagado: 0,
    cantidadFiados: 0,
    cantidadPagados: 0,
    promedioFiado: 0,
    clienteMayorDeuda: '',
    fiadosVencidos: 0,
    totalVencido: 0
  });
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes' | 'pagados' | 'vencidos'>('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    // Simular datos de fiados
    const fiadosSimulados: Fiado[] = [
      {
        id: 1,
        clienteId: 1,
        cliente: "María González",
        direccion: "Av. San Martín 1234",
        telefono: "3541222719",
        monto: 5000,
        fecha: '2024-01-10T10:00:00Z',
        observaciones: 'Soda 2L y agua 1L',
        pagado: false,
        diasVencido: 5
      },
      {
        id: 2,
        clienteId: 1,
        cliente: "María González",
        direccion: "Av. San Martín 1234",
        telefono: "3541222719",
        monto: 3000,
        fecha: '2024-01-08T14:30:00Z',
        observaciones: 'Limonada 1L',
        pagado: true,
        fechaPago: '2024-01-12T09:00:00Z',
        montoPagado: 3000
      },
      {
        id: 3,
        clienteId: 2,
        cliente: "Carlos Rodríguez",
        direccion: "Belgrano 567",
        telefono: "3541222719",
        monto: 8000,
        fecha: '2024-01-05T16:00:00Z',
        observaciones: 'Varios productos',
        pagado: false,
        diasVencido: 10
      },
      {
        id: 4,
        clienteId: 3,
        cliente: "Ana Martínez",
        direccion: "Rivadavia 890",
        telefono: "3541222719",
        monto: 2500,
        fecha: '2024-01-12T11:00:00Z',
        observaciones: 'Agua 500ml',
        pagado: false,
        diasVencido: 3
      },
      {
        id: 5,
        clienteId: 4,
        cliente: "Roberto Silva",
        direccion: "San Juan 123",
        telefono: "3541222719",
        monto: 12000,
        fecha: '2024-01-03T09:00:00Z',
        observaciones: 'Pedido grande',
        pagado: false,
        diasVencido: 12
      }
    ];

    setFiados(fiadosSimulados);

    // Calcular resumen
    const pendientes = fiadosSimulados.filter(f => !f.pagado);
    const pagados = fiadosSimulados.filter(f => f.pagado);
    const vencidos = fiadosSimulados.filter(f => !f.pagado && (f.diasVencido || 0) > 7);

    // Encontrar cliente con mayor deuda
    const deudasPorCliente = fiadosSimulados
      .filter(f => !f.pagado)
      .reduce((acc, f) => {
        acc[f.cliente] = (acc[f.cliente] || 0) + f.monto;
        return acc;
      }, {} as { [key: string]: number });

    const clienteMayorDeuda = Object.entries(deudasPorCliente)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    setResumen({
      totalPendiente: pendientes.reduce((sum, f) => sum + f.monto, 0),
      totalPagado: pagados.reduce((sum, f) => sum + (f.montoPagado || f.monto), 0),
      cantidadFiados: pendientes.length,
      cantidadPagados: pagados.length,
      promedioFiado: fiadosSimulados.length > 0 ? fiadosSimulados.reduce((sum, f) => sum + f.monto, 0) / fiadosSimulados.length : 0,
      clienteMayorDeuda,
      fiadosVencidos: vencidos.length,
      totalVencido: vencidos.reduce((sum, f) => sum + f.monto, 0)
    });
  }, []);

  const fiadosFiltrados = fiados.filter(fiado => {
    // Filtro por estado
    const cumpleEstado = 
      filtroEstado === 'todos' ||
      (filtroEstado === 'pendientes' && !fiado.pagado) ||
      (filtroEstado === 'pagados' && fiado.pagado) ||
      (filtroEstado === 'vencidos' && !fiado.pagado && (fiado.diasVencido || 0) > 7);

    // Filtro por búsqueda
    const cumpleBusqueda = 
      !busqueda ||
      fiado.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      fiado.direccion.toLowerCase().includes(busqueda.toLowerCase());

    return cumpleEstado && cumpleBusqueda;
  });

  const registrarPago = (fiadoId: number, montoPagado: number) => {
    setFiados(prev => prev.map(f => 
      f.id === fiadoId 
        ? { 
            ...f, 
            pagado: true, 
            fechaPago: new Date().toISOString(),
            montoPagado 
          }
        : f
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reporte de Fiados</h1>
        <p className="text-gray-600">Gestión y seguimiento de deudas pendientes</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pendiente</p>
              <p className="text-2xl font-bold text-gray-800">${resumen.totalPendiente.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-600">{resumen.cantidadFiados} fiados activos</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cobrado</p>
              <p className="text-2xl font-bold text-gray-800">${resumen.totalPagado.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">{resumen.cantidadPagados} fiados pagados</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fiados Vencidos</p>
              <p className="text-2xl font-bold text-gray-800">${resumen.totalVencido.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-orange-600">{resumen.fiadosVencidos} vencidos</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio Fiado</p>
              <p className="text-2xl font-bold text-gray-800">${resumen.promedioFiado.toFixed(0)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-blue-600">Por fiado</span>
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
              onClick={() => setFiltroEstado('pendientes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'pendientes'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFiltroEstado('vencidos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'vencidos'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vencidos
            </button>
            <button
              onClick={() => setFiltroEstado('pagados')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroEstado === 'pagados'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pagados
            </button>
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por cliente o dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Resumen por cliente */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <UserGroupIcon className="w-5 h-5 mr-2" />
          Resumen por Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(
            fiados.reduce((acc, f) => {
              if (!acc[f.cliente]) {
                acc[f.cliente] = { total: 0, pendiente: 0, pagado: 0, direccion: f.direccion };
              }
              acc[f.cliente].total += f.monto;
              if (f.pagado) {
                acc[f.cliente].pagado += f.montoPagado || f.monto;
              } else {
                acc[f.cliente].pendiente += f.monto;
              }
              return acc;
            }, {} as { [key: string]: { total: number; pendiente: number; pagado: number; direccion: string } })
          ).map(([cliente, datos]) => (
            <div key={cliente} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">{cliente}</h4>
              <p className="text-sm text-gray-600 mb-3">{datos.direccion}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-semibold">${datos.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendiente:</span>
                  <span className="font-semibold text-red-600">${datos.pendiente.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pagado:</span>
                  <span className="font-semibold text-green-600">${datos.pagado.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de fiados */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-lg">Historial de Fiados</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {fiadosFiltrados.map(fiado => (
            <div key={fiado.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-800">{fiado.cliente}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      fiado.pagado 
                        ? 'bg-green-100 text-green-800' 
                        : (fiado.diasVencido || 0) > 7
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {fiado.pagado ? 'Pagado' : (fiado.diasVencido || 0) > 7 ? 'Vencido' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{fiado.direccion}</p>
                  <p className="text-sm text-gray-500 mb-2">{fiado.observaciones}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    <span>{new Date(fiado.fecha).toLocaleDateString('es-ES')}</span>
                    {!fiado.pagado && fiado.diasVencido && fiado.diasVencido > 7 && (
                      <>
                        <span className="mx-2">•</span>
                        <ClockIcon className="w-3 h-3 mr-1" />
                        <span className="text-red-600">{fiado.diasVencido} días vencido</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">${fiado.monto.toLocaleString()}</p>
                  {fiado.pagado && (
                    <p className="text-xs text-green-600">
                      Pagado: {new Date(fiado.fechaPago!).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
              </div>
              
              {!fiado.pagado && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const monto = prompt(`Ingrese el monto a pagar (máximo $${fiado.monto}):`, fiado.monto.toString());
                      if (monto && !isNaN(Number(monto)) && Number(monto) <= fiado.monto) {
                        registrarPago(fiado.id, Number(monto));
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Registrar Pago
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {fiadosFiltrados.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No hay fiados que coincidan con los filtros seleccionados
          </div>
        )}
      </div>
    </div>
  );
};

export default FiadosPage;
