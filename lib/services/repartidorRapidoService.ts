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

class RepartidorRapidoService {
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
      const response = await fetch(this.buildApiUrl('/api/repartidor-rapido/venta'), {
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
      const response = await fetch(this.buildApiUrl(`/api/clientes/${cliente_id}/cobros`), {
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
      const response = await fetch(this.buildApiUrl('/api/repartidor-rapido/fiado'), {
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
      const response = await fetch(this.buildApiUrl(`/api/repartidor-rapido/envases/${clienteId}`));
      
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
      const response = await fetch(this.buildApiUrl(`/api/clientes?search=${encodeURIComponent(termino)}`));
      
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
      const response = await fetch(this.buildApiUrl('/api/clientes'));
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
      const response = await fetch(this.buildApiUrl(`/api/clientes/${clienteId}`));

      return await this.parseResponse<ClienteBasico>(response);
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }
  }

  async obtenerZonas(): Promise<ZonaCliente[]> {
    try {
      const response = await fetch(this.buildApiUrl('/api/clientes/zonas'));
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
      const response = await fetch(
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
  }): Promise<any> {
    try {
      const response = await fetch(this.buildApiUrl('/api/clientes'), {
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
  }): Promise<any> {
    try {
      const response = await fetch(this.buildApiUrl(`/api/clientes/${clienteId}`), {
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

  async obtenerCuentaCorrienteResumen(clienteId: number): Promise<CuentaCorrienteResumen> {
    try {
      const response = await fetch(this.buildApiUrl(`/api/clientes/${clienteId}/cuenta-corriente/resumen`));
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
      const response = await fetch(
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
      const response = await fetch(
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
      const response = await fetch(this.buildApiUrl(`/api/clientes/${clienteId}/envases/resumen`));
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
      const response = await fetch(
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
      const response = await fetch(this.buildApiUrl(`/api/clientes/${clienteId}/envases/movimientos`), {
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
      const response = await fetch(this.buildApiUrl('/api/productos'));
      
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
      const response = await fetch(this.buildApiUrl(`/api/movimientos/cliente/${clienteId}`));
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
      const response = await fetch(this.buildApiUrl(`/api/repartidor-rapido/no-encontrado?cliente_id=${clienteId}`));
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

  /** Registra que el cliente no fue encontrado en la visita (dejar registro) */
  async registrarNoEncontrado(clienteId: number, observaciones?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(this.buildApiUrl('/api/repartidor-rapido/no-encontrado'), {
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
}

export const repartidorRapidoService = new RepartidorRapidoService();
