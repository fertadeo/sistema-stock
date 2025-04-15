import { ReactNode } from 'react';

export interface Proceso {
  id: number;
  fecha_descarga: string;
  fecha_carga: string;
  estado_cuenta: string;
  repartidor: {
    id: number;
    nombre: string;
  };
  productos_detalle: {
    producto_id: number;
    nombre: string;
    cantidad_cargada: number;
    cantidad_devuelta: number;
    cantidad_vendida: number;
    precio_unitario: number;
    subtotal: number;
  }[];
  totales: {
    monto_total: number;
  };
  observaciones: string;
}

export interface VentaCerrada {
  id: number;
  proceso_id: number;
  fecha_cierre: string;
  total_venta: string;
  comision_porcentaje: number;
  ganancia_repartidor: string;
  ganancia_fabrica: string;
  monto_efectivo: string;
  monto_transferencia: string;
  balance_fiado: string;
  estado: string;
  repartidor: {
    id: number;
    nombre: string;
  };
  observaciones: string;
  created_at: string;
} 