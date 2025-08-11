"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCartIcon, 
  CreditCardIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  PlusIcon,
  UserPlusIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ResumenCardProps {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
  color: 'green' | 'orange' | 'blue' | 'purple' | 'red';
}

const ResumenCard: React.FC<ResumenCardProps> = ({ titulo, valor, icono, color }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{titulo}</p>
          <p className="text-xl font-bold">{valor}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
          {icono}
        </div>
      </div>
    </div>
  );
};

interface ClienteCardProps {
  cliente: {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    proximaEntrega?: string;
  };
  onPress: () => void;
}

const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, onPress }) => {
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se active el onClick del card
    
    // Formatear el número de teléfono (remover espacios, guiones, etc.)
    const telefonoLimpio = cliente.telefono.replace(/\D/g, '');
    
    // Mensaje predefinido
    const mensaje = `Hola ${cliente.nombre}! 👋 Soy el repartidor de Soderia Don Javier. Te aviso que estaré llegando a tu dirección (${cliente.direccion}) en los próximos minutos. ¿Estás disponible para recibir tu pedido? 🚚`;
    
    // Crear URL de WhatsApp
    const urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp en nueva pestaña
    window.open(urlWhatsApp, '_blank');
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 w-full max-w-sm mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{cliente.nombre}</h3>
            {cliente.proximaEntrega && (
              <div className="flex items-center text-xs text-orange-600 ml-2 flex-shrink-0">
                <ClockIcon className="w-3 h-3 mr-1" />
                <span>{cliente.proximaEntrega}</span>
              </div>
            )}
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{cliente.direccion}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{cliente.telefono}</p>
        </div>
        
        {/* Botón de WhatsApp */}
        <button
          onClick={handleWhatsAppClick}
          className="ml-3 p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors flex-shrink-0"
          title="Enviar mensaje por WhatsApp"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Botón principal del card */}
      <button 
        className="w-full mt-3 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        onClick={onPress}
      >
        Ver Detalles
      </button>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, color }) => {
  const colorClasses = {
    green: 'bg-green-600 hover:bg-green-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };

  return (
    <button
      onClick={onPress}
      className={`${colorClasses[color]} text-white py-4 px-4 rounded-lg font-semibold flex flex-col items-center space-y-2 transition-colors`}
    >
      <div className="w-6 h-6">
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );
};

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
}

