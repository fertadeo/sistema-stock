export type TipoProducto = 'venta_publico' | 'insumo';

export const TIPOS_PRODUCTO: { value: TipoProducto; label: string }[] = [
  { value: 'venta_publico', label: 'Venta al público' },
  { value: 'insumo', label: 'Insumo' },
];

export function etiquetaTipoProducto(tipo?: string | null): string {
  const found = TIPOS_PRODUCTO.find((t) => t.value === normalizarTipoProducto(tipo));
  return found?.label ?? 'Venta al público';
}

export function normalizarTipoProducto(tipo?: string | null): TipoProducto {
  const valor = String(tipo ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return valor === 'insumo' ? 'insumo' : 'venta_publico';
}

export function esProductoVentaPublico(producto: { tipoProducto?: string | null }): boolean {
  return normalizarTipoProducto(producto.tipoProducto) === 'venta_publico';
}

export function extraerListaProductos<T = Record<string, unknown>>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.productos)) return obj.productos as T[];
  }
  return [];
}

export type Product = {
  id: number;
  nombreProducto: string;
  descripcion: string;
  cantidad_stock: number;
  precioPublico: number;
  precioRevendedor: number;
  tipoProducto: TipoProducto;
  habilitado?: boolean;
};
