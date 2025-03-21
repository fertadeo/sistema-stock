import { ReactNode } from 'react';

export interface Proceso {
  id: number;
  productos_devueltos: { producto_id: number; cantidad: number; }[];
  productos_vendidos: number;
  observaciones: string;
  fecha_descarga: string;
  estado_cuenta: string;
  monto_total: string;
  ganancia_repartidor: string | null;
  ganancia_empresa: string | null;
  porcentaje_repartidor: number | null;
  porcentaje_empresa: number | null;
  repartidor: {
    id: number;
    nombre: string;
    telefono: string;
    zona_reparto: string;
    activo: boolean;
    fecha_registro: string;
  };
  carga: {
    id: number;
    repartidor_id: number;
    fecha_carga: string;
    estado: string;
    items: {
      id: number;
      carga_id: number;
      producto_id: number;
      cantidad: number;
      producto: {
        id: number;
        nombreProducto: string;
        precioPublico: number;
        precioRevendedor: number;
        cantidadStock: number | null;
        descripcion: string | null;
      };
    }[];
  };
  precio_total_venta: number;
} 