import { authFetch } from '@/lib/api/fetchWithAuth';

const API_BASE_URL = (() => {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');
})();

type MedioPago = 'efectivo' | 'transferencia' | 'debito' | 'credito';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: PaginacionMeta;
  message?: string;
}

export interface PaginacionMeta {
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface ZonaCliente {
  id: number;
  nombre: string;
}

export interface ClienteBasico {
  id: number;
  dni?: string;
  nombre: string;
  email?: string;
  telefono: string;
  direccion?: string;
  latitud?: number | null;
  longitud?: number | null;
  fecha_alta?: string;
  estado?: boolean;
  repartidor?: string;
  dia_reparto?: string;
  zona?: number | null;
  envases_prestados?: Array<{
    id?: number;
    cliente_id?: number;
    producto_id: number;
    producto_nombre?: string;
    capacidad?: number;
    cantidad: number;
    fecha_prestamo?: string;
  }>;
  historial_ventas?: Array<{
    venta_id: string;
    monto_total: string;
    medio_pago: MedioPago;
    forma_pago: 'total' | 'parcial';
    saldo: boolean;
    saldo_monto?: string | null;
    fecha_venta: string;
    tipo: 'LOCAL' | 'REPARTIDOR' | 'REVENDEDOR';
    observaciones?: string | null;
  }>;
  cliente_vinculado_id?: number | null;
  cliente_vinculado?: ClienteVinculadoResumen | null;
  resumen_domicilio?: ResumenDomicilio | null;
}

export interface ClienteVinculadoResumen {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  saldo_actual: number;
}

export interface ResumenDomicilio {
  clientes: ClienteVinculadoResumen[];
  saldo_total: number;
}

export interface ClienteDeudor {
  cliente_id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  estado: boolean;
  zona: number | null;
  repartidor: string;
  dia_reparto: string;
  saldo_actual: number;
  total_debitos: number;
  total_creditos: number;
  cantidad_movimientos: number;
  ultimo_movimiento_at: string | null;
}

export interface ProductoVenta {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

export interface EnvaseMovimiento {
  producto_id: number;
  cantidad: number;
}

export interface VentaRapidaData {
  cliente_id: number;
  productos: ProductoVenta[];
  monto_total: number;
  medio_pago: MedioPago;
  forma_pago?: 'total' | 'parcial';
  saldo_monto?: number;
  repartidor_id?: number;
  envases_prestados?: EnvaseMovimiento[];
  envases_devueltos?: EnvaseMovimiento[];
  observaciones?: string;
}

export interface CobroRapidoData {
  cliente_id: number;
  monto: number;
  medio_pago: MedioPago;
  repartidor_id?: number;
  venta_relacionada_id?: string;
  observaciones?: string;
}

export interface FiadoRapidoData {
  cliente_id: number;
  productos: ProductoVenta[];
  monto_total: number;
  repartidor_id?: number;
  envases_prestados?: EnvaseMovimiento[];
  observaciones?: string;
}

export interface CuentaCorrienteResumen {
  cliente: {
    id: number;
    nombre: string;
    telefono: string;
    direccion: string;
    estado: boolean;
    zona: number | null;
    repartidor: string;
    dia_reparto: string;
  };
  saldo_actual: number;
  total_debitos: number;
  total_creditos: number;
  cantidad_movimientos: number;
  ultimo_movimiento_at: string | null;
}

export interface MovimientoCuentaCorriente {
  id: string;
  fecha: string;
  tipo: 'DEBITO_VENTA' | 'CREDITO_COBRO';
  origen: 'VENTA' | 'COBRO';
  referencia_id: string;
  descripcion: string;
  debito: number;
  credito: number;
  saldo_acumulado: number;
  medio_pago: MedioPago | null;
  observaciones: string | null;
  venta_relacionada_id: string | null;
}

export interface CobroCliente {
  id: number;
  cliente_id: number;
  nombre_cliente: string;
  monto: number;
  medio_pago: MedioPago;
  observaciones: string | null;
  venta_relacionada_id: string | null;
  repartidor_id: number | null;
  fecha_cobro: string;
}

export interface ResumenEnvases {
  cliente_id: number;
  saldo_actual: Array<{
    producto_id: number;
    producto_nombre: string;
    capacidad: number;
    cantidad: number;
  }>;
  cantidad_total: number;
  ultimo_movimiento_at: string | null;
}

export interface MovimientoEnvaseDetalle {
  id: number;
  cliente_id: number;
  producto_id: number;
  producto_nombre: string;
  capacidad: number;
  tipo: 'PRESTAMO' | 'DEVOLUCION' | 'AJUSTE';
  cantidad: number;
  observaciones: string | null;
  repartidor_id: number | null;
  venta_relacionada_id: string | null;
  fecha_movimiento: string;
}

export interface RegistrarMovimientoEnvasesPayload {
  tipo: 'PRESTAMO' | 'DEVOLUCION' | 'AJUSTE';
  items: Array<{
    producto_id: number;
    cantidad: number;
  }>;
  observaciones?: string;
  repartidor_id?: number | null;
  venta_relacionada_id?: string | null;
}

export interface RegistrarMovimientoEnvasesResponse {
  saldo_actual: ResumenEnvases['saldo_actual'];
  cantidad_total: number;
  ultimo_movimiento_at: string | null;
  movimientos_creados: Array<{
    id: number;
    tipo: 'PRESTAMO' | 'DEVOLUCION' | 'AJUSTE';
    cantidad: number;
  }>;
}

export type CategoriaMovimientoRepartidor = 'venta' | 'fiado' | 'cobro' | 'envase';

export type FiltroMovimientoRepartidor = 'todos' | CategoriaMovimientoRepartidor;

export interface MovimientoOperativoRepartidor {
  id: string;
  categoria: CategoriaMovimientoRepartidor;
  fecha: string;
  titulo: string;
  subtitulo?: string;
  monto: number | null;
  esCredito: boolean;
  clienteId?: number;
  clienteNombre?: string;
  detalleExtra?: string;
}

export interface FiadoDiarioItem {
  id: string;
  referenciaId: string;
  clienteId: number;
  clienteNombre: string;
  monto: number;
  fecha: string;
  descripcion: string;
  cobrado: boolean;
  montoCobrado: number;
  fechaCobro: string | null;
}

export interface ResumenFiadosDiario {
  fecha: string;
  totalFiado: number;
  cantidadFiados: number;
  cantidadCobrados: number;
  totalCobrado: number;
  cantidadPendientes: number;
  totalPendiente: number;
  porcentajeCobrados: number;
  fiados: FiadoDiarioItem[];
}

interface MovimientoAuditoria {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  monto?: string | number;
  detalles?: {
    cliente_id?: number;
    cliente_nombre?: string;
    producto_nombre?: string;
    cantidad?: number;
    tipo_envase?: string;
    venta_id?: string | number;
    venta_relacionada_id?: string | number;
    saldo_monto?: string | number;
    forma_pago?: string;
    saldo?: boolean;
  };
}

class RepartidorRapidoService {
  private readonly maxPaginaApi = 100;

