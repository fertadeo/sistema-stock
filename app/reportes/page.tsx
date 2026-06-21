'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ShoppingBagIcon,
  TruckIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchReporte,
  formatMonto,
  rangoMesActual,
  rangoPeriodo,
  ReporteCompleto,
} from '@/lib/services/reportesService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type PeriodoKey = '7d' | '30d' | '90d' | 'mes';

const PERIODOS: { key: PeriodoKey; label: string }[] = [
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
  { key: 'mes', label: 'Mes actual' },
];

const COLORES_CANAL = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#6366f1'];
const COLORES_GASTOS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { font: { size: 12 }, usePointStyle: true, padding: 16 },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      cornerRadius: 8,
    },
  },
};

function tooltipMontoLine(context: TooltipItem<'line'>): string {
  return `${context.dataset.label ?? ''}: ${formatMonto(context.parsed.y ?? 0)}`;
}

function tooltipMontoBar(context: TooltipItem<'bar'>): string {
  const val = context.parsed.y ?? context.parsed.x ?? 0;
  return `${context.dataset.label ?? ''}: ${formatMonto(Number(val))}`;
}

function tooltipMontoDoughnut(context: TooltipItem<'doughnut'>): string {
  return `${context.label}: ${formatMonto(context.parsed)}`;
}

function formatFechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