interface ProductoVenta {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

interface Envase {
  id: number;
  tipo: string;
  fechaPrestado: string;
  devuelto: boolean;
}

interface ClienteCompleto {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  deuda: number;
  envasesPrestados: Envase[];
  proximaEntrega?: string;
}

interface VentaRapidaModalProps {
  cliente: ClienteCompleto | null;
  isOpen: boolean;
  onClose: () => void;
  onVentaCompletada: (venta: any) => void;
  onClienteNoEncontrado: (clienteId: number, motivo: string) => void;
}

// Productos de ejemplo (en producción vendrían de una API)
const productosDisponibles: Producto[] = [
  { id: 1, nombre: "Soda 1L", precio: 800, stock: 50, categoria: "Bebidas" },
  { id: 2, nombre: "Soda 2L", precio: 1200, stock: 30, categoria: "Bebidas" },
  { id: 3, nombre: "Agua 500ml", precio: 400, stock: 100, categoria: "Bebidas" },
  { id: 4, nombre: "Agua 1L", precio: 600, stock: 80, categoria: "Bebidas" },
  { id: 5, nombre: "Jugo Naranja 1L", precio: 1000, stock: 25, categoria: "Jugos" },
  { id: 6, nombre: "Jugo Manzana 1L", precio: 1000, stock: 25, categoria: "Jugos" },
];

const VentaRapidaModal: React.FC<VentaRapidaModalProps> = ({
  cliente,
  isOpen,
  onClose,
  onVentaCompletada,
  onClienteNoEncontrado
}) => {
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [envasesDevueltos, setEnvasesDevueltos] = useState<number[]>([]);
  const [nuevosEnvases, setNuevosEnvases] = useState(0);
  const [montoPagado, setMontoPagado] = useState(0);
  const [motivoNoEncontrado, setMotivoNoEncontrado] = useState('');

  // Cálculos automáticos
  const subtotalProductos = useMemo(() => {
    return productos.reduce((sum, p) => sum + p.subtotal, 0);
  }, [productos]);

  const montoTotal = useMemo(() => {
    return subtotalProductos;
  }, [subtotalProductos]);

  const saldoFinal = useMemo(() => {
    if (!cliente) return 0;
    return montoTotal - montoPagado + cliente.deuda;
  }, [montoTotal, montoPagado, cliente]);

  // Productos filtrados para búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto) return productosDisponibles.slice(0, 5); // Mostrar solo los primeros 5
    return productosDisponibles.filter(p => 
      p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
    );
  }, [busquedaProducto]);

  // Agregar producto a la venta
  const agregarProducto = (producto: Producto) => {
    const productoExistente = productos.find(p => p.id === producto.id);
    
    if (productoExistente) {
      setProductos(productos.map(p => 
        p.id === producto.id 
          ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio }
          : p
      ));
    } else {
      setProductos([...productos, {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        subtotal: producto.precio
      }]);
    }
    setBusquedaProducto('');
  };

  // Actualizar cantidad de producto
  const actualizarCantidad = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      setProductos(productos.filter(p => p.id !== productoId));
    } else {
      setProductos(productos.map(p => 
        p.id === productoId 
          ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio }
          : p
      ));
    }
  };

  // Manejar devolución de envases
  const toggleEnvaseDevuelto = (envaseId: number) => {
    setEnvasesDevueltos(prev => 
      prev.includes(envaseId) 
        ? prev.filter(id => id !== envaseId)
        : [...prev, envaseId]
    );
  };

  // Guardar venta
  const guardarVenta = () => {
    if (!cliente) return;
    
    const venta = {
      clienteId: cliente.id,
      productos,
      envasesDevueltos,
      nuevosEnvases,
      montoTotal,
      montoPagado,
      saldoFinal,
      fecha: new Date().toISOString()
    };
    
    onVentaCompletada(venta);
    onClose();
  };

  // Cliente no encontrado
  const clienteNoEncontrado = () => {
    if (!cliente) return;
    onClienteNoEncontrado(cliente.id, motivoNoEncontrado || 'No estaba en casa');
    onClose();
  };

  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Venta Rápida - {cliente.nombre}
            </h2>
            <p className="text-sm text-gray-600">{cliente.direccion}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del Cliente y Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información del Cliente */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Información del Cliente</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Deuda actual:</span>
                  <span className={`font-semibold ${cliente.deuda > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${cliente.deuda.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envases prestados:</span>
                  <span className="font-semibold">{cliente.envasesPrestados.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="font-semibold">{cliente.telefono}</span>
                </div>
              </div>
            </div>

            {/* Resumen de la Venta */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Resumen de la Venta</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">${subtotalProductos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pagado:</span>
                  <span className="font-semibold">${montoPagado.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800 font-semibold">Saldo final:</span>
                  <span className={`font-bold text-lg ${saldoFinal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${saldoFinal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Productos</h3>
            
            {/* Búsqueda de productos */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Lista de productos sugeridos */}
              {busquedaProducto && productosFiltrados.length > 0 && (
                <div className="mt-2 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {productosFiltrados.map(producto => (
                    <button
                      key={producto.id}
                      onClick={() => agregarProducto(producto)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
                    >
                      <span className="font-medium">{producto.nombre}</span>
                      <span className="text-gray-600">${producto.precio.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Productos agregados */}
            <div className="space-y-2">
              {productos.map(producto => (
                <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{producto.nombre}</h4>
                    <p className="text-sm text-gray-600">${producto.precio.toLocaleString()} c/u</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{producto.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)}
                        className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-800 min-w-[60px] text-right">
                      ${producto.subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {productos.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hay productos agregados. Busca y agrega productos para comenzar.
                </p>
              )}
            </div>
          </div>

          {/* Envases */}
          {cliente.envasesPrestados.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Envases Prestados</h3>
              <div className="space-y-2">
                {cliente.envasesPrestados.map(envase => (
                  <div key={envase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{envase.tipo}</span>
                      <p className="text-sm text-gray-600">Prestado: {envase.fechaPrestado}</p>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={envasesDevueltos.includes(envase.id)}
                        onChange={() => toggleEnvaseDevuelto(envase.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">Devuelto</span>
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Nuevos envases prestados */}
              <div className="mt-4 pt-4 border-t">
                <label htmlFor="nuevosEnvases" className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevos envases prestados:
                </label>
                <input
                  id="nuevosEnvases"
                  name="nuevosEnvases"
                  type="number"
                  min="0"
                  value={nuevosEnvases}
                  onChange={(e) => setNuevosEnvases(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Pago */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Pago</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monto total:</span>
                <span className="font-semibold text-lg">${montoTotal.toLocaleString()}</span>
              </div>
              <div>
                <label htmlFor="montoPagado" className="block text-sm font-medium text-gray-700 mb-2">
                  Monto pagado:
                </label>
                <input
                  type="number"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-800 font-semibold">Saldo final:</span>
                <span className={`font-bold text-xl ${saldoFinal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${saldoFinal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              onClick={clienteNoEncontrado}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>No Encontrado</span>
            </button>
            <button
              onClick={guardarVenta}
              disabled={productos.length === 0}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              <span>Guardar Venta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RepartidorDashboard: React.FC = () => {
  const router = useRouter();
  const [resumen, setResumen] = useState({
    ventasRealizadas: 12,
    montoTotal: 45600,
    fiadosPendientes: 3,
    envasesPrestados: 8
  });

  const [modalVentaAbierto, setModalVentaAbierto] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCompleto | null>(null);
  
  const [proximasEntregas] = useState<ClienteCompleto[]>([
    {
      id: 1,
      nombre: "María González",
      direccion: "Av. San Martín 1234",
      telefono: "3541222719",
      deuda: 2500,
      envasesPrestados: [
        { id: 1, tipo: "Botella 1L", fechaPrestado: "2024-01-15", devuelto: false },
        { id: 2, tipo: "Botella 2L", fechaPrestado: "2024-01-10", devuelto: false }
      ],
      proximaEntrega: "14:30"
    },
    {
      id: 2,
      nombre: "Carlos Rodríguez",
      direccion: "Belgrano 567",
      telefono: "3541222719",
      deuda: 0,
      envasesPrestados: [],
      proximaEntrega: "15:00"
    },
    {
      id: 3,
      nombre: "Ana Martínez",
      direccion: "Rivadavia 890",
      telefono: "3541222719",
      deuda: 1800,
      envasesPrestados: [
        { id: 3, tipo: "Botella 1L", fechaPrestado: "2024-01-12", devuelto: false }
      ]
    }
  ]);

  const abrirVentaRapida = (cliente: ClienteCompleto) => {
    setClienteSeleccionado(cliente);
    setModalVentaAbierto(true);
  };

  const cerrarModal = () => {
    setModalVentaAbierto(false);
    setClienteSeleccionado(null);
  };

  const handleVentaCompletada = (venta: any) => {
    console.log('Venta completada:', venta);
    // Aquí se guardaría la venta en la base de datos
    alert('Venta guardada exitosamente');
  };

  const handleClienteNoEncontrado = (clienteId: number, motivo: string) => {
    console.log('Cliente no encontrado:', { clienteId, motivo });
    // Aquí se registraría la ausencia
    alert(`Cliente no encontrado: ${motivo}`);
  };

  return (
    <div className="space-y-6">
      {/* Acciones rápidas - Primero en móvil, después en desktop */}
      <section className="bg-white rounded-lg p-6 shadow-sm order-1 lg:order-2">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionButton 
            icon={<PlusIcon className="w-6 h-6" />}
            label="Nueva Venta"
            onPress={() => router.push('/repartidor/ventas')}
            color="green"
          />
          <ActionButton 
            icon={<UserPlusIcon className="w-6 h-6" />}
            label="Nuevo Cliente"
            onPress={() => router.push('/repartidor/clientes/nuevo')}
            color="blue"
          />
        </div>
      </section>

      {/* Tarjetas de resumen - Después en móvil, primero en desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 order-2 lg:order-1">
        <ResumenCard 
          titulo="Ventas Hoy"
          valor={`$${resumen.ventasRealizadas.toLocaleString()}`}
          icono={<ShoppingCartIcon className="w-6 h-6" />}
          color="green"
        />
        <ResumenCard 
          titulo="Fiados Pendientes"
          valor={resumen.fiadosPendientes.toString()}
          icono={<CreditCardIcon className="w-6 h-6" />}
          color="orange"
        />
        <ResumenCard 
          titulo="Envases Prestados"
          valor={resumen.envasesPrestados.toString()}
          icono={<CubeIcon className="w-6 h-6" />}
          color="blue"
        />
        <ResumenCard 
          titulo="Monto Total"
          valor={`$${resumen.montoTotal.toLocaleString()}`}
          icono={<CurrencyDollarIcon className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Layout de dos columnas para desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 order-3">
        {/* Próximas entregas */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Próximas Entregas</h2>
          <div className="space-y-3">
            {proximasEntregas.map(cliente => (
              <div key={cliente.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 w-full max-w-sm mx-auto">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">{cliente.nombre}</h3>
                      {cliente.proximaEntrega && (
                        <div className="flex items-center text-xs text-orange-600 ml-2 flex-shrink-0">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          <span>{cliente.proximaEntrega}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{cliente.direccion}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{cliente.telefono}</p>
                    {cliente.deuda > 0 && (
                      <p className="text-xs text-red-600 mt-1">Deuda: ${cliente.deuda.toLocaleString()}</p>
                    )}
                  </div>
                  
                  {/* Botón de WhatsApp */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const telefonoLimpio = cliente.telefono.replace(/\D/g, '');
                      const mensaje = `Hola ${cliente.nombre}! 👋 Soy el repartidor de Soderia Don Javier. Te aviso que estaré llegando a tu dirección (${cliente.direccion}) en los próximos minutos. ¿Estás disponible para recibir tu pedido? 🚚`;
                      const urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
                      window.open(urlWhatsApp, '_blank');
                    }}
                    className="ml-3 p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors flex-shrink-0"
                    title="Enviar mensaje por WhatsApp"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Botones de acción */}
                <div className="flex space-x-2 mt-3">
                  <button 
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    onClick={() => abrirVentaRapida(cliente)}
                  >
                    Venta Rápida
                  </button>
                  <button 
                    className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    onClick={() => router.push(`/repartidor/clientes/${cliente.id}`)}
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Espacio vacío en desktop para mantener el layout de dos columnas */}
        <div className="hidden lg:block"></div>
      </div>

      {/* Alertas del día */}
      <section className="bg-white rounded-lg p-6 shadow-sm order-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Alertas del Día</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
            <span className="text-sm text-orange-800">3 fiados vencidos requieren atención</span>
          </div>
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-sm text-blue-800">5 envases pendientes de devolución</span>
          </div>
        </div>
      </section>

      {/* Modal de Venta Rápida */}
      <VentaRapidaModal
        cliente={clienteSeleccionado}
        isOpen={modalVentaAbierto}
        onClose={cerrarModal}
        onVentaCompletada={handleVentaCompletada}
        onClienteNoEncontrado={handleClienteNoEncontrado}
      />
    </div>
  );
};

export default RepartidorDashboard;
