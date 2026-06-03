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

export type TipoReporteWhatsApp = 'simple' | 'completo';

export interface OpcionesReporteWhatsApp {
  tipo: TipoReporteWhatsApp;
  incluirMovimientos: boolean;
  incluirEnvases: boolean;
}

export const OPCIONES_REPORTE_WHATSAPP_DEFECTO: OpcionesReporteWhatsApp = {
  tipo: 'simple',
  incluirMovimientos: false,
  incluirEnvases: false,
};

export interface MovimientoReporteWhatsApp {
  categoria: 'venta' | 'fiado' | 'cobro' | 'envase';
  fecha: string;
  titulo: string;
  subtitulo?: string;
  monto: number | null;
  esCredito: boolean;
  detalleExtra?: string;
}

const ETIQUETA_CATEGORIA_REPORTE: Record<MovimientoReporteWhatsApp['categoria'], string> = {
  venta: 'Venta',
  fiado: 'Fiado',
  cobro: 'Cobro',
  envase: 'Envase',
};

function formatearFechaCorta(fecha: string) {
  try {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fecha;
  }
}

function formatearMontoMovimiento(mov: MovimientoReporteWhatsApp): string {
  if (mov.monto == null) return '';
  if (mov.categoria === 'envase') {
    return `${mov.esCredito ? '-' : '+'}${mov.monto} u.`;
  }
  const signo = mov.esCredito ? '+' : '-';
  return `${signo}$${mov.monto.toLocaleString('es-AR')}`;
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

/** Reporte configurable: simple (abreviado) o completo con opciones. */
export function construirMensajeReporteCliente(
  datos: DatosEstadoCuentaWhatsApp,
  opciones: OpcionesReporteWhatsApp,
  movimientos: MovimientoReporteWhatsApp[] = []
): string {
  const saldo = datos.saldoActual ?? datos.cuenta?.saldo_actual ?? 0;
  const totalEnvases = datos.envases?.cantidad_total ?? 0;

  if (opciones.tipo === 'simple') {
    const lineas = [
      `Hola ${datos.clienteNombre}!`,
      '',
      `*${NOMBRE_COMERCIO}*`,
      `Saldo: ${formatearMonto(saldo)}`,
      `Envases: ${totalEnvases} u.`,
      '',
      'Gracias.',
    ];
    return lineas.join('\n');
  }

  const lineas: string[] = [
    `Hola ${datos.clienteNombre}!`,
    '',
    `*Estado de cuenta* — ${NOMBRE_COMERCIO}`,
    `Fecha: ${formatearFechaCorta(new Date().toISOString())}`,
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
      lineas.push(`Último movimiento: ${formatearFechaCorta(datos.cuenta.ultimo_movimiento_at)}`);
    }
  }

  if (opciones.incluirMovimientos && movimientos.length > 0) {
    lineas.push('');
    lineas.push('*Movimientos*');
    const recientes = [...movimientos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 25);
    for (const mov of recientes) {
      const montoTxt = formatearMontoMovimiento(mov);
      const extra = [mov.subtitulo, mov.detalleExtra].filter(Boolean).join(' · ');
      lineas.push(
        `• ${formatearFechaCorta(mov.fecha)} — ${ETIQUETA_CATEGORIA_REPORTE[mov.categoria]}: ${mov.titulo}${
          montoTxt ? ` (${montoTxt})` : ''
        }${extra ? ` — ${extra}` : ''}`
      );
    }
    if (movimientos.length > 25) {
      lineas.push(`… y ${movimientos.length - 25} movimientos más.`);
    }
  }

  if (opciones.incluirEnvases) {
    lineas.push('');
    lineas.push('*Envases prestados*');
    lineas.push(`Total: ${totalEnvases} unidad${totalEnvases === 1 ? '' : 'es'}`);
    lineas.push(lineasSaldoEnvases(datos.envases));
  }

  lineas.push('');
  lineas.push('Cualquier consulta, estamos a disposición.');
  lineas.push('Gracias por confiar en nosotros.');

  return lineas.join('\n');
}

/** Informe de un movimiento puntual (histórico). */
export function construirMensajeMovimientoIndividual(
  movimiento: MovimientoReporteWhatsApp,
  clienteNombre: string,
  saldoActual?: number
): string {
  const lineas = [
    `Hola ${clienteNombre}!`,
    '',
    `*${ETIQUETA_CATEGORIA_REPORTE[movimiento.categoria]}* — ${NOMBRE_COMERCIO}`,
    `Fecha del movimiento: ${formatearFechaCorta(movimiento.fecha)}`,
    '',
    movimiento.titulo,
  ];

  if (movimiento.subtitulo) lineas.push(movimiento.subtitulo);
  if (movimiento.detalleExtra) lineas.push(movimiento.detalleExtra);

  const montoTxt = formatearMontoMovimiento(movimiento);
  if (montoTxt) {
    lineas.push('');
    lineas.push(`Importe: ${montoTxt}`);
  }

  if (saldoActual != null) {
    lineas.push('');
    lineas.push(`Saldo actual de su cuenta: ${formatearMonto(saldoActual)}`);
  }

  lineas.push('');
  lineas.push('Gracias por confiar en nosotros.');

  return lineas.join('\n');
}

/** Reporte completo de estado de cuenta y envases (sin operación reciente). */
export function construirMensajeEstadoCuentaCliente(datos: DatosEstadoCuentaWhatsApp): string {
  return construirMensajeReporteCliente(
    datos,
    { tipo: 'completo', incluirMovimientos: false, incluirEnvases: true },
    []
  );
}
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
