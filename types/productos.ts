export type TipoProducto = 'venta_publico' | 'insumo';

export const TIPOS_PRODUCTO: { value: TipoProducto; label: string }[] = [
  { value: 'venta_publico', label: 'Venta al público' },
  { value: 'insumo', label: 'Insumo' },
];

export function etiquetaTipoProducto(tipo?: string | null): string {
  const found = TIPOS_PRODUCTO.find((t) => t.value === tipo);
  return found?.label ?? 'Venta al público';
}

export function normalizarTipoProducto(tipo?: string | null): TipoProducto {
  return tipo === 'insumo' ? 'insumo' : 'venta_publico';
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
