import type {
  CuentaCorrienteResumen,
  ProductoVenta,
  ResumenEnvases,
} from '@/lib/services/repartidorRapidoService';

export type OperacionResumenWhatsApp = 'venta' | 'fiado' | 'cobro' | 'envase';

export interface ProductoCatalogoMinimo {
  id: number;
  nombreProducto: string;
}

export interface ItemEnvaseResumen {
  producto_id: number;
  cantidad: number;
  producto_nombre?: string;
}

export interface DatosEstadoCuentaWhatsApp {
  clienteNombre: string;
  cuenta: CuentaCorrienteResumen | null;
  saldoActual?: number;
  envases: ResumenEnvases | null;
  direccion?: string;
}

export interface DatosResumenWhatsApp {
  operacion: OperacionResumenWhatsApp;
  clienteNombre: string;
  cuenta: CuentaCorrienteResumen | null;
  saldoActual?: number;
  envases: ResumenEnvases | null;
  productosCatalogo?: ProductoCatalogoMinimo[];
  productosVenta?: ProductoVenta[];
  montoFiadoFijo?: number;
  montoTotal?: number;
  montoPagado?: number;
  formaPago?: 'total' | 'parcial';
  medioPago?: string;
  montoCobro?: number;
  tipoMovimientoEnvase?: 'PRESTAMO' | 'DEVOLUCION' | 'AJUSTE';
  itemsEnvase?: ItemEnvaseResumen[];
  observaciones?: string;
}

const NOMBRE_COMERCIO = 'Sodería Don Javier';

function formatearMonto(valor: number): string {
  return `$${Math.round(valor).toLocaleString('es-AR')}`;
}

function etiquetaMedioPago(medio?: string): string {
  if (!medio) return '';
  if (medio === 'efectivo') return 'Efectivo';
  if (medio === 'transferencia') return 'Transferencia';
  return medio;
}

function nombreProducto(
  productoId: number | string,
  catalogo: ProductoCatalogoMinimo[] = []
): string {
  const id = typeof productoId === 'string' ? Number(productoId) : productoId;
  const producto = catalogo.find((item) => item.id === id);
  return producto?.nombreProducto || `Producto #${productoId}`;
}

function lineasProductosVenta(
  items: ProductoVenta[],
  catalogo: ProductoCatalogoMinimo[]
): string {
  if (!items.length) return '';
  return items
    .map((item) => {
      const nombre = nombreProducto(item.producto_id, catalogo);
      const subtotal = item.precio_unitario * item.cantidad;
      return `• ${nombre} x${item.cantidad}: ${formatearMonto(subtotal)}`;
    })
    .join('\n');
}

function lineasSaldoEnvases(envases: ResumenEnvases | null): string {
  if (!envases?.saldo_actual?.length) {
    return 'Sin envases en préstamo.';
  }
  return envases.saldo_actual
    .map((item) => `• ${item.producto_nombre} (${item.capacidad}L): ${item.cantidad} u.`)
    .join('\n');
}

function tituloOperacion(datos: DatosResumenWhatsApp): string {
  switch (datos.operacion) {
    case 'venta':
      return '✅ Venta registrada';
    case 'fiado':
      return '📋 Fiado registrado';
    case 'cobro':
      return '💵 Cobro registrado';
    case 'envase':
      if (datos.tipoMovimientoEnvase === 'DEVOLUCION') return '🔄 Devolución de envases';
      if (datos.tipoMovimientoEnvase === 'AJUSTE') return '📝 Ajuste de envases';
      return '📦 Préstamo de envases';
    default:
      return '✅ Movimiento registrado';
  }
}

