"use client"

import { useState } from 'react';
import { SideBar } from '@/components/sidebar';
import { TopBar } from '@/components/topBar';

interface Cliente {
  id: string;
  nombre: string;
  cuit: string;
  direccion: string;
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export default function GenerarFacturaPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tipoFactura, setTipoFactura] = useState<'A' | 'B' | 'C'>('A');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Datos de ejemplo
  const clientesEjemplo: Cliente[] = [
    { id: '1', nombre: 'Juan Pérez', cuit: '20-12345678-9', direccion: 'Av. Corrientes 1234' },
    { id: '2', nombre: 'María González', cuit: '27-87654321-0', direccion: 'Av. Santa Fe 5678' },
    { id: '3', nombre: 'Carlos López', cuit: '20-11223344-5', direccion: 'Av. Córdoba 9012' }
  ];

  const productosEjemplo: Producto[] = [
    { id: '1', nombre: 'Soda 1.5L', precio: 500, cantidad: 0 },
    { id: '2', nombre: 'Soda 2L', precio: 700, cantidad: 0 },
    { id: '3', nombre: 'Agua 500ml', precio: 300, cantidad: 0 },
    { id: '4', nombre: 'Agua 1L', precio: 450, cantidad: 0 }
  ];

  const [productosDisponibles] = useState(productosEjemplo);

  const agregarProducto = (producto: Producto) => {
    const productoExistente = productos.find(p => p.id === producto.id);
    if (productoExistente) {
      setProductos(productos.map(p => 
        p.id === producto.id 
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      ));
    } else {
      setProductos([...productos, { ...producto, cantidad: 1 }]);
    }
  };

  const actualizarCantidad = (id: string, cantidad: number) => {
    if (cantidad === 0) {
      setProductos(productos.filter(p => p.id !== id));
    } else {
      setProductos(productos.map(p => 
        p.id === id ? { ...p, cantidad } : p
      ));
    }
  };

  const calcularSubtotal = () => {
    return productos.reduce((sum, producto) => sum + (producto.precio * producto.cantidad), 0);
  };

  const calcularIVA = () => {
    const subtotal = calcularSubtotal();
    return tipoFactura === 'A' ? subtotal * 0.21 : 0;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIVA();
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  const generarFactura = () => {
    if (!cliente || productos.length === 0) {
      alert('Por favor selecciona un cliente y al menos un producto');
      return;
    }

    const factura = {
      cliente,
      productos,
      tipoFactura,
      fechaVencimiento,
      observaciones,
      subtotal: calcularSubtotal(),
      iva: calcularIVA(),
      total: calcularTotal()
    };

    console.log('Factura generada:', factura);
    alert('Factura generada exitosamente');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SideBar />
      <div className="md:ml-60">
        <TopBar />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Generar Factura</h1>
              <p className="text-gray-600">Crea una nueva factura para tus clientes</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Información del cliente */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Cliente
                      </label>
                      <select
                        value={cliente?.id || ''}
                        onChange={(e) => {
                          const clienteSeleccionado = clientesEjemplo.find(c => c.id === e.target.value);
                          setCliente(clienteSeleccionado || null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar cliente...</option>
                        {clientesEjemplo.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre} - {cliente.cuit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Factura
                      </label>
                      <select
                        value={tipoFactura}
                        onChange={(e) => setTipoFactura(e.target.value as 'A' | 'B' | 'C')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="A">Factura A (Responsable Inscripto)</option>
                        <option value="B">Factura B (Consumidor Final)</option>
                        <option value="C">Factura C (Exento)</option>
                      </select>
                    </div>
                  </div>

                  {cliente && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <h3 className="font-medium text-gray-900">{cliente.nombre}</h3>
                      <p className="text-sm text-gray-600">CUIT: {cliente.cuit}</p>
                      <p className="text-sm text-gray-600">Dirección: {cliente.direccion}</p>
                    </div>
                  )}
                </div>

                {/* Productos */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos Disponibles</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productosDisponibles.map(producto => (
                      <div key={producto.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                            <p className="text-sm text-gray-600">{formatearPrecio(producto.precio)}</p>
                          </div>
                          <button
                            onClick={() => agregarProducto(producto)}
                            className="px-3 py-1 bg-teal-500 text-white text-sm rounded-md hover:bg-teal-600"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Productos seleccionados */}
                {productos.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos Seleccionados</h2>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Producto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio Unit.
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subtotal
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {productos.map(producto => (
                            <tr key={producto.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {producto.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatearPrecio(producto.precio)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  min="1"
                                  value={producto.cantidad}
                                  onChange={(e) => actualizarCantidad(producto.id, parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatearPrecio(producto.precio * producto.cantidad)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => actualizarCantidad(producto.id, 0)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Información adicional */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Vencimiento
                      </label>
                      <input
                        type="date"
                        value={fechaVencimiento}
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>
              </div>

              {/* Resumen y acciones */}
              <div className="space-y-6">
                {/* Resumen de la factura */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de la Factura</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">{formatearPrecio(calcularSubtotal())}</span>
                    </div>
                    
                    {tipoFactura === 'A' && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">IVA (21%):</span>
                        <span className="text-sm font-medium">{formatearPrecio(calcularIVA())}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-base font-semibold text-gray-900">Total:</span>
                        <span className="text-base font-semibold text-gray-900">{formatearPrecio(calcularTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
                  
                  <div className="space-y-3">
                    <button
                      onClick={generarFactura}
                      disabled={!cliente || productos.length === 0}
                      className="w-full px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Generar Factura
                    </button>
                    
                    <button
                      onClick={() => {
                        setCliente(null);
                        setProductos([]);
                        setFechaVencimiento('');
                        setObservaciones('');
                      }}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Limpiar Formulario
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}



