'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ShoppingCartIcon, MinusCircleIcon } from '@heroicons/react/24/solid';

interface Movimiento {
  id: number;
  tipo: 'VENTA_LOCAL' | 'CIERRE_VENTA' | 'GASTO' | 'NUEVO_CLIENTE';
  descripcion: string;
  fecha: string;
  monto: string | number;
  detalles?: { concepto?: string; categoria?: string };
}

interface ApiResponse {
  success: boolean;
  movimientos: Movimiento[];
  paginacion?: { total: number; pagina: number; porPagina: number; totalPaginas: number };
}

function parseMonto(m: string | number): number {
  const n = typeof m === 'string' ? Number(m) : m;
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0;
}

type PeriodoKey = '7d' | '30d';

const PERIODO_LABELS: Record<PeriodoKey, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
};

export default function GastosIngresosDashboard() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoKey>('7d');

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movimientos`);
        const data: ApiResponse = await response.json();
        if (data.success && Array.isArray(data.movimientos)) {
          setMovimientos(data.movimientos);
        } else {
          setError('Error al cargar los movimientos');
        }
      } catch {
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    };
    fetchMovimientos();
  }, []);

  const { datosGrafico, totalIngresos, totalGastos, recientesIngresos, recientesGastos } = useMemo(() => {
    const dias = periodo === '7d' ? 7 : 30;
    const hasta = new Date();
    const desde = new Date(hasta);
    desde.setDate(desde.getDate() - dias);

    const ingresos = movimientos.filter(
      (m) => m.tipo === 'VENTA_LOCAL' || m.tipo === 'CIERRE_VENTA'
    );
    const gastos = movimientos.filter((m) => m.tipo === 'GASTO');

    const totalIngresos = ingresos.reduce((acc, m) => acc + parseMonto(m.monto), 0);
    const totalGastos = gastos.reduce((acc, m) => acc + parseMonto(m.monto), 0);

    const buckets: Record<string, { ingresos: number; gastos: number }> = {};
    for (let i = 0; i < dias; i++) {
      const d = new Date(desde);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { ingresos: 0, gastos: 0 };
    }

    ingresos.forEach((m) => {
      const fecha = new Date(m.fecha);
      if (fecha >= desde && fecha <= hasta) {
        const key = fecha.toISOString().slice(0, 10);
        if (buckets[key]) buckets[key].ingresos += parseMonto(m.monto);
      }
    });
    gastos.forEach((m) => {
      const fecha = new Date(m.fecha);
      if (fecha >= desde && fecha <= hasta) {
        const key = fecha.toISOString().slice(0, 10);
        if (buckets[key]) buckets[key].gastos += parseMonto(m.monto);
      }
    });

    const datosGrafico = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, v]) => ({
        periodo: new Date(fecha).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
        }),
        ingresos: Math.round(v.ingresos),
        gastos: Math.round(v.gastos),
      }));

    const recientesIngresos = [...ingresos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);
    const recientesGastos = [...gastos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);

    return {
      datosGrafico,
      totalIngresos,
      totalGastos,
      recientesIngresos,
      recientesGastos,
    };
  }, [movimientos, periodo]);

  const formatMonto = (n: number) =>
    `$${Math.abs(Math.round(n)).toLocaleString('es-AR')}`;

  if (loading) {
    return (
      <div className="p-6 w-full bg-white rounded-lg shadow">
        <h2 className="mb-4 text-lg font-medium text-center">Gastos e ingresos</h2>
        <div className="flex justify-center items-center py-12 text-gray-500">
          Cargando movimientos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 w-full bg-white rounded-lg shadow">
        <h2 className="mb-4 text-lg font-medium text-center">Gastos e ingresos</h2>
        <div className="flex justify-center items-center py-12 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full bg-white rounded-lg shadow">
      <h2 className="mb-4 text-lg font-medium text-center">Gastos e ingresos</h2>

      {/* Selector de período */}
      <div className="flex justify-center gap-2 mb-4">
        {(Object.keys(PERIODO_LABELS) as PeriodoKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriodo(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              periodo === key
                ? 'bg-blue-100 text-blue-700 border-blue-300'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {PERIODO_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Total ingresos</p>
          <p className="text-xl font-bold text-green-800">{formatMonto(totalIngresos)}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 font-medium">Total gastos</p>
          <p className="text-xl font-bold text-red-800">{formatMonto(totalGastos)}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[280px] w-full mb-6">
        {datosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value: number) => [formatMonto(value), '']}
                labelFormatter={(label) => `Día: ${label}`}
              />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-full text-gray-400 text-sm">
            No hay datos en el período seleccionado
          </div>
        )}
      </div>

      {/* Listados recientes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <ShoppingCartIcon className="w-4 h-4 text-green-500" />
            Últimos ingresos
          </h3>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {recientesIngresos.length === 0 ? (
              <li className="text-sm text-gray-400">Sin registros</li>
            ) : (
              recientesIngresos.map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center text-sm py-1 border-b border-gray-100"
                >
                  <span className="text-gray-700 truncate max-w-[180px]" title={m.descripcion}>
                    {m.descripcion || 'Venta'}
                  </span>
                  <span className="font-medium text-green-700 shrink-0">
                    {formatMonto(parseMonto(m.monto))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <MinusCircleIcon className="w-4 h-4 text-red-500" />
            Últimos gastos
          </h3>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {recientesGastos.length === 0 ? (
              <li className="text-sm text-gray-400">Sin registros</li>
            ) : (
              recientesGastos.map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center text-sm py-1 border-b border-gray-100"
                >
                  <span className="text-gray-700 truncate max-w-[180px]" title={m.descripcion}>
                    {m.descripcion || m.detalles?.concepto || 'Gasto'}
                  </span>
                  <span className="font-medium text-red-700 shrink-0">
                    {formatMonto(parseMonto(m.monto))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