  private buildApiUrl(path: string): string {
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private getRepartidorId(): number | undefined {
    if (typeof window !== 'undefined') {
      const repartidorId = localStorage.getItem('repartidor_id');
      return repartidorId ? parseInt(repartidorId) : undefined;
    }
    return undefined;
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = (data as { message?: string }).message || `Error HTTP: ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  }

  private async parseWrappedResponse<T>(response: Response): Promise<T> {
    const data = await this.parseResponse<ApiEnvelope<T>>(response);
    return data.data;
  }

  async registrarVenta(data: VentaRapidaData): Promise<any> {
    try {
      const response = await authFetch(this.buildApiUrl('/api/repartidor-rapido/venta'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          repartidor_id: data.repartidor_id || this.getRepartidorId(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al registrar venta:', error);
      throw error;
    }
  }

  async registrarCobro(data: CobroRapidoData): Promise<{ cobro: CobroCliente; saldo_actual: number }> {
    try {
      const { cliente_id, ...payload } = data;
      const response = await authFetch(this.buildApiUrl(`/api/clientes/${cliente_id}/cobros`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          repartidor_id: data.repartidor_id || this.getRepartidorId() || null,
        }),
      });

      return await this.parseWrappedResponse<{ cobro: CobroCliente; saldo_actual: number }>(response);
    } catch (error) {
      console.error('Error al registrar cobro:', error);
      throw error;
    }
  }

  async registrarFiado(data: FiadoRapidoData): Promise<any> {
    try {
      const response = await authFetch(this.buildApiUrl('/api/repartidor-rapido/fiado'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          repartidor_id: data.repartidor_id || this.getRepartidorId(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al registrar fiado:', error);
      throw error;
    }
  }

  async obtenerEnvasesCliente(clienteId: number): Promise<any> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/repartidor-rapido/envases/${clienteId}`));
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener envases del cliente:', error);
      throw error;
    }
  }

