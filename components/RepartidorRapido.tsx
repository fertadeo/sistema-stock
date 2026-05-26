'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  PencilIcon,
  BanknotesIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid';
import {
  repartidorRapidoService,
  ProductoVenta,
  EnvaseMovimiento,
  CuentaCorrienteResumen,
  ResumenEnvases,
  MovimientoCuentaCorriente,
  MovimientoEnvaseDetalle,
  RegistrarMovimientoEnvasesPayload,
} from '@/lib/services/repartidorRapidoService';

interface EnvasePrestadoCliente {
  producto_id: number;
  producto_nombre?: string;
  capacidad?: number;
  cantidad: number;
}

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion?: string;
  email?: string;
  deuda?: number;
  envases_prestados?: EnvasePrestadoCliente[];
  activo?: boolean;
}

interface Producto {
  id: number;
  nombreProducto: string;
  precioPublico: number;
  precioRevendedor?: number;
  cantidadStock?: number;
}

type MedioPago = 'efectivo' | 'transferencia' | 'debito' | 'credito';
type TipoOperacion = 'venta' | 'fiado' | 'cobro';

export default function RepartidorRapido() {
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [mostrarModalVenta, setMostrarModalVenta] = useState(false);
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [mostrarModalEnvases, setMostrarModalEnvases] = useState(false);
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>('venta');
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const [montoPagado, setMontoPagado] = useState(0);
  const [formaPago, setFormaPago] = useState<'total' | 'parcial'>('total');
  const [montoCobro, setMontoCobro] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [envasesPrestados, setEnvasesPrestados] = useState<EnvaseMovimiento[]>([]);
  const [envasesDevueltos, setEnvasesDevueltos] = useState<EnvaseMovimiento[]>([]);
  const [resumenCuenta, setResumenCuenta] = useState<CuentaCorrienteResumen | null>(null);
  const [resumenEnvases, setResumenEnvases] = useState<ResumenEnvases | null>(null);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Datos del cliente para crear/editar
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    email: '',
  });

  // Clientes fijados (a visitar) - persistido en localStorage (se cargan tras montar para evitar hydration mismatch)
  const STORAGE_KEY_FIJADOS = 'repartidor-rapido-clientes-fijados';
  const [clientesFijados, setClientesFijados] = useState<Cliente[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY_FIJADOS);
      if (!s) return;
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) setClientesFijados(parsed);
    } catch {
      // ignore
    }
  }, []);

  const guardarFijados = (lista: Cliente[]) => {
    setClientesFijados(lista);
    try {
      localStorage.setItem(STORAGE_KEY_FIJADOS, JSON.stringify(lista));
    } catch (e) {
      console.warn('No se pudo guardar clientes fijados', e);
    }
  };

  const estaFijado = (clienteId: number) =>
    clientesFijados.some((c) => c.id === clienteId);

  const toggleFijar = (e: React.MouseEvent, cliente: Cliente) => {
    e.stopPropagation();
    if (estaFijado(cliente.id)) {
      guardarFijados(clientesFijados.filter((c) => c.id !== cliente.id));
    } else {
      guardarFijados([...clientesFijados, { ...cliente }]);
    }
  };

  const quitarFijado = (e: React.MouseEvent, clienteId: number) => {
    e.stopPropagation();
    guardarFijados(clientesFijados.filter((c) => c.id !== clienteId));
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (busquedaCliente.length >= 2) {
      buscarClientes();
    } else {
      setClientesEncontrados([]);
    }
  }, [busquedaCliente]);

  const cargarProductos = async () => {
    try {
      const productosData = await repartidorRapidoService.obtenerProductos();
      setProductos(productosData);
    } catch (error) {
      mostrarError('Error al cargar productos');
    }
  };

  // Puntúa un cliente respecto al término de búsqueda (mayor = más relevante)
  const puntuarCliente = (c: Cliente, termo: string): number => {
    const t = termo.toLowerCase().trim();
    if (!t) return 0;
    const nom = (c.nombre || '').toLowerCase();
    const tel = (c.telefono || '').replace(/\s/g, '');
    const dir = (c.direccion || '').toLowerCase();
    if (nom.startsWith(t)) return 10;
    if (nom.includes(t)) return 5;
    if (tel.includes(t.replace(/\s/g, ''))) return 4;
    if (dir.includes(t)) return 3;
    // Coincidencia parcial en nombre (palabras)
    if (nom.split(/\s+/).some((p) => p.startsWith(t) || t.startsWith(p))) return 2;
    return 0;
  };

  const buscarClientes = async () => {
    try {
      const termo = busquedaCliente.trim();
      let clientes = await repartidorRapidoService.buscarClientes(termo);
      if (clientes.length === 0 && termo.length >= 2) {
        const todos = await repartidorRapidoService.obtenerTodosClientes();
        clientes = todos.filter((c: Cliente) => puntuarCliente(c, termo) > 0);
      }
      const conPuntuacion = clientes.map((c: Cliente) => ({
        cliente: c,
        puntuacion: puntuarCliente(c, termo),
      }));
      const ordenados = conPuntuacion
        .sort((a, b) => b.puntuacion - a.puntuacion)
        .map((x) => x.cliente);
      setClientesEncontrados(ordenados);
    } catch (error) {
      mostrarError('Error al buscar clientes');
    }
  };

  const normalizarCliente = (cliente: Cliente): Cliente => ({
    ...cliente,
    deuda: cliente.deuda ?? 0,
    envases_prestados: cliente.envases_prestados ?? [],
  });

  const cargarFichaCliente = async (clienteId: number, fallbackCliente?: Cliente) => {
    const [detalleResult, cuentaResult, envasesResult] = await Promise.allSettled([
      repartidorRapidoService.obtenerCliente(clienteId),
      repartidorRapidoService.obtenerCuentaCorrienteResumen(clienteId),
      repartidorRapidoService.obtenerResumenEnvases(clienteId),
    ]);

    if (detalleResult.status === 'fulfilled') {
      setClienteSeleccionado(normalizarCliente(detalleResult.value));
    } else if (fallbackCliente) {
      setClienteSeleccionado(normalizarCliente(fallbackCliente));
    } else {
      throw detalleResult.reason;
    }

    setResumenCuenta(cuentaResult.status === 'fulfilled' ? cuentaResult.value : null);
    setResumenEnvases(envasesResult.status === 'fulfilled' ? envasesResult.value : null);
  };

  const seleccionarCliente = async (cliente: Cliente) => {
    setCargando(true);
    try {
      await cargarFichaCliente(cliente.id, cliente);
      setBusquedaCliente('');
      setClientesEncontrados([]);
    } catch (error) {
      mostrarError('Error al cargar información del cliente');
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrearCliente = () => {
    setClienteForm({
      nombre: busquedaCliente,
      telefono: '',
      direccion: '',
      email: '',
    });
    setMostrarModalCliente(true);
  };

  const crearCliente = async () => {
    if (!clienteForm.nombre || !clienteForm.telefono) {
      mostrarError('Nombre y teléfono son obligatorios');
      return;
    }

    setCargando(true);
    try {
      const nuevoCliente = await repartidorRapidoService.crearCliente(clienteForm);
      setClienteSeleccionado(nuevoCliente);
      setMostrarModalCliente(false);
      setBusquedaCliente('');
      mostrarExito('Cliente creado exitosamente');
    } catch (error: any) {
      mostrarError(error.message || 'Error al crear cliente');
    } finally {
      setCargando(false);
    }
  };

  const actualizarCliente = async () => {
    if (!clienteSeleccionado) return;

    setCargando(true);
    try {
      const clienteActualizado = await repartidorRapidoService.actualizarCliente(
        clienteSeleccionado.id,
        clienteForm
      );
      setClienteSeleccionado(clienteActualizado);
      setMostrarModalCliente(false);
      mostrarExito('Cliente actualizado exitosamente');
    } catch (error: any) {
      mostrarError(error.message || 'Error al actualizar cliente');
    } finally {
      setCargando(false);
    }
  };

  const abrirModalVenta = (tipo: TipoOperacion) => {
    setTipoOperacion(tipo);
    setProductosVenta([]);
    setMontoPagado(0);
    setFormaPago('total');
    setEnvasesPrestados([]);
    setEnvasesDevueltos([]);
    setObservaciones('');
    setMostrarModalVenta(true);
  };

  const agregarProducto = (producto: Producto) => {
    const precio = producto.precioPublico || 0;
    const productoExistente = productosVenta.find(p => p.producto_id === producto.id.toString());

    if (productoExistente) {
      setProductosVenta(productosVenta.map(p =>
        p.producto_id === producto.id.toString()
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      ));
    } else {
      setProductosVenta([
        ...productosVenta,
        {
          producto_id: producto.id.toString(),
          cantidad: 1,
          precio_unitario: precio,
        },
      ]);
    }
  };

  const actualizarCantidadProducto = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setProductosVenta(productosVenta.filter(p => p.producto_id !== productoId));
    } else {
      setProductosVenta(productosVenta.map(p =>
        p.producto_id === productoId
          ? { ...p, cantidad }
          : p
      ));
    }
  };

  const montoTotal = useMemo(() => {
    return productosVenta.reduce((sum, p) => sum + p.precio_unitario * p.cantidad, 0);
  }, [productosVenta]);

  const saldoFinal = useMemo(() => {
    const deudaAnterior = resumenCuenta?.saldo_actual ?? clienteSeleccionado?.deuda ?? 0;
    return montoTotal - montoPagado + deudaAnterior;
  }, [montoTotal, montoPagado, resumenCuenta, clienteSeleccionado]);

  const saldoActualCliente = resumenCuenta?.saldo_actual ?? clienteSeleccionado?.deuda ?? 0;

  const totalEnvasesCliente = useMemo(() => {
    if (resumenEnvases) {
      return resumenEnvases.cantidad_total;
    }

    return (clienteSeleccionado?.envases_prestados || []).reduce(
      (total, envase) => total + (Number(envase.cantidad) || 0),
      0
    );
  }, [resumenEnvases, clienteSeleccionado?.envases_prestados]);

  const procesarVenta = async () => {
    if (!clienteSeleccionado || productosVenta.length === 0) {
      mostrarError('Debe agregar al menos un producto');
      return;
    }

    setCargando(true);
    try {
      if (tipoOperacion === 'venta') {
        await repartidorRapidoService.registrarVenta({
          cliente_id: clienteSeleccionado.id,
          productos: productosVenta,
          monto_total: montoTotal,
          medio_pago: medioPago,
          forma_pago: formaPago,
          saldo_monto: formaPago === 'parcial' ? saldoFinal : undefined,
          envases_prestados: envasesPrestados.length > 0 ? envasesPrestados : undefined,
          envases_devueltos: envasesDevueltos.length > 0 ? envasesDevueltos : undefined,
          observaciones: observaciones || undefined,
        });
        mostrarExito('Venta registrada exitosamente');
      } else if (tipoOperacion === 'fiado') {
        await repartidorRapidoService.registrarFiado({
          cliente_id: clienteSeleccionado.id,
          productos: productosVenta,
          monto_total: montoTotal,
          envases_prestados: envasesPrestados.length > 0 ? envasesPrestados : undefined,
          observaciones: observaciones || undefined,
        });
        mostrarExito('Fiado registrado exitosamente');
      }

      setMostrarModalVenta(false);
      setProductosVenta([]);
      setMontoPagado(0);
      setFormaPago('total');
      setEnvasesPrestados([]);
      setEnvasesDevueltos([]);
      setObservaciones('');
      
      try {
        if (clienteSeleccionado) {
          await cargarFichaCliente(clienteSeleccionado.id, clienteSeleccionado);
        }
      } catch {
        // La venta ya se guardó; si falla la recarga se conserva la información actual.
      }
    } catch (error: any) {
      mostrarError(error.message || 'Error al procesar la venta');
    } finally {
      setCargando(false);
    }
  };

  const procesarCobro = async () => {
    if (!clienteSeleccionado || montoCobro <= 0) {
      mostrarError('Debe ingresar un monto válido');
      return;
    }

    setCargando(true);
    try {
      const resultadoCobro = await repartidorRapidoService.registrarCobro({
        cliente_id: clienteSeleccionado.id,
        monto: montoCobro,
        medio_pago: medioPago,
        observaciones: observaciones || undefined,
      });

      setResumenCuenta((prev) =>
        prev
          ? {
              ...prev,
              saldo_actual: resultadoCobro.saldo_actual,
              ultimo_movimiento_at: resultadoCobro.cobro.fecha_cobro,
            }
          : prev
      );
      
      mostrarExito('Cobro registrado exitosamente');
      setMostrarModalCobro(false);
      setMontoCobro(0);
      setObservaciones('');
      
      try {
        if (clienteSeleccionado) {
          await cargarFichaCliente(clienteSeleccionado.id, {
            ...clienteSeleccionado,
            deuda: resultadoCobro.saldo_actual,
          });
        }
      } catch {
        // El cobro ya se registró; si falla la recarga se conserva el saldo actualizado.
      }
    } catch (error: any) {
      mostrarError(error.message || 'Error al procesar el cobro');
    } finally {
      setCargando(false);
    }
  };

  const procesarMovimientoEnvases = async (payload: RegistrarMovimientoEnvasesPayload) => {
    if (!clienteSeleccionado) return;

    setCargando(true);
    try {
      const resultado = await repartidorRapidoService.registrarMovimientoEnvases(
        clienteSeleccionado.id,
        payload
      );

      setResumenEnvases({
        cliente_id: clienteSeleccionado.id,
        saldo_actual: resultado.saldo_actual,
        cantidad_total: resultado.cantidad_total,
        ultimo_movimiento_at: resultado.ultimo_movimiento_at,
      });
      setMostrarModalEnvases(false);
      mostrarExito('Movimiento de envases registrado exitosamente');

      try {
        await cargarFichaCliente(clienteSeleccionado.id, clienteSeleccionado);
      } catch {
        // El movimiento ya quedó persistido; se conserva el resumen actualizado localmente.
      }
    } catch (error: any) {
      mostrarError(error.message || 'Error al registrar el movimiento de envases');
    } finally {
      setCargando(false);
    }
  };

  const mostrarExito = (mensaje: string) => {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const mostrarError = (mensaje: string) => {
    setMensajeError(mensaje);
    setTimeout(() => setMensajeError(''), 5000);
  };

  const resetearSeleccion = () => {
    setClienteSeleccionado(null);
    setResumenCuenta(null);
    setResumenEnvases(null);
    setBusquedaCliente('');
    setClientesEncontrados([]);
    setProductosVenta([]);
    setMostrarModalEnvases(false);
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-3">
          {clienteSeleccionado ? (
            <div className="flex justify-between items-center">
              <button
                onClick={resetearSeleccion}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div className="flex-1 ml-2">
                <h1 className="text-lg font-semibold text-gray-800">{clienteSeleccionado.nombre}</h1>
                <p className="text-sm text-gray-600">{clienteSeleccionado.telefono}</p>
              </div>
              <button
                onClick={() => {
                  setClienteForm({
                    nombre: clienteSeleccionado.nombre,
                    telefono: clienteSeleccionado.telefono,
                    direccion: clienteSeleccionado.direccion || '',
                    email: clienteSeleccionado.email || '',
                  });
                  setMostrarModalCliente(true);
                }}
                className="p-2 text-blue-600 hover:text-blue-800"
              >
                <PencilIcon className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-gray-800">Repartidor Rápido</h1>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {mensajeExito && (
        <div className="p-3 mx-4 mt-4 text-green-700 bg-green-100 rounded-lg border border-green-400">
          {mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div className="p-3 mx-4 mt-4 text-red-700 bg-red-100 rounded-lg border border-red-400">
          {mensajeError}
        </div>
      )}

      {/* Buscador de Clientes */}
      {!clienteSeleccionado && (
        <div className="p-4">
          {/* Clientes a visitar (fijados) */}
          {clientesFijados.length > 0 && (
            <div className="mb-4">
              <h3 className="flex gap-1 items-center mb-2 text-sm font-semibold text-gray-700">
                <MapPinIconSolid className="w-4 h-4 text-blue-600" />
                Clientes a visitar
              </h3>
              <div className="overflow-y-auto space-y-2 max-h-48">
                {clientesFijados.map((c) => (
                  <div
                    key={c.id}
                    className="flex gap-2 items-center p-3 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <button
                      type="button"
                      onClick={() => seleccionarCliente(c)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="font-medium text-gray-800 truncate">{c.nombre}</div>
                      <div className="text-sm text-gray-600">{c.telefono}</div>
                      {c.direccion && (
                        <div className="text-xs text-gray-500 truncate">{c.direccion}</div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => quitarFijado(e, c.id)}
                      className="p-2 text-gray-500 rounded-full hover:text-red-600 hover:bg-red-50"
                      title="Quitar de la lista"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente por nombre, teléfono o dirección..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="py-3 pr-4 pl-10 w-full text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>

          <button
            type="button"
            onClick={() => {
              setClienteForm({ nombre: '', telefono: '', direccion: '', email: '' });
              setMostrarModalCliente(true);
            }}
            className="mt-3 flex justify-center items-center w-full px-4 py-2.5 space-x-2 font-semibold text-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>Crear Cliente</span>
          </button>

          {/* Lista de clientes encontrados */}
          {clientesEncontrados.length > 0 && (
            <div className="overflow-y-auto mt-2 max-h-64 bg-white rounded-lg border border-gray-200 shadow-sm">
              {clientesEncontrados.map((cliente) => {
                const fijado = estaFijado(cliente.id);
                return (
                  <div
                    key={cliente.id}
                    className="flex gap-2 items-center px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() => seleccionarCliente(cliente)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="font-medium text-gray-800">{cliente.nombre}</div>
                      <div className="text-sm text-gray-600">{cliente.telefono}</div>
                      {cliente.direccion && (
                        <div className="text-xs text-gray-500">{cliente.direccion}</div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => toggleFijar(e, cliente)}
                      className={`p-2 rounded-full flex-shrink-0 ${
                        fijado
                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'
                      }`}
                      title={fijado ? 'Quitar de clientes a visitar' : 'Fijar para visitar'}
                    >
                      {fijado ? (
                        <MapPinIconSolid className="w-5 h-5" />
                      ) : (
                        <MapPinIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sin resultados: mensaje y botón Crear Cliente */}
          {busquedaCliente.trim().length >= 2 && clientesEncontrados.length === 0 && (
            <div className="p-4 mt-4 text-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-600">Búsqueda no encontrada</p>
              <p className="mt-1 text-sm text-gray-500">
                No hay coincidencias para &quot;{busquedaCliente.trim()}&quot;
              </p>
              <button
                type="button"
                onClick={abrirModalCrearCliente}
                className="flex justify-center items-center px-4 py-3 mt-4 space-x-2 w-full font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <UserPlusIcon className="w-5 h-5" />
                <span>Crear Cliente</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Información del Cliente Seleccionado */}
      {clienteSeleccionado && (
        <div className="p-4 space-y-4">
          {/* Resumen del Cliente (clickeable → abre historial) */}
          <button
            type="button"
            onClick={() => setMostrarModalHistorial(true)}
            className="p-4 w-full text-left bg-white rounded-lg border border-gray-100 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <h2 className="mb-3 font-semibold text-gray-800">Información del Cliente</h2>
            <div className="space-y-2 text-sm">
              {clienteSeleccionado.direccion && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dirección:</span>
                  <span className="font-medium">{clienteSeleccionado.direccion}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Deuda actual:</span>
                <span className={`font-semibold ${saldoActualCliente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${saldoActualCliente.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envases prestados:</span>
                <span className="font-semibold">{totalEnvasesCliente}</span>
              </div>
              {resumenCuenta?.ultimo_movimiento_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Último movimiento:</span>
                  <span className="font-medium">
                    {new Date(resumenCuenta.ultimo_movimiento_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">Toque para ver cuenta corriente y cobros</p>
          </button>

          {/* Botones de Acción */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => abrirModalVenta('venta')}
              className="flex flex-col items-center px-4 py-4 space-y-2 font-semibold text-white bg-green-600 rounded-lg"
            >
              <ShoppingCartIcon className="w-6 h-6" />
              <span>Vender</span>
            </button>
            <button
              onClick={() => abrirModalVenta('fiado')}
              className="flex flex-col items-center px-4 py-4 space-y-2 font-semibold text-white bg-orange-600 rounded-lg"
            >
              <CreditCardIcon className="w-6 h-6" />
              <span>Fiar</span>
            </button>
            <button
              onClick={() => setMostrarModalCobro(true)}
              className="flex flex-col items-center px-4 py-4 space-y-2 font-semibold text-white bg-blue-600 rounded-lg"
            >
              <BanknotesIcon className="w-6 h-6" />
              <span>Cobrar</span>
            </button>
            <button
              onClick={() => setMostrarModalEnvases(true)}
              className="flex flex-col items-center px-4 py-4 space-y-2 font-semibold text-white bg-teal-600 rounded-lg"
            >
              <MapPinIcon className="w-6 h-6" />
              <span>Envases</span>
            </button>
            <button
              onClick={() => {
                setClienteForm({
                  nombre: clienteSeleccionado.nombre,
                  telefono: clienteSeleccionado.telefono,
                  direccion: clienteSeleccionado.direccion || '',
                  email: clienteSeleccionado.email || '',
                });
                setMostrarModalCliente(true);
              }}
              className="flex flex-col items-center px-4 py-4 space-y-2 font-semibold text-white bg-gray-600 rounded-lg"
            >
              <PencilIcon className="w-6 h-6" />
              <span>Editar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!clienteSeleccionado) return;
              setCargando(true);
              try {
                const result = await repartidorRapidoService.registrarNoEncontrado(clienteSeleccionado.id);
                if (result.success) {
                  mostrarExito('Registro guardado: cliente no encontrado');
                  resetearSeleccion();
                } else {
                  mostrarError(result.message || 'No se pudo registrar');
                }
              } catch {
                mostrarError('No se pudo registrar');
              } finally {
                setCargando(false);
              }
            }}
            disabled={cargando}
            className="px-4 py-3 w-full font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            No encontrado
          </button>
        </div>
      )}

      {/* Modal Crear/Editar Cliente */}
      {mostrarModalCliente && (
        <ModalCliente
          cliente={clienteSeleccionado}
          clienteForm={clienteForm}
          setClienteForm={setClienteForm}
          onGuardar={clienteSeleccionado ? actualizarCliente : crearCliente}
          onCerrar={() => setMostrarModalCliente(false)}
          cargando={cargando}
        />
      )}

      {/* Modal Venta/Fiado */}
      {mostrarModalVenta && clienteSeleccionado && (
        <ModalVenta
          cliente={clienteSeleccionado}
          tipoOperacion={tipoOperacion}
          productos={productos}
          productosVenta={productosVenta}
          onAgregarProducto={agregarProducto}
          onActualizarCantidad={actualizarCantidadProducto}
          montoTotal={montoTotal}
          montoPagado={montoPagado}
          setMontoPagado={setMontoPagado}
          formaPago={formaPago}
          setFormaPago={setFormaPago}
          saldoFinal={saldoFinal}
          medioPago={medioPago}
          setMedioPago={setMedioPago}
          envasesPrestados={envasesPrestados}
          setEnvasesPrestados={setEnvasesPrestados}
          envasesDevueltos={envasesDevueltos}
          setEnvasesDevueltos={setEnvasesDevueltos}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          onProcesar={procesarVenta}
          onCerrar={() => setMostrarModalVenta(false)}
          cargando={cargando}
        />
      )}

      {/* Modal Cobro */}
      {mostrarModalCobro && clienteSeleccionado && (
        <ModalCobro
          cliente={clienteSeleccionado}
          montoCobro={montoCobro}
          setMontoCobro={setMontoCobro}
          medioPago={medioPago}
          setMedioPago={setMedioPago}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          onProcesar={procesarCobro}
          onCerrar={() => setMostrarModalCobro(false)}
          cargando={cargando}
        />
      )}

      {/* Modal Envases */}
      {mostrarModalEnvases && clienteSeleccionado && (
        <ModalEnvases
          cliente={clienteSeleccionado}
          productos={productos}
          resumenEnvases={resumenEnvases}
          onProcesar={procesarMovimientoEnvases}
          onCerrar={() => setMostrarModalEnvases(false)}
          cargando={cargando}
        />
      )}

      {/* Modal Historial de ventas y pagos */}
      {mostrarModalHistorial && clienteSeleccionado && (
        <ModalHistorial
          cliente={clienteSeleccionado}
          onCerrar={() => setMostrarModalHistorial(false)}
        />
      )}
    </div>
  );
}

// Componente Modal Cliente
function ModalCliente({
  cliente,
  clienteForm,
  setClienteForm,
  onGuardar,
  onCerrar,
  cargando,
}: {
  cliente: Cliente | null;
  clienteForm: any;
  setClienteForm: any;
  onGuardar: () => void;
  onCerrar: () => void;
  cargando: boolean;
}) {
  return (
    <div className="flex fixed inset-0 z-50 justify-center items-start p-4 pt-8 pb-8 bg-black bg-opacity-50 sm:items-center sm:pt-0 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex sticky top-0 z-10 justify-between items-center px-4 py-3 bg-white rounded-t-2xl border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {cliente ? 'Editar Cliente' : 'Crear Cliente'}
          </h2>
          <button onClick={onCerrar} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="nombre" className="block mb-1 text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              value={clienteForm.nombre}
              onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
              className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label htmlFor="telefono" className="block mb-1 text-sm font-medium text-gray-700">Teléfono *</label>
            <input
              type="tel"
              value={clienteForm.telefono}
              onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
              className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Número de teléfono"
            />
          </div>
          <div>
            <label htmlFor="direccion" className="block mb-1 text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              value={clienteForm.direccion}
              onChange={(e) => setClienteForm({ ...clienteForm, direccion: e.target.value })}
              className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Dirección"
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={clienteForm.email}
              onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
              className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Email (opcional)"
            />
          </div>
          <div className="flex pt-4 space-x-3">
            <button
              onClick={onCerrar}
              className="flex-1 px-4 py-2 font-semibold text-gray-800 bg-gray-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={onGuardar}
              disabled={cargando || !clienteForm.nombre || !clienteForm.telefono}
              className="flex-1 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ID_MIN_PRINCIPAL = 8;
const ID_MAX_PRINCIPAL = 12;

// Componente Modal Venta
function ModalVenta({
  cliente,
  tipoOperacion,
  productos,
  productosVenta,
  onAgregarProducto,
  onActualizarCantidad,
  montoTotal,
  montoPagado,
  setMontoPagado,
  formaPago,
  setFormaPago,
  saldoFinal,
  medioPago,
  setMedioPago,
  envasesPrestados,
  setEnvasesPrestados,
  envasesDevueltos,
  setEnvasesDevueltos,
  observaciones,
  setObservaciones,
  onProcesar,
  onCerrar,
  cargando,
}: any) {
  const [busquedaOtros, setBusquedaOtros] = useState('');

  // Productos principales: id 8 a 12, con envases primero y luego por nombre
  const productosPrincipales = useMemo(() => {
    const principales = productos.filter(
      (p: Producto) => p.id >= ID_MIN_PRINCIPAL && p.id <= ID_MAX_PRINCIPAL
    );
    const idsConEnvase = new Set(
      (cliente?.envases_prestados || []).map((e: { producto_id: number }) => e.producto_id)
    );
    return principales.sort((a: Producto, b: Producto) => {
      const aTiene = idsConEnvase.has(a.id) ? 1 : 0;
      const bTiene = idsConEnvase.has(b.id) ? 1 : 0;
      if (bTiene !== aTiene) return bTiene - aTiene;
      return (a.nombreProducto || '').localeCompare(b.nombreProducto || '');
    });
  }, [productos, cliente?.envases_prestados]);

  // Resto de productos (solo para buscador secundario)
  const productosSecundarios = useMemo(
    () =>
      productos.filter(
        (p: Producto) => p.id < ID_MIN_PRINCIPAL || p.id > ID_MAX_PRINCIPAL
      ),
    [productos]
  );

  const productosOtrosFiltrados = useMemo(() => {
    if (!busquedaOtros.trim()) return [];
    const t = busquedaOtros.toLowerCase().trim();
    return productosSecundarios.filter((p: Producto) =>
      (p.nombreProducto || '').toLowerCase().includes(t)
    );
  }, [productosSecundarios, busquedaOtros]);

  // Productos agregados que no son principales (para mostrar en "Otros")
  const otrosEnVenta = useMemo(() => {
    const idsPrincipales = new Set(
      productosPrincipales.map((p: Producto) => p.id.toString())
    );
    return productosVenta.filter((pv: ProductoVenta) => !idsPrincipales.has(pv.producto_id));
  }, [productosVenta, productosPrincipales]);

  const getCantidad = (productoId: string) =>
    productosVenta.find((p: ProductoVenta) => p.producto_id === productoId)?.cantidad ?? 0;

  const handleMas = (producto: Producto) => {
    const id = producto.id.toString();
    const cantidad = getCantidad(id);
    if (cantidad === 0) onAgregarProducto(producto);
    else onActualizarCantidad(id, cantidad + 1);
  };

  const handleMenos = (producto: Producto) => {
    const id = producto.id.toString();
    const cantidad = getCantidad(id);
    if (cantidad > 0) onActualizarCantidad(id, cantidad - 1);
  };

  const renderFilaProducto = (producto: Producto, esPrincipal: boolean) => {
    const cantidad = getCantidad(producto.id.toString());
    const precio = producto.precioPublico || 0;
    const tieneEnvase = (cliente?.envases_prestados || []).some(
      (e: { producto_id: number }) => e.producto_id === producto.id
    );
    return (
      <div
        key={producto.id}
        className={`flex items-center gap-3 p-3 rounded-lg border ${
          tieneEnvase && esPrincipal ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 items-center">
            <span className="font-medium text-gray-800 truncate">
              {producto.nombreProducto || 'Producto'}
            </span>
            {tieneEnvase && esPrincipal && (
              <span className="flex-shrink-0 text-xs font-medium text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded">
                Envase
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">${precio.toLocaleString()} c/u</div>
        </div>
        <div className="flex flex-col flex-shrink-0 gap-1 items-end">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => handleMenos(producto)}
              disabled={cantidad === 0}
              className="flex justify-center items-center w-9 h-9 text-white bg-red-500 rounded-full disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              aria-label="Quitar uno"
            >
              <MinusIcon className="w-5 h-5" />
            </button>
            <span className="w-8 font-semibold tabular-nums text-center text-gray-800">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => handleMas(producto)}
              className="flex justify-center items-center w-9 h-9 text-white bg-green-500 rounded-full touch-manipulation"
              aria-label="Agregar uno"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          {cantidad > 0 && (
            <span className="text-sm font-semibold text-gray-800">
              ${(precio * cantidad).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-end p-0 bg-black bg-opacity-50 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        <div className="flex sticky top-0 z-10 justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {tipoOperacion === 'venta' ? 'Nueva Venta' : 'Nuevo Fiado'} - {cliente.nombre}
          </h2>
          <button onClick={onCerrar} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Lista principal: solo productos id 8 a 12 con precio al público */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">Productos</h3>
            {productosPrincipales.length === 0 ? (
              <p className="py-2 text-sm text-gray-500">No hay productos principales cargados.</p>
            ) : (
              <div className="space-y-2">
                {productosPrincipales.map((producto: Producto) =>
                  renderFilaProducto(producto, true)
                )}
              </div>
            )}
          </div>

          {/* Buscador secundario: agregar otros productos */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Agregar otro producto</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busquedaOtros}
                onChange={(e) => setBusquedaOtros(e.target.value)}
                className="py-2 pr-4 pl-10 w-full text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {busquedaOtros.trim() && productosOtrosFiltrados.length > 0 && (
                <div className="overflow-y-auto absolute right-0 left-0 top-full z-20 mt-1 max-h-48 bg-white rounded-lg border border-gray-200 shadow-lg">
                  {productosOtrosFiltrados.slice(0, 8).map((producto: Producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => {
                        onAgregarProducto(producto);
                        setBusquedaOtros('');
                      }}
                      className="flex justify-between items-center px-3 py-2 w-full text-sm text-left border-b hover:bg-gray-50 last:border-b-0"
                    >
                      <span className="truncate">{producto.nombreProducto || 'Producto'}</span>
                      <span className="flex-shrink-0 ml-2 text-gray-500">
                        ${(producto.precioPublico || 0).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Otros productos ya agregados (fuera de 8-12) */}
          {otrosEnVenta.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">Otros productos en la venta</h3>
              <div className="space-y-2">
                {otrosEnVenta.map((pv: ProductoVenta) => {
                  const producto = productos.find((p: Producto) => p.id.toString() === pv.producto_id);
                  if (!producto) return null;
                  return renderFilaProducto(producto, false);
                })}
              </div>
            </div>
          )}

          {/* Pago (solo para ventas) */}
          {tipoOperacion === 'venta' && productosVenta.length > 0 && (
            <div className="p-4 space-y-3 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-800">Pago</h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto total:</span>
                <span className="text-lg font-semibold">${montoTotal.toLocaleString()}</span>
              </div>
              <div>
                <label htmlFor="formaPago" className="block mb-1 text-sm font-medium text-gray-700">Forma de pago</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setFormaPago('total');
                      setMontoPagado(montoTotal);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      formaPago === 'total'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Total
                  </button>
                  <button
                    onClick={() => setFormaPago('parcial')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      formaPago === 'parcial'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Parcial
                  </button>
                </div>
              </div>
              {formaPago === 'parcial' && (
                <div>
                  <label htmlFor="montoPagado" className="block mb-1 text-sm font-medium text-gray-700">Monto pagado</label>
                  <input
                    type="number"
                    min={0}
                    value={montoPagado === 0 ? '' : String(montoPagado)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '' || raw === undefined) {
                        setMontoPagado(0);
                        return;
                      }
                      const n = parseFloat(raw);
                      setMontoPagado(Number.isFinite(n) ? n : 0);
                    }}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              )}
              <div>
                <label htmlFor="medioPago" className="block mb-1 text-sm font-medium text-gray-700">Medio de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['efectivo', 'transferencia'] as MedioPago[]).map((medio) => (
                    <button
                      key={medio}
                      onClick={() => setMedioPago(medio)}
                      className={`py-2 px-4 rounded-lg font-medium ${
                        medioPago === medio
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {medio === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Saldo final:</span>
                <span className={`font-bold text-lg ${saldoFinal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${saldoFinal.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label htmlFor="observaciones" className="block mb-1 text-sm font-medium text-gray-700">Observaciones (opcional)</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
        <div className="sticky bottom-0 left-0 right-0 px-4 pt-3 pb-24 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={onProcesar}
            disabled={cargando || productosVenta.length === 0}
            className="px-4 py-4 w-full text-base font-semibold text-white bg-green-600 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 active:bg-green-800"
          >
            {cargando
              ? 'Guardando...'
              : tipoOperacion === 'venta'
                ? 'Guardar venta'
                : 'Guardar fiado'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Modal Cobro
function ModalCobro({
  cliente,
  montoCobro,
  setMontoCobro,
  medioPago,
  setMedioPago,
  observaciones,
  setObservaciones,
  onProcesar,
  onCerrar,
  cargando,
}: any) {
  return (
    <div className="flex fixed inset-0 z-50 justify-center items-end p-4 bg-black bg-opacity-50 sm:items-center">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl">
        <div className="flex sticky top-0 justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Cobrar - {cliente.nombre}</h2>
          <button onClick={onCerrar} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="montoCobro" className="block mb-1 text-sm font-medium text-gray-700">Monto a cobrar</label>
            <input
              type="number"
              value={montoCobro}
              onChange={(e) => setMontoCobro(parseFloat(e.target.value) || 0)}
              className="px-3 py-2 w-full text-lg rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="medioPago" className="block mb-1 text-sm font-medium text-gray-700">Medio de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {(['efectivo', 'transferencia'] as MedioPago[]).map((medio) => (
                <button
                  key={medio}
                  onClick={() => setMedioPago(medio)}
                  className={`py-3 px-4 rounded-lg font-medium ${
                    medioPago === medio
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {medio === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="observaciones"  className="block mb-1 text-sm font-medium text-gray-700">Observaciones (opcional)</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>
          <div className="flex pt-4 space-x-3">
            <button
              onClick={onCerrar}
              className="flex-1 px-4 py-3 font-semibold text-gray-800 bg-gray-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={onProcesar}
              disabled={cargando || montoCobro <= 0}
              className="flex-1 px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'Procesando...' : 'Confirmar Cobro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MovimientoHistorialCliente {
  id: number | string;
  tipo: 'DEBITO_VENTA' | 'CREDITO_COBRO' | 'NO_ENCONTRADO';
  descripcion: string;
  fecha: string;
  monto?: number;
  saldo_acumulado?: number;
  medio_pago?: string | null;
  observaciones?: string | null;
  origen?: 'VENTA' | 'COBRO';
}

function ModalEnvases({
  cliente,
  productos,
  resumenEnvases,
  onProcesar,
  onCerrar,
  cargando,
}: {
  cliente: Cliente;
  productos: Producto[];
  resumenEnvases: ResumenEnvases | null;
  onProcesar: (payload: RegistrarMovimientoEnvasesPayload) => Promise<void>;
  onCerrar: () => void;
  cargando: boolean;
}) {
  const [tipoMovimiento, setTipoMovimiento] = useState<'PRESTAMO' | 'DEVOLUCION' | 'AJUSTE'>('PRESTAMO');
  const [observaciones, setObservaciones] = useState('');
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [historial, setHistorial] = useState<MovimientoEnvaseDetalle[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const cargarHistorial = async () => {
      setCargandoHistorial(true);
      try {
        const data = await repartidorRapidoService.obtenerMovimientosEnvases(cliente.id, {
          page: 1,
          limit: 10,
        });

        if (mounted) {
          setHistorial(data.movimientos);
        }
      } catch {
        if (mounted) {
          setHistorial([]);
        }
      } finally {
        if (mounted) {
          setCargandoHistorial(false);
        }
      }
    };

    cargarHistorial();
    return () => {
      mounted = false;
    };
  }, [cliente.id]);

  const saldoPorProducto = useMemo(
    () =>
      new Map(
        (resumenEnvases?.saldo_actual || []).map((item) => [item.producto_id, item])
      ),
    [resumenEnvases]
  );

  const productosEnvases = useMemo(() => {
    const idsConSaldo = new Set((resumenEnvases?.saldo_actual || []).map((item) => item.producto_id));
    const base = productos.filter(
      (producto) =>
        (producto.id >= ID_MIN_PRINCIPAL && producto.id <= ID_MAX_PRINCIPAL) || idsConSaldo.has(producto.id)
    );
    const candidatos = base.length > 0 ? base : productos;

    return [...candidatos].sort((a, b) => {
      const aSaldo = idsConSaldo.has(a.id) ? 1 : 0;
      const bSaldo = idsConSaldo.has(b.id) ? 1 : 0;

      if (bSaldo !== aSaldo) return bSaldo - aSaldo;
      return (a.nombreProducto || '').localeCompare(b.nombreProducto || '');
    });
  }, [productos, resumenEnvases]);

  const items = useMemo(
    () =>
      Object.entries(cantidades)
        .map(([productoId, cantidad]) => ({
          producto_id: Number(productoId),
          cantidad: Number(cantidad),
        }))
        .filter((item) => Number.isFinite(item.cantidad) && item.cantidad !== 0),
    [cantidades]
  );

  const formatearFechaHora = (fecha: string) => {
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
  };

  const handleProcesar = async () => {
    setError('');

    if (items.length === 0) {
      setError('Debe cargar al menos un item.');
      return;
    }

    if (tipoMovimiento === 'AJUSTE' && !observaciones.trim()) {
      setError('Los ajustes requieren observaciones.');
      return;
    }

    const itemsNormalizados = items.map((item) => ({
      producto_id: item.producto_id,
      cantidad: tipoMovimiento === 'AJUSTE' ? item.cantidad : Math.abs(item.cantidad),
    }));

    if (
      (tipoMovimiento === 'PRESTAMO' || tipoMovimiento === 'DEVOLUCION') &&
      itemsNormalizados.some((item) => item.cantidad <= 0)
    ) {
      setError('Las cantidades deben ser positivas para préstamos y devoluciones.');
      return;
    }

    await onProcesar({
      tipo: tipoMovimiento,
      items: itemsNormalizados,
      observaciones: observaciones.trim() || undefined,
    });
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-end p-0 bg-black bg-opacity-50 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex sticky top-0 z-10 justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Gestionar envases</h2>
            <p className="text-sm text-gray-500">{cliente.nombre}</p>
          </div>
          <button onClick={onCerrar} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Saldo actual</span>
              <span className="text-lg font-bold text-gray-800">
                {resumenEnvases?.cantidad_total ?? 0} envases
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(resumenEnvases?.saldo_actual || []).length === 0 ? (
                <span className="text-sm text-gray-500">No hay envases prestados actualmente.</span>
              ) : (
                resumenEnvases?.saldo_actual.map((item) => (
                  <span
                    key={item.producto_id}
                    className="px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-100 rounded-full"
                  >
                    {item.producto_nombre}: {item.cantidad}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="block mb-2 text-sm font-medium text-gray-700">Tipo de movimiento</p>
            <div className="grid grid-cols-3 gap-2">
              {(['PRESTAMO', 'DEVOLUCION', 'AJUSTE'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoMovimiento(tipo)}
                  className={`py-2 px-3 rounded-lg font-medium text-sm ${
                    tipoMovimiento === tipo ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tipo === 'PRESTAMO' ? 'Préstamo' : tipo === 'DEVOLUCION' ? 'Devolución' : 'Ajuste'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Items</h3>
              <span className="text-xs text-gray-500">
                {tipoMovimiento === 'AJUSTE' ? 'Puede usar valores positivos o negativos.' : 'Ingrese cantidades positivas.'}
              </span>
            </div>
            {productosEnvases.map((producto) => {
              const saldoActual = saldoPorProducto.get(producto.id)?.cantidad ?? 0;

              return (
                <div key={producto.id} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{producto.nombreProducto || 'Producto'}</p>
                    <p className="text-xs text-gray-500">Saldo actual: {saldoActual}</p>
                  </div>
                  <input
                    type="number"
                    value={cantidades[producto.id] ?? ''}
                    onChange={(e) =>
                      setCantidades((prev) => ({
                        ...prev,
                        [producto.id]: e.target.value,
                      }))
                    }
                    className="px-3 py-2 w-28 text-right rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500"
                    placeholder="0"
                  />
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="observaciones-envases" className="block mb-1 text-sm font-medium text-gray-700">
              Observaciones {tipoMovimiento === 'AJUSTE' ? '*' : '(opcional)'}
            </label>
            <textarea
              id="observaciones-envases"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500"
              rows={3}
              placeholder={
                tipoMovimiento === 'AJUSTE'
                  ? 'Explique el motivo del ajuste'
                  : 'Notas adicionales...'
              }
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">Últimos movimientos</h3>
            {cargandoHistorial ? (
              <div className="flex justify-center py-4">
                <div className="w-7 h-7 rounded-full border-4 border-teal-500 animate-spin border-t-transparent" />
              </div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-gray-500">Todavía no hay movimientos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {historial.map((movimiento) => (
                  <li key={movimiento.id} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800">
                          {movimiento.producto_nombre} · {movimiento.tipo}
                        </p>
                        <p className="text-xs text-gray-500">{formatearFechaHora(movimiento.fecha_movimiento)}</p>
                        {movimiento.observaciones && (
                          <p className="mt-1 text-xs text-gray-600">{movimiento.observaciones}</p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${
                        movimiento.tipo === 'DEVOLUCION'
                          ? 'text-green-600'
                          : movimiento.tipo === 'AJUSTE'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                      }`}>
                        {movimiento.cantidad > 0 ? '+' : ''}
                        {movimiento.cantidad}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 px-4 py-3 font-semibold text-gray-800 bg-gray-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleProcesar}
              disabled={cargando}
              className="flex-1 px-4 py-3 font-semibold text-white bg-teal-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? 'Guardando...' : 'Guardar movimiento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalHistorial({
  cliente,
  onCerrar,
}: {
  cliente: Cliente;
  onCerrar: () => void;
}) {
  const [resumen, setResumen] = useState<CuentaCorrienteResumen | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoHistorialCliente[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let mounted = true;

    const cargar = async () => {
      setCargando(true);
      try {
        const [dataCuenta, dataNoEncontrado] = await Promise.all([
          repartidorRapidoService.obtenerCuentaCorriente(cliente.id, { page: 1, limit: 50 }),
          repartidorRapidoService.obtenerNoEncontradoPorCliente(cliente.id),
        ]);

        if (!mounted) return;

        setResumen(dataCuenta.resumen);

        const movimientosCuenta: MovimientoHistorialCliente[] = dataCuenta.movimientos.map(
          (movimiento: MovimientoCuentaCorriente) => ({
            id: movimiento.id,
            tipo: movimiento.tipo,
            descripcion: movimiento.descripcion,
            fecha: movimiento.fecha,
            monto: movimiento.credito > 0 ? movimiento.credito : movimiento.debito,
            saldo_acumulado: movimiento.saldo_acumulado,
            medio_pago: movimiento.medio_pago,
            observaciones: movimiento.observaciones,
            origen: movimiento.origen,
          })
        );

        const movimientosNoEncontrado: MovimientoHistorialCliente[] = (
          Array.isArray(dataNoEncontrado) ? dataNoEncontrado : []
        ).map((registro: any, idx: number) => ({
          id: registro.id ?? `no-encontrado-${idx}-${registro.fecha ?? ''}`,
          tipo: 'NO_ENCONTRADO',
          descripcion: registro.observaciones ?? registro.descripcion ?? 'Cliente no encontrado en la visita',
          fecha: registro.fecha ?? registro.created_at ?? new Date().toISOString(),
        }));

        const unidos = [...movimientosCuenta, ...movimientosNoEncontrado].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

        setMovimientos(unidos);
      } catch {
        if (mounted) {
          setResumen(null);
          setMovimientos([]);
        }
      } finally {
        if (mounted) {
          setCargando(false);
        }
      }
    };

    cargar();
    return () => {
      mounted = false;
    };
  }, [cliente.id]);

  const formatearFechaHora = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha;
    }
  };

  const etiquetaTipo = (tipo: MovimientoHistorialCliente['tipo']) => {
    if (tipo === 'DEBITO_VENTA') return 'Venta';
    if (tipo === 'CREDITO_COBRO') return 'Cobro';
    return 'No encontrado';
  };

  const esNoEncontrado = (movimiento: MovimientoHistorialCliente) => movimiento.tipo === 'NO_ENCONTRADO';
  const esCredito = (movimiento: MovimientoHistorialCliente) => movimiento.tipo === 'CREDITO_COBRO';

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-end bg-black bg-opacity-50 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex sticky top-0 justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Cuenta corriente</h2>
          <button type="button" onClick={onCerrar} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-800">{cliente.nombre}</p>
            {cliente.direccion && (
              <p className="text-xs text-gray-500">{cliente.direccion}</p>
            )}
          </div>
          {resumen && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-600">Saldo</p>
                <p className="font-semibold text-red-700">${resumen.saldo_actual.toLocaleString('es-AR')}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">Débitos</p>
                <p className="font-semibold text-gray-800">${resumen.total_debitos.toLocaleString('es-AR')}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-600">Créditos</p>
                <p className="font-semibold text-green-700">${resumen.total_creditos.toLocaleString('es-AR')}</p>
              </div>
            </div>
          )}
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {cargando ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-teal-500 animate-spin border-t-transparent" />
            </div>
          ) : movimientos.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Aún no hay movimientos registrados.</p>
          ) : (
            <ul className="space-y-3">
              {movimientos.map((movimiento) => (
                <li
                  key={movimiento.id}
                  className={`p-3 rounded-lg border ${
                    esNoEncontrado(movimiento)
                      ? 'border-amber-200 bg-amber-50'
                      : esCredito(movimiento)
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex gap-2 justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                          esNoEncontrado(movimiento)
                            ? 'bg-amber-200 text-amber-800'
                            : esCredito(movimiento)
                              ? 'bg-green-200 text-green-800'
                              : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {etiquetaTipo(movimiento.tipo)}
                      </span>
                      <p className="mt-1 text-sm font-medium text-gray-800">{movimiento.descripcion}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{formatearFechaHora(movimiento.fecha)}</p>
                      {!esNoEncontrado(movimiento) && (
                        <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                          {movimiento.medio_pago && <p>Medio de pago: {movimiento.medio_pago}</p>}
                          {movimiento.saldo_acumulado != null && (
                            <p>Saldo acumulado: ${movimiento.saldo_acumulado.toLocaleString('es-AR')}</p>
                          )}
                          {movimiento.observaciones && <p>{movimiento.observaciones}</p>}
                        </div>
                      )}
                    </div>
                    {!esNoEncontrado(movimiento) && movimiento.monto != null && (
                      <span className={`flex-shrink-0 text-base font-semibold ${
                        esCredito(movimiento) ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {esCredito(movimiento) ? '+' : '-'}${movimiento.monto.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="sticky bottom-0 px-4 py-3 bg-white border-t border-gray-200">
          <button
            type="button"
            onClick={onCerrar}
            className="w-full py-2.5 px-4 font-semibold text-gray-800 bg-gray-200 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
