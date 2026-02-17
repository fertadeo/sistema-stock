const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
  medio_pago: 'efectivo' | 'transferencia' | 'debito' | 'credito';
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
  medio_pago: 'efectivo' | 'transferencia' | 'debito' | 'credito';
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

class RepartidorRapidoService {
  private getRepartidorId(): number | undefined {
    if (typeof window !== 'undefined') {
      const repartidorId = localStorage.getItem('repartidor_id');
      return repartidorId ? parseInt(repartidorId) : undefined;
    }
    return undefined;
  }

  async registrarVenta(data: VentaRapidaData): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/repartidor-rapido/venta`, {
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

  async registrarCobro(data: CobroRapidoData): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/repartidor-rapido/cobro`, {
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
      console.error('Error al registrar cobro:', error);
      throw error;
    }
  }

  async registrarFiado(data: FiadoRapidoData): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/repartidor-rapido/fiado`, {
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
      const response = await fetch(`${API_URL}/api/repartidor-rapido/envases/${clienteId}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener envases del cliente:', error);
      throw error;
    }
  }

  async buscarClientes(termino: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/clientes?search=${encodeURIComponent(termino)}`);
      
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
  async obtenerTodosClientes(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/clientes`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return [];
    }
  }

  async obtenerCliente(clienteId: number): Promise<any> {
    try {
      // Backend expone GET un cliente en /clientes/:id (sin prefijo /api)
      const response = await fetch(`${API_URL}/api/clientes/${clienteId}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener cliente:', error);
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
      const response = await fetch(`${API_URL}/api/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      return await response.json();
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
      // Backend expone PUT en /clientes/:id (sin prefijo /api)
      const response = await fetch(`${API_URL}/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  async obtenerProductos(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/productos`);
      
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
      const response = await fetch(`${API_URL}/api/movimientos/cliente/${clienteId}`);
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

  /** Registra que el cliente no fue encontrado en la visita (dejar registro) */
  async registrarNoEncontrado(clienteId: number, observaciones?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/repartidor-rapido/no-encontrado`, {
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
