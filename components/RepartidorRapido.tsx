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
} from '@heroicons/react/24/outline';
import { repartidorRapidoService, ProductoVenta, EnvaseMovimiento } from '@/lib/services/repartidorRapidoService';

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion?: string;
  email?: string;
  deuda?: number;
  envases_prestados?: any[];
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
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>('venta');
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const [montoPagado, setMontoPagado] = useState(0);
  const [formaPago, setFormaPago] = useState<'total' | 'parcial'>('total');
  const [montoCobro, setMontoCobro] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [envasesPrestados, setEnvasesPrestados] = useState<EnvaseMovimiento[]>([]);
  const [envasesDevueltos, setEnvasesDevueltos] = useState<EnvaseMovimiento[]>([]);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Datos del cliente para crear/editar
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    email: '',
  });

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

  const seleccionarCliente = async (cliente: Cliente) => {
    setCargando(true);
    try {
      let clienteCompleto: Cliente;
      try {
        clienteCompleto = await repartidorRapidoService.obtenerCliente(cliente.id);
      } catch {
        // Si el backend no tiene GET /clientes/:id o devuelve 404, usar datos del resultado de búsqueda
        clienteCompleto = {
          ...cliente,
          deuda: cliente.deuda ?? 0,
          envases_prestados: cliente.envases_prestados ?? [],
        };
      }
      setClienteSeleccionado(clienteCompleto);
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
    const deudaAnterior = clienteSeleccionado?.deuda || 0;
    return montoTotal - montoPagado + deudaAnterior;
  }, [montoTotal, montoPagado, clienteSeleccionado]);

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
      
      // Recargar información del cliente
      if (clienteSeleccionado) {
        const clienteActualizado = await repartidorRapidoService.obtenerCliente(clienteSeleccionado.id);
        setClienteSeleccionado(clienteActualizado);
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
      await repartidorRapidoService.registrarCobro({
        cliente_id: clienteSeleccionado.id,
        monto: montoCobro,
        medio_pago: medioPago,
        observaciones: observaciones || undefined,
      });
      
      mostrarExito('Cobro registrado exitosamente');
      setMostrarModalCobro(false);
      setMontoCobro(0);
      setObservaciones('');
      
      // Recargar información del cliente
      if (clienteSeleccionado) {
        const clienteActualizado = await repartidorRapidoService.obtenerCliente(clienteSeleccionado.id);
        setClienteSeleccionado(clienteActualizado);
      }
    } catch (error: any) {
      mostrarError(error.message || 'Error al procesar el cobro');
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
    setBusquedaCliente('');
    setClientesEncontrados([]);
    setProductosVenta([]);
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
              {clientesEncontrados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => seleccionarCliente(cliente)}
                  className="px-4 py-3 w-full text-left border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                >
                  <div className="font-medium text-gray-800">{cliente.nombre}</div>
                  <div className="text-sm text-gray-600">{cliente.telefono}</div>
                  {cliente.direccion && (
                    <div className="text-xs text-gray-500">{cliente.direccion}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Sin resultados: mensaje y botón Crear Cliente */}
          {busquedaCliente.trim().length >= 2 && clientesEncontrados.length === 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-600 font-medium">Búsqueda no encontrada</p>
              <p className="mt-1 text-sm text-gray-500">
                No hay coincidencias para &quot;{busquedaCliente.trim()}&quot;
              </p>
              <button
                type="button"
                onClick={abrirModalCrearCliente}
                className="mt-4 flex justify-center items-center px-4 py-3 w-full space-x-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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
            className="w-full p-4 text-left bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
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
                <span className={`font-semibold ${(clienteSeleccionado.deuda || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${(clienteSeleccionado.deuda || 0).toLocaleString()}
                </span>
              </div>
              {clienteSeleccionado.envases_prestados && clienteSeleccionado.envases_prestados.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Envases prestados:</span>
                  <span className="font-semibold">{clienteSeleccionado.envases_prestados.length}</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">Toque para ver ventas y pagos</p>
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
    <div className="flex fixed inset-0 z-50 justify-center items-start pt-8 p-4 pb-8 bg-black bg-opacity-50 sm:items-center sm:pt-0 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex sticky top-0 z-10 justify-between items-center px-4 py-3 bg-white border-b border-gray-200 rounded-t-2xl">
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
  // Productos ordenados: primero los que el cliente tiene con envases asignados
  const productosOrdenados = useMemo(() => {
    const idsConEnvase = new Set(
      (cliente?.envases_prestados || []).map((e: { producto_id: number }) => e.producto_id)
    );
    return [...productos].sort((a, b) => {
      const aTiene = idsConEnvase.has(a.id) ? 1 : 0;
      const bTiene = idsConEnvase.has(b.id) ? 1 : 0;
      if (bTiene !== aTiene) return bTiene - aTiene;
      return (a.nombreProducto || '').localeCompare(b.nombreProducto || '');
    });
  }, [productos, cliente?.envases_prestados]);

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

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-end p-0 bg-black bg-opacity-50 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        <div className="flex sticky top-0 justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {tipoOperacion === 'venta' ? 'Nueva Venta' : 'Nuevo Fiado'} - {cliente.nombre}
          </h2>
          <button onClick={onCerrar} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Lista de productos con botones +/- */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">Productos</h3>
            {productosOrdenados.length === 0 ? (
              <p className="py-4 text-center text-gray-500">No hay productos cargados.</p>
            ) : (
              <div className="space-y-2">
                {productosOrdenados.map((producto: Producto) => {
                  const cantidad = getCantidad(producto.id.toString());
                  const precio = producto.precioPublico || 0;
                  const tieneEnvase = (cliente?.envases_prestados || []).some(
                    (e: { producto_id: number }) => e.producto_id === producto.id
                  );
                  return (
                    <div
                      key={producto.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        tieneEnvase ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate">
                            {producto.nombreProducto || 'Producto'}
                          </span>
                          {tieneEnvase && (
                            <span className="flex-shrink-0 text-xs font-medium text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded">
                              Envase
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">${precio.toLocaleString()} c/u</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMenos(producto)}
                          disabled={cantidad === 0}
                          className="flex justify-center items-center w-9 h-9 rounded-full text-white bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                          aria-label="Quitar uno"
                        >
                          <MinusIcon className="w-5 h-5" />
                        </button>
                        <span className="w-8 font-semibold text-center text-gray-800 tabular-nums">
                          {cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMas(producto)}
                          className="flex justify-center items-center w-9 h-9 rounded-full text-white bg-green-500 touch-manipulation"
                          aria-label="Agregar uno"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                        {cantidad > 0 && (
                          <span className="font-semibold text-gray-800 min-w-[70px] text-right">
                            ${(precio * cantidad).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(parseFloat(e.target.value) || 0)}
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
        <div className="sticky bottom-0 px-4 py-3 bg-white border-t border-gray-200">
          <button
            onClick={onProcesar}
            disabled={cargando || productosVenta.length === 0}
            className="px-4 py-3 w-full font-semibold text-white bg-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Procesando...' : tipoOperacion === 'venta' ? 'Confirmar Venta' : 'Confirmar Fiado'}
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

// Tipos de movimiento que puede devolver la API
interface MovimientoCliente {
  id: number;
  tipo: string;
  descripcion?: string;
  fecha: string;
  monto?: string | number;
  detalles?: Record<string, unknown>;
}

// Modal Historial de ventas y pagos del cliente
function ModalHistorial({
  cliente,
  onCerrar,
}: {
  cliente: Cliente;
  onCerrar: () => void;
}) {
  const [movimientos, setMovimientos] = useState<MovimientoCliente[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const data = await repartidorRapidoService.obtenerMovimientosCliente(cliente.id);
        if (mounted) setMovimientos(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setMovimientos([]);
      } finally {
        if (mounted) setCargando(false);
      }
    };
    cargar();
    return () => { mounted = false; };
  }, [cliente.id]);

  const formatearFechaHora = (fecha: string) => {
    try {
      const d = new Date(fecha);
      return d.toLocaleString('es-AR', {
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

  const etiquetaTipo = (tipo: string) => {
    const map: Record<string, string> = {
      VENTA_LOCAL: 'Venta',
      CIERRE_VENTA: 'Cierre / Pago',
      COBRO_RAPIDO: 'Cobro',
      VENTA_RAPIDA: 'Venta rápida',
      FIADO_RAPIDO: 'Fiado',
      GASTO: 'Gasto',
      NUEVO_CLIENTE: 'Nuevo cliente',
    };
    return map[tipo] || tipo;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex sticky top-0 justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Ventas y pagos</h2>
          <button type="button" onClick={onCerrar} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="px-4 py-2 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-800">{cliente.nombre}</p>
          {cliente.direccion && (
            <p className="text-xs text-gray-500">{cliente.direccion}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cargando ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
            </div>
          ) : movimientos.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Aún no hay ventas ni pagos registrados.</p>
          ) : (
            <ul className="space-y-3">
              {movimientos.map((mov) => (
                <li
                  key={mov.id}
                  className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-teal-100 text-teal-800">
                        {etiquetaTipo(mov.tipo)}
                      </span>
                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {mov.descripcion || '—'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatearFechaHora(mov.fecha)}
                      </p>
                    </div>
                    {mov.monto != null && mov.monto !== '' && (
                      <span className="flex-shrink-0 text-base font-semibold text-gray-800">
                        ${Number(mov.monto).toLocaleString('es-AR')}
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