function KpiCard({
  titulo,
  valor,
  icono,
  color,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
  color: string;
  subtitulo?: string;
}) {
  return (
    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{titulo}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{valor}</p>
          {subtitulo && <p className="mt-1 text-xs text-gray-400">{subtitulo}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>{icono}</div>
      </div>
    </div>
  );
}

export default function ReportesPage() {
  const router = useRouter();
  const { canAccessAdminModule, loading: authLoading } = useAuth();
  const [periodo, setPeriodo] = useState<PeriodoKey>('30d');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState<ReporteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !canAccessAdminModule) {
      router.replace('/home');
    }
  }, [authLoading, canAccessAdminModule, router]);

  const aplicarPeriodo = useCallback((key: PeriodoKey) => {
    const rango =
      key === 'mes' ? rangoMesActual() : rangoPeriodo(key === '7d' ? 7 : key === '30d' ? 30 : 90);
    setPeriodo(key);
    setFechaInicio(rango.inicio);
    setFechaFin(rango.fin);
  }, []);

  useEffect(() => {
    aplicarPeriodo('30d');
  }, [aplicarPeriodo]);

  const cargarReporte = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchReporte(fechaInicio, fechaFin);
      setReporte(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    if (fechaInicio && fechaFin && canAccessAdminModule) {
      void cargarReporte();
    }
  }, [fechaInicio, fechaFin, canAccessAdminModule, cargarReporte]);

  const lineChartData = useMemo(() => {
    if (!reporte) return null;
    return {
      labels: reporte.serieTemporal.map((s) => formatFechaCorta(s.fecha)),
      datasets: [
        {
          label: 'Ingresos',
          data: reporte.serieTemporal.map((s) => s.ingresos),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: 'Egresos',
          data: reporte.serieTemporal.map((s) => s.egresos),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [reporte]);

  const canalChartData = useMemo(() => {
    if (!reporte) return null;
    const canales = [
      { label: 'Local', value: reporte.ingresosPorCanal.local },
      { label: 'Repartidores', value: reporte.ingresosPorCanal.repartidor },
      { label: 'Revendedores', value: reporte.ingresosPorCanal.revendedor },
      { label: 'Cobros CC', value: reporte.ingresosPorCanal.cobros },
      { label: 'Rendiciones', value: reporte.ingresosPorCanal.rendicion },
    ].filter((c) => c.value > 0);

    return {
      labels: canales.map((c) => c.label),
      datasets: [
        {
          data: canales.map((c) => c.value),
          backgroundColor: COLORES_CANAL.slice(0, canales.length),
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  }, [reporte]);

  const gastosChartData = useMemo(() => {
    if (!reporte) return null;
    return {
      labels: reporte.egresosPorCategoria.map((g) => g.categoria),
      datasets: [
        {
          label: 'Monto',
          data: reporte.egresosPorCategoria.map((g) => g.monto),
          backgroundColor: reporte.egresosPorCategoria.map(
            (_, i) => COLORES_GASTOS[i % COLORES_GASTOS.length]
          ),
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }, [reporte]);

  const repartidoresChartData = useMemo(() => {
    if (!reporte) return null;
    const top = reporte.repartidores.slice(0, 8);
    return {
      labels: top.map((r) => r.nombre),
      datasets: [
        {
          label: 'Ventas',
          data: top.map((r) => r.totalVentas),
          backgroundColor: '#14b8a6',
          borderRadius: 4,
        },
        {
          label: 'Ganancia empresa',
          data: top.map((r) => r.gananciaEmpresa),
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        },
      ],
    };
  }, [reporte]);

  const revendedoresChartData = useMemo(() => {
    if (!reporte) return null;
    const top = reporte.revendedores.slice(0, 8);
    return {
      labels: top.map((r) => r.nombre),
      datasets: [
        {
          label: 'Total ventas',
          data: top.map((r) => r.totalVentas),
          backgroundColor: '#8b5cf6',
          borderRadius: 6,
        },
      ],
    };
  }, [reporte]);

  if (authLoading || !canAccessAdminModule) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-gray-500">
        Cargando...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen financiero de la empresa: ingresos, egresos, repartidores y revendedores
        </p>
      </div>

      {/* Filtros de período */}
      <div className="flex flex-wrap gap-3 items-center p-4 mb-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => aplicarPeriodo(p.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                periodo === p.key
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center ml-auto">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => {
              setPeriodo('30d');
              setFechaInicio(e.target.value);
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => {
              setPeriodo('30d');
              setFechaFin(e.target.value);
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          />
          <button
            type="button"
            onClick={() => void cargarReporte()}
            className="px-4 py-1.5 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600"
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-20 text-gray-500">
          Cargando reportes...
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {!loading && reporte && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              titulo="Total ingresos"
              valor={formatMonto(reporte.resumen.totalIngresos)}
              icono={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
              color="bg-green-500"
              subtitulo={`${reporte.resumen.cantidadVentas} ventas registradas`}
            />
            <KpiCard
              titulo="Total egresos"
              valor={formatMonto(reporte.resumen.totalEgresos)}
              icono={<ArrowTrendingDownIcon className="w-6 h-6 text-white" />}
              color="bg-red-500"
              subtitulo={`${reporte.gastosDetalle.length} gastos en el período`}
            />
            <KpiCard
              titulo="Balance neto"
              valor={formatMonto(reporte.resumen.balance)}
              icono={<ScaleIcon className="w-6 h-6 text-white" />}
              color={reporte.resumen.balance >= 0 ? 'bg-teal-500' : 'bg-orange-500'}
            />
            <KpiCard
              titulo="Movimientos"
              valor={String(reporte.resumen.cantidadMovimientos)}
              icono={<ShoppingBagIcon className="w-6 h-6 text-white" />}
              color="bg-blue-500"
              subtitulo={`${reporte.repartidores.length} repartidores activos`}
            />
          </div>

          {/* Gráfico principal: evolución */}
          <div className="p-5 mb-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Evolución de ingresos y egresos
            </h2>
            <div className="h-[320px]">
              {lineChartData && reporte.serieTemporal.length > 0 ? (
                <Line
                  data={lineChartData}
                  options={{
                    ...chartDefaults,
                    plugins: {
                      ...chartDefaults.plugins,
                      tooltip: {
                        ...chartDefaults.plugins.tooltip,
                        callbacks: { label: tooltipMontoLine },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (v) => `$${Number(v).toLocaleString('es-AR')}`,
                        },
                        grid: { color: 'rgba(0,0,0,0.05)' },
                      },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              ) : (
                <div className="flex justify-center items-center h-full text-gray-400">
                  Sin datos en el período seleccionado
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
            {/* Ingresos por canal */}
            <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">Ingresos por canal</h2>
              <div className="h-[280px] flex items-center justify-center">
                {canalChartData && canalChartData.labels.length > 0 ? (
                  <Doughnut
                    data={canalChartData}
                    options={{
                      ...chartDefaults,
                      cutout: '60%',
                      plugins: {
                        ...chartDefaults.plugins,
                        legend: { position: 'right' as const },
                        tooltip: {
                          ...chartDefaults.plugins.tooltip,
                          callbacks: { label: tooltipMontoDoughnut },
                        },
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-400">Sin ingresos registrados</p>
                )}
              </div>
            </div>

            {/* Gastos por categoría */}
            <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">
                Gastos por categoría
              </h2>
              <p className="mb-3 text-xs text-gray-400">
                Incluye sueldos, combustible, impuestos y demás egresos
              </p>
              <div className="h-[280px]">
                {gastosChartData && reporte.egresosPorCategoria.length > 0 ? (
                  <Bar
                    data={gastosChartData}
                    options={{
                      ...chartDefaults,
                      indexAxis: 'y' as const,
                      scales: {
                        x: {
                          beginAtZero: true,
                          ticks: {
                            callback: (v) => `$${Number(v).toLocaleString('es-AR')}`,
                          },
                          grid: { color: 'rgba(0,0,0,0.05)' },
                        },
                        y: { grid: { display: false } },
                      },
                      plugins: {
                        ...chartDefaults.plugins,
                        legend: { display: false },
                        tooltip: {
                          ...chartDefaults.plugins.tooltip,
                          callbacks: { label: tooltipMontoBar },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    Sin gastos registrados
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Repartidores y revendedores */}
          <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
            <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex gap-2 items-center mb-4">
                <TruckIcon className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-semibold text-gray-800">Repartidores</h2>
              </div>
              <div className="h-[300px]">
                {repartidoresChartData && reporte.repartidores.length > 0 ? (
                  <Bar
                    data={repartidoresChartData}
                    options={{
                      ...chartDefaults,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (v) => `$${Number(v).toLocaleString('es-AR')}`,
                          },
                          grid: { color: 'rgba(0,0,0,0.05)' },
                        },
                        x: { grid: { display: false } },
                      },
                    }}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    Sin cierres de repartidores en el período
                  </div>
                )}
              </div>
              {reporte.repartidores.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-2">Repartidor</th>
                        <th className="py-2 pr-2 text-right">Ventas</th>
                        <th className="py-2 pr-2 text-right">Comisión</th>
                        <th className="py-2 text-right">Empresa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.repartidores.map((r) => (
                        <tr key={r.id} className="border-b border-gray-50">
                          <td className="py-2 pr-2 font-medium">{r.nombre}</td>
                          <td className="py-2 pr-2 text-right">{formatMonto(r.totalVentas)}</td>
                          <td className="py-2 pr-2 text-right text-orange-600">
                            {formatMonto(r.gananciaRepartidor)}
                          </td>
                          <td className="py-2 text-right text-teal-600">
                            {formatMonto(r.gananciaEmpresa)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex gap-2 items-center mb-4">
                <BuildingStorefrontIcon className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">Revendedores</h2>
              </div>
              <div className="h-[300px]">
                {revendedoresChartData && reporte.revendedores.length > 0 ? (
                  <Bar
                    data={revendedoresChartData}
                    options={{
                      ...chartDefaults,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (v) => `$${Number(v).toLocaleString('es-AR')}`,
                          },
                          grid: { color: 'rgba(0,0,0,0.05)' },
                        },
                        x: { grid: { display: false } },
                      },
                      plugins: {
                        ...chartDefaults.plugins,
                        legend: { display: false },
                      },
                    }}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    Sin ventas a revendedores en el período
                  </div>
                )}
              </div>
              {reporte.revendedores.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-2">Revendedor</th>
                        <th className="py-2 pr-2 text-right">Ventas</th>
                        <th className="py-2 text-right">Monto total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.revendedores.map((r) => (
                        <tr key={r.nombre} className="border-b border-gray-50">
                          <td className="py-2 pr-2 font-medium">{r.nombre}</td>
                          <td className="py-2 pr-2 text-right">{r.cantidadVentas}</td>
                          <td className="py-2 text-right text-purple-600">
                            {formatMonto(r.totalVentas)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Detalle de gastos */}
          <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Detalle de gastos y egresos
            </h2>
            {reporte.gastosDetalle.length === 0 ? (
              <p className="text-gray-400">No hay gastos registrados en el período</p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-3">Fecha</th>
                      <th className="py-2 pr-3">Concepto</th>
                      <th className="py-2 pr-3">Categoría</th>
                      <th className="py-2 pr-3">Proveedor</th>
                      <th className="py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.gastosDetalle.map((g) => (
                      <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 pr-3 whitespace-nowrap text-gray-600">
                          {new Date(g.fecha).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-2 pr-3">{g.concepto}</td>
                        <td className="py-2 pr-3">
                          <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 rounded-full">
                            {g.categoria}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-gray-500">{g.proveedor || '—'}</td>
                        <td className="py-2 text-right font-medium text-red-600">
                          {formatMonto(g.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