  async buscarClientes(termino: string): Promise<ClienteBasico[]> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/clientes?search=${encodeURIComponent(termino)}`));
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      return [];
    }
  }

  /** Obtiene todos los clientes (para búsqueda por coincidencias cercanas cuando search no devuelve resultados) */
  async obtenerTodosClientes(): Promise<ClienteBasico[]> {
    try {
      const response = await authFetch(this.buildApiUrl('/api/clientes'));
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return [];
    }
  }

  async obtenerCliente(clienteId: number): Promise<ClienteBasico> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}`));

      return await this.parseResponse<ClienteBasico>(response);
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }
  }

  async vincularCliente(clienteId: number, clienteVinculadoId: number): Promise<ClienteBasico> {
    const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}/vincular`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_vinculado_id: clienteVinculadoId }),
    });

    const data = await this.parseResponse<{
      success: boolean;
      data: { cliente: ClienteBasico };
    }>(response);

    return data.data.cliente;
  }

  async desvincularCliente(clienteId: number): Promise<ClienteBasico> {
    const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}/vincular`), {
      method: 'DELETE',
    });

    const data = await this.parseResponse<{
      success: boolean;
      data: { cliente: ClienteBasico };
    }>(response);

    return data.data.cliente;
  }

  async obtenerResumenDomicilio(clienteId: number): Promise<ResumenDomicilio> {
    const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}/domicilio/resumen`));
    return this.parseWrappedResponse<ResumenDomicilio>(response);
  }

  async obtenerZonas(): Promise<ZonaCliente[]> {
    try {
      const response = await authFetch(this.buildApiUrl('/api/clientes/zonas'));
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al obtener zonas:', error);
      return [];
    }
  }

  async obtenerClientesDeudores(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    clientes: ClienteDeudor[];
    meta?: PaginacionMeta;
  }> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.search) searchParams.set('search', params.search);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));

      const query = searchParams.toString();
      const response = await authFetch(
        this.buildApiUrl(`/api/clientes/deudores${query ? `?${query}` : ''}`)
      );
      const data = await this.parseResponse<ApiEnvelope<ClienteDeudor[]>>(response);

      return {
        clientes: data.data,
        meta: data.meta,
      };
    } catch (error) {
      console.error('Error al obtener clientes deudores:', error);
      throw error;
    }
  }

  async crearCliente(clienteData: {
    nombre: string;
    telefono: string;
    direccion?: string;
    email?: string;
    dni?: string;
    latitud?: string | number;
    longitud?: string | number;
    repartidor?: string | null;
  }): Promise<any> {
    try {
      const response = await authFetch(this.buildApiUrl('/api/clientes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });

      return await this.parseResponse<any>(response);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  async actualizarCliente(clienteId: number, clienteData: {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    email?: string;
    latitud?: string | number;
    longitud?: string | number;
    repartidor?: string | null;
  }): Promise<any> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });

      return await this.parseResponse<any>(response);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  async obtenerRepartidores(): Promise<Array<{ id: number; nombre: string }>> {
    const response = await authFetch(this.buildApiUrl('/api/repartidores'));
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'No se pudieron cargar los repartidores');
    }
    const lista = Array.isArray(data) ? data : [];
    return lista
      .filter((item: { id?: number; nombre?: string; activo?: boolean }) => item?.nombre?.trim())
      .map((item: { id: number; nombre: string }) => ({
        id: item.id,
        nombre: item.nombre.trim(),
      }));
  }

  async cambiarEstadoCliente(
    clienteId: number,
    estado?: boolean
  ): Promise<{ success: boolean; message: string; cliente: ClienteBasico }> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}/estado`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(estado !== undefined ? { estado } : {}),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar el estado del cliente');
      }

      return {
        success: data.success ?? true,
        message: data.message || 'Estado actualizado',
        cliente: data.cliente,
      };
    } catch (error) {
      console.error('Error al cambiar estado del cliente:', error);
      throw error;
    }
  }

  async obtenerCuentaCorrienteResumen(clienteId: number): Promise<CuentaCorrienteResumen> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}/cuenta-corriente/resumen`));
      return await this.parseWrappedResponse<CuentaCorrienteResumen>(response);
    } catch (error) {
      console.error('Error al obtener resumen de cuenta corriente:', error);
      throw error;
    }
  }

  async obtenerCuentaCorriente(
    clienteId: number,
    params?: {
      desde?: string;
      hasta?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    resumen: CuentaCorrienteResumen;
    movimientos: MovimientoCuentaCorriente[];
    meta?: PaginacionMeta;
  }> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.desde) searchParams.set('desde', params.desde);
      if (params?.hasta) searchParams.set('hasta', params.hasta);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));

      const query = searchParams.toString();
      const response = await authFetch(
        this.buildApiUrl(`/api/clientes/${clienteId}/cuenta-corriente${query ? `?${query}` : ''}`)
      );
      const data = await this.parseResponse<ApiEnvelope<{
        resumen: CuentaCorrienteResumen;
        movimientos: MovimientoCuentaCorriente[];
      }>>(response);

      return {
        resumen: data.data.resumen,
        movimientos: data.data.movimientos,
        meta: data.meta,
      };
    } catch (error) {
      console.error('Error al obtener cuenta corriente del cliente:', error);
      throw error;
    }
  }

  async obtenerCobrosCliente(
    clienteId: number,
    params?: {
      desde?: string;
      hasta?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    cobros: CobroCliente[];
    meta?: PaginacionMeta;
  }> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.desde) searchParams.set('desde', params.desde);
      if (params?.hasta) searchParams.set('hasta', params.hasta);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));

      const query = searchParams.toString();
      const response = await authFetch(
        this.buildApiUrl(`/api/clientes/${clienteId}/cobros${query ? `?${query}` : ''}`)
      );
      const data = await this.parseResponse<ApiEnvelope<CobroCliente[]>>(response);

      return {
        cobros: data.data,
        meta: data.meta,
      };
    } catch (error) {
      console.error('Error al obtener cobros del cliente:', error);
      throw error;
    }
  }

  async obtenerResumenEnvases(clienteId: number): Promise<ResumenEnvases> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}/envases/resumen`));
      return await this.parseWrappedResponse<ResumenEnvases>(response);
    } catch (error) {
      console.error('Error al obtener resumen de envases:', error);
      throw error;
    }
  }

  async obtenerMovimientosEnvases(
    clienteId: number,
    params?: {
      page?: number;
      limit?: number;
      tipo?: 'PRESTAMO' | 'DEVOLUCION' | 'AJUSTE';
    }
  ): Promise<{
    movimientos: MovimientoEnvaseDetalle[];
    meta?: PaginacionMeta;
  }> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.tipo) searchParams.set('tipo', params.tipo);

      const query = searchParams.toString();
      const response = await authFetch(
        this.buildApiUrl(`/api/clientes/${clienteId}/envases/movimientos${query ? `?${query}` : ''}`)
      );
      const data = await this.parseResponse<ApiEnvelope<MovimientoEnvaseDetalle[]>>(response);

      return {
        movimientos: data.data,
        meta: data.meta,
      };
    } catch (error) {
      console.error('Error al obtener movimientos de envases:', error);
      throw error;
    }
  }

  async registrarMovimientoEnvases(
    clienteId: number,
    payload: RegistrarMovimientoEnvasesPayload
  ): Promise<RegistrarMovimientoEnvasesResponse> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/clientes/${clienteId}/envases/movimientos`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          repartidor_id: payload.repartidor_id === undefined ? this.getRepartidorId() || null : payload.repartidor_id,
        }),
      });

      return await this.parseWrappedResponse<RegistrarMovimientoEnvasesResponse>(response);
    } catch (error) {
      console.error('Error al registrar movimiento de envases:', error);
      throw error;
    }
  }

  async obtenerProductos(): Promise<any[]> {
    try {
      const response = await authFetch(this.buildApiUrl('/api/productos'));
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return [];
    }
  }

  async obtenerMovimientosCliente(clienteId: number): Promise<any[]> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/movimientos/cliente/${clienteId}`));
      if (!response.ok) return [];
      const data = await response.json();
      if (data.success && data.movimientos) return data.movimientos;
      if (Array.isArray(data)) return data;
      return [];
    } catch (error) {
      console.error('Error al obtener movimientos del cliente:', error);
      return [];
    }
  }

  /** Obtiene los registros "no encontrado" de un cliente para el historial */
  async obtenerNoEncontradoPorCliente(clienteId: number): Promise<any[]> {
    try {
      const response = await authFetch(this.buildApiUrl(`/api/repartidor-rapido/no-encontrado?cliente_id=${clienteId}`));
      if (!response.ok) return [];
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (data?.registros && Array.isArray(data.registros)) return data.registros;
      return [];
    } catch (error) {
      console.error('Error al obtener registros no encontrado:', error);
      return [];
    }
  }

  private obtenerFechaLocalDeISO(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private esMovimientoFiado(mov: MovimientoCuentaCorriente): boolean {
    if (mov.tipo !== 'DEBITO_VENTA') return false;
    const descripcion = mov.descripcion.toLowerCase();
    return /fiado|saldo|parcial|cr[eé]dito/.test(descripcion);
  }

  async obtenerResumenFiadosPorFecha(fecha: string): Promise<ResumenFiadosDiario> {
    const response = await authFetch(
      this.buildApiUrl(`/api/clientes/fiados-diario?fecha=${encodeURIComponent(fecha)}`)
    );
    const data = await this.parseWrappedResponse<{
      fecha: string;
      totalFiado: number;
      cantidadFiados: number;
      cantidadCobrados: number;
      totalCobrado: number;
      cantidadPendientes: number;
      totalPendiente: number;
      porcentajeCobrados: number;
      fiados: Array<{
        id: string;
        referenciaId: string;
        clienteId: number;
        clienteNombre: string;
        monto: number;
        fecha: string;
        descripcion: string;
        cobrado: boolean;
        montoCobrado: number;
        fechaCobro: string | null;
      }>;
    }>(response);

    return {
      fecha: data.fecha,
      totalFiado: data.totalFiado,
      cantidadFiados: data.cantidadFiados,
      cantidadCobrados: data.cantidadCobrados,
      totalCobrado: data.totalCobrado,
      cantidadPendientes: data.cantidadPendientes,
      totalPendiente: data.totalPendiente,
      porcentajeCobrados: data.porcentajeCobrados,
      fiados: data.fiados.map((fiado) => ({
        id: fiado.id,
        referenciaId: fiado.referenciaId,
        clienteId: fiado.clienteId,
        clienteNombre: fiado.clienteNombre,
        monto: fiado.monto,
        fecha: fiado.fecha,
        descripcion: fiado.descripcion,
        cobrado: fiado.cobrado,
        montoCobrado: fiado.montoCobrado,
        fechaCobro: fiado.fechaCobro,
      })),
    };
  }

  private parseMontoValor(valor: string | number | null | undefined): number | null {
    if (valor == null) return null;
    const numero = typeof valor === 'string' ? Number(valor) : valor;
    return typeof numero === 'number' && !Number.isNaN(numero) ? numero : null;
  }

  private clasificarTipoAuditoria(tipo: string): CategoriaMovimientoRepartidor | null {
    const normalizado = tipo.toUpperCase();
    if (
      normalizado === 'VENTA_RAPIDA' ||
      normalizado === 'VENTA_LOCAL' ||
      normalizado === 'CIERRE_VENTA'
    ) {
      return 'venta';
    }
    if (normalizado === 'FIADO_RAPIDO') return 'fiado';
    if (normalizado === 'COBRO_RAPIDO') return 'cobro';
    if (normalizado === 'MOVIMIENTO_ENVASE' || normalizado.includes('ENVASE')) return 'envase';
    return null;
  }

  private async ejecutarEnLotes<T, R>(
    items: T[],
    tamanoLote: number,
    ejecutar: (item: T) => Promise<R>
  ): Promise<R[]> {
    const resultados: R[] = [];
    for (let i = 0; i < items.length; i += tamanoLote) {
      const lote = items.slice(i, i + tamanoLote);
      const loteResultados = await Promise.all(lote.map(ejecutar));
      resultados.push(...loteResultados);
    }
    return resultados;
  }

  private mapMovimientoCuentaCorriente(
    mov: MovimientoCuentaCorriente,
    clienteId: number,
    clienteNombre: string
  ): MovimientoOperativoRepartidor {
    const esCobro = mov.tipo === 'CREDITO_COBRO';
    const monto = esCobro ? mov.credito : mov.debito;
    const esFiado = !esCobro && this.esMovimientoFiado(mov);
    return {
      id: `cuenta-${mov.id}`,
      categoria: esCobro ? 'cobro' : esFiado ? 'fiado' : 'venta',
      fecha: mov.fecha,
      titulo: mov.descripcion,
      subtitulo: mov.origen === 'COBRO' ? 'Cobro registrado' : 'Cargo en cuenta corriente',
      monto: monto > 0 ? monto : null,
      esCredito: esCobro,
      clienteId,
      clienteNombre,
      detalleExtra: mov.medio_pago
        ? `Medio: ${mov.medio_pago}`
        : mov.observaciones || undefined,
    };
  }

  private mapMovimientoEnvase(
    mov: MovimientoEnvaseDetalle,
    clienteId: number,
    clienteNombre: string
  ): MovimientoOperativoRepartidor {
    const tituloPorTipo =
      mov.tipo === 'PRESTAMO'
        ? 'Préstamo de envase'
        : mov.tipo === 'DEVOLUCION'
          ? 'Devolución de envase'
          : 'Ajuste de envase';
    return {
      id: `envase-${mov.id}`,
      categoria: 'envase',
      fecha: mov.fecha_movimiento,
      titulo: tituloPorTipo,
      subtitulo: `${mov.producto_nombre} (${mov.capacidad}L)`,
      monto: mov.cantidad,
      esCredito: mov.tipo === 'DEVOLUCION',
      clienteId,
      clienteNombre,
      detalleExtra: mov.observaciones || undefined,
    };
  }

  private mapMovimientoAuditoriaCliente(
    mov: MovimientoAuditoria,
    clienteId: number,
    clienteNombre: string
  ): MovimientoOperativoRepartidor | null {
    const detalleClienteId = mov.detalles?.cliente_id;
    if (detalleClienteId != null && detalleClienteId !== clienteId) {
      return null;
    }
    const categoria = this.clasificarTipoAuditoria(mov.tipo);
    if (!categoria) return null;
    const monto = this.parseMontoValor(mov.monto);
    return {
      id: `auditoria-${mov.id}`,
      categoria,
      fecha: mov.fecha,
      titulo: mov.descripcion || mov.tipo,
      monto: monto != null ? Math.abs(monto) : null,
      esCredito: categoria === 'cobro',
      clienteId,
      clienteNombre: mov.detalles?.cliente_nombre || clienteNombre,
      detalleExtra: mov.detalles?.producto_nombre
        ? `${mov.detalles.producto_nombre}${mov.detalles.cantidad ? ` × ${mov.detalles.cantidad}` : ''}`
        : undefined,
    };
  }

  private ordenarMovimientosUnicos(
    movimientos: MovimientoOperativoRepartidor[]
  ): MovimientoOperativoRepartidor[] {
    const unicos = new Map<string, MovimientoOperativoRepartidor>();
    for (const mov of movimientos) {
      unicos.set(mov.id, mov);
    }
    return Array.from(unicos.values()).sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  /** Movimientos operativos de un solo cliente (ventas, fiados, cobros, envases). */
  async obtenerMovimientosOperativosCliente(
    clienteId: number,
    clienteNombre: string
  ): Promise<MovimientoOperativoRepartidor[]> {
    const movimientos: MovimientoOperativoRepartidor[] = [];

    const [cuentaResult, envasesResult, auditoriaLista] = await Promise.all([
      this.obtenerCuentaCorriente(clienteId, { page: 1, limit: 100 }).catch(() => ({
        movimientos: [] as MovimientoCuentaCorriente[],
      })),
      this.obtenerMovimientosEnvases(clienteId, { page: 1, limit: 50 }).catch(() => ({
        movimientos: [] as MovimientoEnvaseDetalle[],
      })),
      this.obtenerMovimientosCliente(clienteId),
    ]);

    for (const mov of cuentaResult.movimientos) {
      movimientos.push(this.mapMovimientoCuentaCorriente(mov, clienteId, clienteNombre));
    }

    for (const mov of envasesResult.movimientos) {
      movimientos.push(this.mapMovimientoEnvase(mov, clienteId, clienteNombre));
    }

    for (const raw of auditoriaLista) {
      const mov = raw as MovimientoAuditoria;
      const mapeado = this.mapMovimientoAuditoriaCliente(
        {
          id: mov.id ?? raw.id,
          tipo: mov.tipo ?? raw.tipo,
          descripcion: mov.descripcion ?? raw.descripcion ?? '',
          fecha: mov.fecha ?? raw.fecha,
          monto: mov.monto ?? raw.monto,
          detalles: mov.detalles ?? raw.detalles,
        },
        clienteId,
        clienteNombre
      );
      if (mapeado) movimientos.push(mapeado);
    }

    return this.ordenarMovimientosUnicos(movimientos);
  }

  /**
   * Agrega ventas/cobros (cuenta corriente + auditoría) y movimientos de envases
   * para el listado operativo del módulo repartidor.
   */
  async obtenerMovimientosOperativos(): Promise<MovimientoOperativoRepartidor[]> {
    const movimientos: MovimientoOperativoRepartidor[] = [];

    try {
      const searchParams = new URLSearchParams({ pagina: '1', porPagina: '150' });
      const response = await authFetch(this.buildApiUrl(`/api/movimientos?${searchParams.toString()}`));
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const lista: MovimientoAuditoria[] = data?.movimientos ?? [];
        for (const mov of lista) {
          const categoria = this.clasificarTipoAuditoria(mov.tipo);
          if (!categoria) continue;
          const monto = this.parseMontoValor(mov.monto);
          movimientos.push({
            id: `auditoria-${mov.id}`,
            categoria,
            fecha: mov.fecha,
            titulo: mov.descripcion || mov.tipo,
            monto: monto != null ? Math.abs(monto) : null,
            esCredito: categoria === 'cobro',
            clienteId: mov.detalles?.cliente_id,
            clienteNombre: mov.detalles?.cliente_nombre,
            detalleExtra: mov.detalles?.producto_nombre
              ? `${mov.detalles.producto_nombre}${mov.detalles.cantidad ? ` × ${mov.detalles.cantidad}` : ''}`
              : undefined,
          });
        }
      }
    } catch (error) {
      console.error('Error al obtener movimientos de auditoría:', error);
    }

    try {
      const { clientes: deudores } = await this.obtenerClientesDeudores({ page: 1, limit: 60 });
      const movimientosCuenta = await this.ejecutarEnLotes(deudores, 2, async (deudor) => {
        try {
          const { movimientos: lista } = await this.obtenerCuentaCorriente(deudor.cliente_id, {
            page: 1,
            limit: 20,
          });
          return lista.map((mov) =>
            this.mapMovimientoCuentaCorriente(mov, deudor.cliente_id, deudor.nombre)
          );
        } catch {
          return [];
        }
      });

      movimientos.push(...movimientosCuenta.flat());
    } catch (error) {
      console.error('Error al obtener movimientos de cuenta corriente:', error);
    }

    try {
      const clientes = await this.obtenerTodosClientes();
      const clientesConEnvases = clientes
        .map((cliente) => ({
          cliente,
          cantidad: (cliente.envases_prestados || []).reduce(
            (total, envase) => total + (Number(envase.cantidad) || 0),
            0
          ),
        }))
        .filter((item) => item.cantidad > 0)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 40);

      const movimientosEnvases = await this.ejecutarEnLotes(clientesConEnvases, 2, async ({ cliente }) => {
        try {
          const { movimientos: lista } = await this.obtenerMovimientosEnvases(cliente.id, {
            page: 1,
            limit: 12,
          });
          return lista.map((mov) =>
            this.mapMovimientoEnvase(mov, cliente.id, cliente.nombre)
          );
        } catch {
          return [];
        }
      });

      movimientos.push(...movimientosEnvases.flat());
    } catch (error) {
      console.error('Error al obtener movimientos de envases:', error);
    }

    return this.ordenarMovimientosUnicos(movimientos);
  }

  /** Registra que el cliente no fue encontrado en la visita (dejar registro) */
  async registrarNoEncontrado(clienteId: number, observaciones?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await authFetch(this.buildApiUrl('/api/repartidor-rapido/no-encontrado'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          repartidor_id: this.getRepartidorId(),
          observaciones: observaciones || 'Cliente no encontrado en la visita',
          fecha: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, message: (err as { message?: string }).message || 'Error al registrar' };
      }
      return { success: true };
    } catch (error) {
      console.error('Error al registrar no encontrado:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }

  async enviarUbicacion(latitud: number, longitud: number): Promise<void> {
    const repartidorId = this.getRepartidorId();
    if (!repartidorId) return;

    const response = await authFetch(this.buildApiUrl('/api/repartidor-rapido/ubicacion'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repartidor_id: repartidorId,
        latitud,
        longitud,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Error al enviar ubicación');
    }
  }

  async obtenerUbicacionRepartidor(repartidorNombre: string): Promise<{
    repartidor_id: number;
    repartidor_nombre: string;
    latitud: number;
    longitud: number;
    actualizado_at: string;
    en_linea: boolean;
  } | null> {
    const response = await authFetch(
      this.buildApiUrl(
        `/api/repartidor-rapido/ubicacion?repartidor=${encodeURIComponent(repartidorNombre)}`
      )
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.data ?? null;
  }

  async obtenerClientesAtendidosHoy(repartidorNombre?: string): Promise<number[]> {
    const params = repartidorNombre
      ? `?repartidor=${encodeURIComponent(repartidorNombre)}`
      : '';
    const response = await authFetch(
      this.buildApiUrl(`/api/repartidor-rapido/clientes-atendidos-hoy${params}`)
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.cliente_ids ?? [];
  }
}

export const repartidorRapidoService = new RepartidorRapidoService();
