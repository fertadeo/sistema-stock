import { authFetch, createApiUrl } from '@/lib/api/fetchWithAuth';

export interface ReporteCompleto {
  periodo: { fechaInicio: string; fechaFin: string };
  resumen: {
    totalIngresos: number;
    totalEgresos: number;
    balance: number;
    cantidadVentas: number;
    cantidadMovimientos: number;
  };
  ingresosPorCanal: {
    local: number;
    repartidor: number;
    revendedor: number;
    cobros: number;
    rendicion: number;
  };
  egresosPorCategoria: Array<{ categoria: string; monto: number; cantidad: number }>;
  serieTemporal: Array<{ fecha: string; ingresos: number; egresos: number }>;
  repartidores: Array<{
    id: number;
    nombre: string;
    totalVentas: number;
    gananciaRepartidor: number;
    gananciaEmpresa: number;
    cantidadCierres: number;
  }>;
  revendedores: Array<{
    nombre: string;
    totalVentas: number;
    cantidadVentas: number;
  }>;
  gastosDetalle: Array<{
    id: number;
    fecha: string;
    concepto: string;
    categoria: string;
    monto: number;
    proveedor: string;
  }>;
}

export async function fetchReporte(
  fechaInicio: string,
  fechaFin: string
): Promise<ReporteCompleto> {
  const params = new URLSearchParams({ fechaInicio, fechaFin });
  const response = await authFetch(createApiUrl(`api/reportes?${params}`));

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Error al cargar el reporte');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Error al cargar el reporte');
  }

  return data as ReporteCompleto;
}

export function formatMonto(n: number): string {
  return `$${Math.abs(Math.round(n)).toLocaleString('es-AR')}`;
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function rangoPeriodo(dias: number): { inicio: string; fin: string } {
  const fin = new Date();
  const inicio = new Date(fin);
  inicio.setDate(inicio.getDate() - dias + 1);
  return { inicio: toDateInputValue(inicio), fin: toDateInputValue(fin) };
}

export function rangoMesActual(): { inicio: string; fin: string } {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return { inicio: toDateInputValue(inicio), fin: toDateInputValue(hoy) };
}