export function construirMensajeResumenCliente(datos: DatosResumenWhatsApp): string {
  const saldo =
    datos.saldoActual ??
    datos.cuenta?.saldo_actual ??
    0;
  const lineas: string[] = [
    `Hola ${datos.clienteNombre}!`,
    '',
    `${tituloOperacion(datos)} — *${NOMBRE_COMERCIO}*`,
    `Fecha: ${new Date().toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    '',
  ];

  if (datos.operacion === 'venta' || datos.operacion === 'fiado') {
    const productos = datos.productosVenta || [];
    if (productos.length > 0) {
      lineas.push('*Detalle*');
      lineas.push(lineasProductosVenta(productos, datos.productosCatalogo || []));
      lineas.push('');
    }
    if (datos.montoFiadoFijo != null && datos.montoFiadoFijo > 0) {
      lineas.push(`Monto fijo: ${formatearMonto(datos.montoFiadoFijo)}`);
    }
    if (datos.montoTotal != null) {
      lineas.push(`Total: ${formatearMonto(datos.montoTotal)}`);
    }
    if (datos.operacion === 'venta') {
      if (datos.formaPago === 'parcial' && datos.montoPagado != null) {
        lineas.push(`Pagado: ${formatearMonto(datos.montoPagado)} (${etiquetaMedioPago(datos.medioPago)})`);
        lineas.push(`Queda a cuenta: ${formatearMonto(datos.montoTotal! - datos.montoPagado)}`);
      } else if (datos.montoPagado != null && datos.montoPagado > 0) {
        lineas.push(`Pagado: ${formatearMonto(datos.montoPagado)} (${etiquetaMedioPago(datos.medioPago)})`);
      }
    }
    lineas.push('');
  }

  if (datos.operacion === 'cobro' && datos.montoCobro != null) {
    lineas.push(`Monto cobrado: ${formatearMonto(datos.montoCobro)}`);
    if (datos.medioPago) {
      lineas.push(`Medio: ${etiquetaMedioPago(datos.medioPago)}`);
    }
    lineas.push('');
  }

  if (datos.operacion === 'envase' && datos.itemsEnvase?.length) {
    lineas.push('*Movimiento*');
    for (const item of datos.itemsEnvase) {
      const nombre =
        item.producto_nombre || nombreProducto(item.producto_id, datos.productosCatalogo || []);
      lineas.push(`• ${nombre}: ${item.cantidad} u.`);
    }
    lineas.push('');
  }

  lineas.push('*Estado de cuenta*');
  lineas.push(`Saldo actual: ${formatearMonto(saldo)}`);
  lineas.push('');
  lineas.push('*Envases prestados*');
  lineas.push(lineasSaldoEnvases(datos.envases));

  if (datos.observaciones?.trim()) {
    lineas.push('');
    lineas.push(`Obs: ${datos.observaciones.trim()}`);
  }

  lineas.push('');
  lineas.push('Gracias por confiar en nosotros.');

  return lineas.join('\n');
}

/** Reporte completo de estado de cuenta y envases (sin operación reciente). */
export function construirMensajeEstadoCuentaCliente(datos: DatosEstadoCuentaWhatsApp): string {
  const saldo = datos.saldoActual ?? datos.cuenta?.saldo_actual ?? 0;
  const lineas: string[] = [
    `Hola ${datos.clienteNombre}!`,
    '',
    `*Estado de cuenta* — ${NOMBRE_COMERCIO}`,
    `Fecha: ${new Date().toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    '',
  ];

  if (datos.direccion?.trim()) {
    lineas.push(`Dirección: ${datos.direccion.trim()}`);
    lineas.push('');
  }

  lineas.push('*Cuenta corriente*');
  lineas.push(`Saldo actual: ${formatearMonto(saldo)}`);

  if (datos.cuenta) {
    lineas.push(`Total débitos: ${formatearMonto(datos.cuenta.total_debitos)}`);
    lineas.push(`Total cobrado: ${formatearMonto(datos.cuenta.total_creditos)}`);
    if (datos.cuenta.ultimo_movimiento_at) {
      lineas.push(
        `Último movimiento: ${new Date(datos.cuenta.ultimo_movimiento_at).toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`
      );
    }
  }

  lineas.push('');
  lineas.push('*Envases prestados*');
  const totalEnvases = datos.envases?.cantidad_total ?? 0;
  lineas.push(`Total: ${totalEnvases} unidad${totalEnvases === 1 ? '' : 'es'}`);
  lineas.push(lineasSaldoEnvases(datos.envases));

  lineas.push('');
  lineas.push('Cualquier consulta, estamos a disposición.');
  lineas.push('Gracias por confiar en nosotros.');

  return lineas.join('\n');
}

function esDispositivoMovil(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/** Normaliza teléfono argentino (solo dígitos, prefijo 54). */
export function normalizarTelefonoWhatsApp(telefono: string): string | null {
  let digitos = telefono.replace(/\D/g, '');
  if (digitos.length < 8) return null;

  if (digitos.startsWith('0')) {
    digitos = digitos.slice(1);
  }

  if (!digitos.startsWith('54')) {
    digitos = `54${digitos}`;
  }

  if (digitos.startsWith('54') && digitos.length >= 10 && digitos[2] !== '9') {
    digitos = `549${digitos.slice(2)}`;
  }

  return digitos.length >= 10 ? digitos : null;
}

/**
 * Abre WhatsApp personal (no Business): app en móvil, WhatsApp Web en escritorio.
 */
export function abrirWhatsAppConMensaje(telefono: string, mensaje: string): boolean {
  const numero = normalizarTelefonoWhatsApp(telefono);
  if (!numero) return false;

  const textoCodificado = encodeURIComponent(mensaje);

  if (esDispositivoMovil()) {
    window.location.href = `whatsapp://send?phone=${numero}&text=${textoCodificado}`;
    return true;
  }

  window.open(
    `https://web.whatsapp.com/send?phone=${numero}&text=${textoCodificado}`,
    '_blank',
    'noopener,noreferrer'
  );
  return true;
}
