"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  ShoppingCartIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  imagen?: string;
}

interface VentaRapidaProps {
  cliente: Cliente;
  productos: Producto[];
  onVentaCompletada: (venta: any) => void;
}

const ProductoCard: React.FC<{
  producto: Producto;
  onCantidadChange: (cantidad: number) => void;
  cantidad: number;
}> = ({ producto, onCantidadChange, cantidad }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-[200px]">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <ShoppingCartIcon className="w-6 h-6 text-gray-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{producto.nombre}</h3>
          <p className="text-sm text-gray-600">${producto.precio.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Stock: {producto.stock}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onCantidadChange(Math.max(0, cantidad - 1))}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"
          >
            -
          </button>
          <span className="w-8 text-center font-semibold">{cantidad}</span>
          <button
            onClick={() => onCantidadChange(cantidad + 1)}
            className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600"
          >
            +
          </button>
        </div>
        <span className="font-semibold text-gray-800">
          ${(producto.precio * cantidad).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

const VentaRapida: React.FC<VentaRapidaProps> = ({ cliente, productos, onVentaCompletada }) => {
  const [cantidades, setCantidades] = useState<{ [key: number]: number }>({});
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'fiado'>('efectivo');
  const [observaciones, setObservaciones] = useState('');

  const total = productos.reduce((sum, producto) => {
    const cantidad = cantidades[producto.id] || 0;
    return sum + (producto.precio * cantidad);
  }, 0);

  const handleCantidadChange = (productoId: number, cantidad: number) => {
    setCantidades(prev => ({
      ...prev,
      [productoId]: cantidad
    }));
  };

  const handleVentaEfectivo = () => {
    const venta = {
      cliente,
      productos: productos.map(p => ({
        ...p,
        cantidad: cantidades[p.id] || 0
      })).filter(p => p.cantidad > 0),
      total,
      metodoPago: 'efectivo',
      observaciones,
      fecha: new Date().toISOString()
    };
    onVentaCompletada(venta);
  };

  const handleVentaFiado = () => {
    const venta = {
      cliente,
      productos: productos.map(p => ({
        ...p,
        cantidad: cantidades[p.id] || 0
      })).filter(p => p.cantidad > 0),
      total,
      metodoPago: 'fiado',
      observaciones,
      fecha: new Date().toISOString()
    };
    onVentaCompletada(venta);
  };

  return (
    <div className="space-y-6">
      {/* Header con info del cliente */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">{cliente.nombre}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{cliente.direccion}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{cliente.telefono}</span>
          </div>
        </div>
      </div>

      {/* Layout responsivo para productos y resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-gray-800 text-lg">Productos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productos.map(producto => (
              <ProductoCard 
                key={producto.id}
                producto={producto}
                cantidad={cantidades[producto.id] || 0}
                onCantidadChange={(cantidad) => handleCantidadChange(producto.id, cantidad)}
              />
            ))}
          </div>
        </div>

        {/* Resumen de la venta */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800 text-lg">Total</h3>
            <span className="text-3xl font-bold text-gray-800">${total.toLocaleString()}</span>
          </div>
          
          {/* Método de pago */}
          <div className="mb-6">
            <label htmlFor='metodoPago' className="block text-sm font-medium text-gray-700 mb-3">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMetodoPago('efectivo')}
                className={`py-3 px-4 rounded-lg border font-medium transition-colors ${
                  metodoPago === 'efectivo'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Efectivo
              </button>
              <button
                onClick={() => setMetodoPago('fiado')}
                className={`py-3 px-4 rounded-lg border font-medium transition-colors ${
                  metodoPago === 'fiado'
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Fiado
              </button>
            </div>
          </div>

          {/* Observaciones */}
          <div className="mb-6">
            <label htmlFor='observaciones' className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>
          
          {/* Botones de acción */}
          <div className="space-y-3">
            <button 
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              onClick={handleVentaEfectivo}
              disabled={total === 0}
            >
              Venta Efectivo
            </button>
            <button 
              className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              onClick={handleVentaFiado}
              disabled={total === 0}
            >
              Venta Fiado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VentasPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos] = useState<Producto[]>([
    { id: 1, nombre: "Soda 1L", precio: 800, stock: 50 },
    { id: 2, nombre: "Soda 2L", precio: 1200, stock: 30 },
    { id: 3, nombre: "Agua 500ml", precio: 400, stock: 100 },
    { id: 4, nombre: "Agua 1L", precio: 600, stock: 80 },
    { id: 5, nombre: "Limonada 1L", precio: 1000, stock: 25 },
    { id: 6, nombre: "Naranja 1L", precio: 1000, stock: 25 }
  ]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  useEffect(() => {
    // Simular carga de clientes
    setClientes([
      { id: 1, nombre: "María González", direccion: "Av. San Martín 1234", telefono: "11-1234-5678", email: "maria@email.com" },
      { id: 2, nombre: "Carlos Rodríguez", direccion: "Belgrano 567", telefono: "11-8765-4321", email: "carlos@email.com" },
      { id: 3, nombre: "Ana Martínez", direccion: "Rivadavia 890", telefono: "11-5555-9999", email: "ana@email.com" }
    ]);
  }, []);

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVentaCompletada = (venta: any) => {
    console.log('Venta completada:', venta);
    // Aquí se enviaría la venta al backend
    alert('Venta registrada exitosamente');
    setClienteSeleccionado(null);
  };

  if (clienteSeleccionado) {
    return (
      <VentaRapida
        cliente={clienteSeleccionado}
        productos={productos}
        onVentaCompletada={handleVentaCompletada}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Nueva Venta</h1>
        <p className="text-gray-600">Selecciona un cliente para comenzar</p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 text-lg">Clientes</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {clientesFiltrados.map(cliente => (
            <button
              key={cliente.id}
              className="p-6 active:bg-gray-50 cursor-pointer hover:bg-gray-50 transition-colors w-full text-left"
              onClick={() => setClienteSeleccionado(cliente)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-lg">{cliente.nombre}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{cliente.direccion}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{cliente.telefono}</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {clientesFiltrados.length === 0 && searchTerm && (
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}
    </div>
  );
};

export default VentasPage;
