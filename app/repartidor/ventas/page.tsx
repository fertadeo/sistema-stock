"use client";
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface Venta {
  id: number;
  cliente: string;
  productos: string[];
  monto: number;
  metodoPago: 'efectivo' | 'fiado';
  fecha: string;
  hora: string;
}

interface ResumenVentas {
  totalHoy: number;
  totalSemana: number;
  totalMes: number;
  ventasHoy: number;
  promedioVenta: number;
  mejorCliente: string;
  productoMasVendido: string;
}

const VentasPage: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [resumen, setResumen] = useState<ResumenVentas>({
    totalHoy: 0,
    totalSemana: 0,
    totalMes: 0,
    ventasHoy: 0,
    promedioVenta: 0,
    mejorCliente: '',
    productoMasVendido: ''
  });
  const [filtroFecha, setFiltroFecha] = useState<'hoy' | 'semana' | 'mes'>('hoy');

  useEffect(() => {
    // Simular datos de ventas
    const ventasSimuladas: Venta[] = [
      {
        id: 1,
        cliente: "María González",
        productos: ["Soda 1L", "Agua 500ml"],
        monto: 1200,
        metodoPago: "efectivo",
        fecha: "2024-01-15",
        hora: "14:30"
      },
      {
        id: 2,
        cliente: "Carlos Rodríguez",
        productos: ["Soda 2L", "Jugo Naranja 1L"],
        monto: 2200,
        metodoPago: "fiado",
        fecha: "2024-01-15",
        hora: "15:15"
      },
      {
        id: 3,
        cliente: "Ana Martínez",
        productos: ["Agua 1L", "Limonada 1L"],
        monto: 1600,
        metodoPago: "efectivo",
        fecha: "2024-01-15",
        hora: "16:00"
      },
      {
        id: 4,
        cliente: "María González",
        productos: ["Soda 1L"],
        monto: 800,
        metodoPago: "efectivo",
        fecha: "2024-01-14",
        hora: "10:30"
      },
      {
        id: 5,
        cliente: "Roberto Silva",
        productos: ["Soda 2L", "Agua 1L", "Jugo Manzana 1L"],
        monto: 2800,
        metodoPago: "fiado",
        fecha: "2024-01-14",
        hora: "11:45"
      }
    ];

    setVentas(ventasSimuladas);

    // Calcular resumen
    const hoy = new Date().toDateString();
    const ventasHoy = ventasSimuladas.filter(v => new Date(v.fecha).toDateString() === hoy);
    const totalHoy = ventasHoy.reduce((sum, v) => sum + v.monto, 0);
    const totalSemana = ventasSimuladas.reduce((sum, v) => sum + v.monto, 0);
    const promedioVenta = ventasSimuladas.length > 0 ? ventasSimuladas.reduce((sum, v) => sum + v.monto, 0) / ventasSimuladas.length : 0;

    // Encontrar mejor cliente
    const clientesMap = ventasSimuladas.reduce((acc, v) => {
      acc[v.cliente] = (acc[v.cliente] || 0) + v.monto;
      return acc;
    }, {} as { [key: string]: number });
    const mejorCliente = Object.entries(clientesMap).sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    setResumen({
      totalHoy,
      totalSemana,
      totalMes: totalSemana * 4, // Simulación
      ventasHoy: ventasHoy.length,
      promedioVenta,
      mejorCliente,
      productoMasVendido: "Soda 1L"
    });
  }, []);

  const ventasFiltradas = ventas.filter(venta => {
    const fechaVenta = new Date(venta.fecha);
    const hoy = new Date();
    
    switch (filtroFecha) {
      case 'hoy':
        return fechaVenta.toDateString() === hoy.toDateString();
      case 'semana':
        const unaSemanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        return fechaVenta >= unaSemanaAtras;
      case 'mes':
        const unMesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        return fechaVenta >= unMesAtras;
      default:
        return true;
    }
  });

  const totalFiltrado = ventasFiltradas.reduce((sum, v) => sum + v.monto, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reporte de Ventas</h1>
        <p className="text-gray-600">Resumen detallado de las ventas del reparto</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFiltroFecha('hoy')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroFecha === 'hoy'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setFiltroFecha('semana')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroFecha === 'semana'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setFiltroFecha('mes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroFecha === 'mes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Mes
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-800">${totalFiltrado.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% vs ayer</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Realizadas</p>
              <p className="text-2xl font-bold text-gray-800">{ventasFiltradas.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-blue-600">+3 vs ayer</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio por Venta</p>
              <p className="text-2xl font-bold text-gray-800">
                ${ventasFiltradas.length > 0 ? (totalFiltrado / ventasFiltradas.length).toFixed(0) : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-purple-500 mr-1" />
            <span className="text-purple-600">+8% vs ayer</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Atendidos</p>
              <p className="text-2xl font-bold text-gray-800">
                {new Set(ventasFiltradas.map(v => v.cliente)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpIcon className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-orange-600">+2 vs ayer</span>
          </div>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Resumen General
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Hoy:</span>
              <span className="font-semibold text-green-600">${resumen.totalHoy.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Semana:</span>
              <span className="font-semibold text-blue-600">${resumen.totalSemana.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Mes:</span>
              <span className="font-semibold text-purple-600">${resumen.totalMes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Mejor Cliente:</span>
              <span className="font-semibold text-gray-800">{resumen.mejorCliente}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Producto Más Vendido:</span>
              <span className="font-semibold text-gray-800">{resumen.productoMasVendido}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Ventas por Método de Pago
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-600">Efectivo:</span>
              <span className="font-semibold text-green-600">
                ${ventasFiltradas.filter(v => v.metodoPago === 'efectivo').reduce((sum, v) => sum + v.monto, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-gray-600">Fiado:</span>
              <span className="font-semibold text-orange-600">
                ${ventasFiltradas.filter(v => v.metodoPago === 'fiado').reduce((sum, v) => sum + v.monto, 0).toLocaleString()}
              </span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Porcentaje de ventas a fiado:</p>
              <p className="font-semibold text-blue-600">
                {ventasFiltradas.length > 0 
                  ? Math.round((ventasFiltradas.filter(v => v.metodoPago === 'fiado').length / ventasFiltradas.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-lg">Historial de Ventas</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {ventasFiltradas.map(venta => (
            <div key={venta.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-gray-800">{venta.cliente}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      venta.metodoPago === 'efectivo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {venta.metodoPago === 'efectivo' ? 'Efectivo' : 'Fiado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {venta.productos.join(', ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {venta.fecha} - {venta.hora}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">${venta.monto.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {ventasFiltradas.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No hay ventas registradas para el período seleccionado
          </div>
        )}
      </div>
    </div>
  );
};

export default VentasPage;
