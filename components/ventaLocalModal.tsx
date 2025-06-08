import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@heroui/react";
import { FaEdit } from "react-icons/fa";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Producto {
  id: string;
  nombreProducto: string;
  precioPublico: number;
  precioRevendedor: number;
  cantidadStock: number;
  descripcion: string;
}

interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
}

interface ProductoVenta {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  nombre_producto?: string;
}

interface VentaLocalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVentaAgregada?: (venta: any) => void;
}

const VentaLocalModal: React.FC<VentaLocalModalProps> = ({ isOpen, onClose, onVentaAgregada }) => {
  const [productos, setProductos] = useState<ProductoVenta[]>([
    { producto_id: "", cantidad: 1, precio_unitario: 0 }
  ]);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombreProducto: "",
    precioPublico: "",
    precioRevendedor: "",
    cantidadStock: "",
    descripcion: ""
  });
  const [editandoPrecio, setEditandoPrecio] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    if (isOpen) {
      cargarProductos();
      cargarClientes();
    }
  }, [isOpen]);

  const cargarClientes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`);
      if (!response.ok) throw new Error('Error al cargar clientes');
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      setError("Error al cargar los clientes");
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`);
      if (!response.ok) throw new Error('Error al cargar productos');
      const data = await response.json();
      setProductosDisponibles(data);
    } catch (error) {
      setError("Error al cargar los productos");
    }
  };

  const handleBuscarCliente = (nombre: string) => {
    setNombreCliente(nombre);
    setMostrarSugerencias(true);
  };

  const handleSeleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setNombreCliente(cliente.nombre);
    setTelefonoCliente(cliente.telefono || "");
    setMostrarSugerencias(false);
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(nombreCliente.toLowerCase())
  );

  const handleGuardar = async () => {
    if (!metodoPago) {
      setError("Debe seleccionar un método de pago.");
      return;
    }
    try {
      setIsLoading(true);
      const montoTotal = productos.reduce((total, prod) => total + (prod.cantidad * prod.precio_unitario), 0);
      
      const valoresValidos = ["efectivo", "transferencia", "debito", "credito"];
      const metodoPagoValido = valoresValidos.includes(metodoPago) ? metodoPago : "efectivo";

      const ventaData = {
        productos: productos.map(p => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          nombre: p.nombre_producto || ""
        })),
        monto_total: montoTotal,
        cliente_id: clienteSeleccionado?.id || "",
        nombre_cliente: nombreCliente,
        telefono_cliente: telefonoCliente,
        metodo_pago: metodoPagoValido,
        forma_pago: "total",
        observaciones
      };

      console.log('Venta enviada:', ventaData);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ventas/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        throw new Error('Error al registrar la venta');
      }

      if (onVentaAgregada) {
        onVentaAgregada(ventaData);
      }
      generarPDFVenta(ventaData);
      
      handleClose();
    } catch (error) {
      setError("Error al registrar la venta. Por favor, intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProductos([{ producto_id: "", cantidad: 1, precio_unitario: 0 }]);
    setNombreCliente("");
    setTelefonoCliente("");
    setMetodoPago("efectivo");
    setObservaciones("");
    setError("");
    setShowNuevoProducto(false);
    onClose();
  };

  const agregarProducto = () => {
    setProductos([...productos, { producto_id: "", cantidad: 1, precio_unitario: 0 }]);
  };

  const actualizarProducto = (index: number, campo: keyof ProductoVenta, valor: string | number) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      [campo]: valor
    };
    setProductos(nuevosProductos);
  };

  const seleccionarProducto = (index: number, productoId: string) => {
    const productoSeleccionado = productosDisponibles.find(p => String(p.id) === productoId);
    setProductos(prev => {
      const nuevos = [...prev];
      if (productoSeleccionado) {
        nuevos[index] = {
          ...nuevos[index],
          producto_id: String(productoSeleccionado.id),
          precio_unitario: productoSeleccionado.precioPublico,
          nombre_producto: productoSeleccionado.nombreProducto,
        };
      } else {
        nuevos[index] = {
          ...nuevos[index],
          producto_id: "",
          precio_unitario: 0,
          nombre_producto: "",
        };
      }
      return nuevos;
    });
  };

  const crearNuevoProducto = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos/crear-producto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreProducto: nuevoProducto.nombreProducto,
          precioPublico: parseFloat(nuevoProducto.precioPublico),
          precioRevendedor: parseFloat(nuevoProducto.precioRevendedor),
          cantidadStock: parseInt(nuevoProducto.cantidadStock),
          descripcion: nuevoProducto.descripcion
        }),
      });

      if (!response.ok) throw new Error('Error al crear el producto');
      
      await cargarProductos();
      setShowNuevoProducto(false);
      setNuevoProducto({
        nombreProducto: "",
        precioPublico: "",
        precioRevendedor: "",
        cantidadStock: "",
        descripcion: ""
      });
    } catch (error) {
      setError("Error al crear el producto");
    } finally {
      setIsLoading(false);
    }
  };

  const generarPDFVenta = (ventaData: any) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Comprobante de Venta', 14, 20);

    doc.setFontSize(12);
    doc.text(`Cliente: ${ventaData.nombre_cliente || ''}`, 14, 35);
    doc.text(`Teléfono: ${ventaData.telefono_cliente || ''}`, 14, 42);
    doc.text(`Método de pago: ${ventaData.metodo_pago || ''}`, 14, 49);
    doc.text(`Observaciones: ${ventaData.observaciones || ''}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
      body: ventaData.productos.map((p: any) => [
        p.nombre,
        p.cantidad,
        `$${p.precio_unitario}`,
        `$${(p.cantidad * p.precio_unitario).toFixed(2)}`
      ]),
    });

    doc.text(
      `Total: $${ventaData.monto_total.toFixed(2)}`,
      14,
      ((doc as any).lastAutoTable?.finalY || 75) + 10
    );

    doc.save('venta.pdf');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} backdrop="blur" size="2xl">
      <ModalContent>
        <ModalHeader>Venta en local</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-lg border">
              <h3 className="mb-4 text-lg font-semibold">Datos del Cliente</h3>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Input
                    label="Nombre del Cliente"
                    value={nombreCliente}
                    onChange={e => handleBuscarCliente(e.target.value)}
                    placeholder="Buscar o ingresar nombre del cliente"
                  />
                  {mostrarSugerencias && nombreCliente && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md border shadow-lg">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(cliente => (
                          <button
                            key={cliente.id}
                            className="px-4 py-2 w-full text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSeleccionarCliente(cliente)}
                          >
                            {cliente.nombre}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">
                          No se encontraron clientes
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    label="Teléfono del Cliente (opcional)"
                    value={telefonoCliente}
                    onChange={e => setTelefonoCliente(e.target.value)}
                    placeholder="Ingrese el teléfono del cliente"
                    type="tel"
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 max-h-72 rounded-lg border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Productos</h3>
                <div className="flex gap-2">
                  <Button 
                    isIconOnly
                    color="primary" 
                    onClick={agregarProducto}
                    aria-label="Agregar producto"
                  >
                    +
                  </Button>
                  <Button 
                    color="secondary" 
                    onClick={() => setShowNuevoProducto(true)}
                  >
                    Agregar al Catálogo
                  </Button>
                </div>
              </div>
              {productos.map((producto, index) => (
                <div key={index} className={`flex gap-4 p-4 mb-4 rounded-lg border items-center ${editandoPrecio[index] ? 'bg-yellow-50 border-yellow-400' : ''}`}>
                  <div className="flex flex-col flex-1 justify-end">
                    <label className="block mb-1 text-sm font-medium" htmlFor={`producto-${index}`}>Producto</label>
                    <select
                      id={`producto-${index}`}
                      className="px-3 py-2 w-full text-sm bg-gray-50 rounded-lg border border-gray-300 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      value={producto.producto_id || ""}
                      onChange={e => seleccionarProducto(index, e.target.value)}
                    >
                      <option value="">Seleccione un producto</option>
                      {productosDisponibles.map(p => (
                        <option key={p.id} value={String(p.id)}>
                          {p.nombreProducto} - ${p.precioPublico}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end w-32">
                    <label className="block mb-1 text-sm font-medium" htmlFor={`cantidad-${index}`}>Cantidad</label>
                    <input
                      id={`cantidad-${index}`}
                      type="number"
                      className="px-3 py-2 w-full text-sm bg-gray-50 rounded-lg border border-gray-300 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      value={producto.cantidad}
                      min={1}
                      onChange={e => actualizarProducto(index, 'cantidad', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex relative flex-col justify-end w-40">
                    <label className="block mb-1 text-sm font-medium" htmlFor={`precio-${index}`}>Precio Unitario</label>
                    <input
                      id={`precio-${index}`}
                      type="number"
                      className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${editandoPrecio[index] ? 'bg-yellow-100 border-yellow-500' : 'bg-gray-50 border-gray-300'}`}
                      value={producto.precio_unitario}
                      min={0}
                      onChange={e => actualizarProducto(index, 'precio_unitario', parseFloat(e.target.value))}
                      readOnly={!editandoPrecio[index]}
                    />
                    <button
                      type="button"
                      className={`absolute right-2 top-7 text-primary-500 hover:text-primary-700 ${editandoPrecio[index] ? 'scale-125' : ''}`}
                      onClick={() => setEditandoPrecio(prev => ({ ...prev, [index]: !prev[index] }))}
                      title="Editar precio"
                    >
                      <FaEdit />
                    </button>
                  </div>
                  <div className="flex items-end h-full">
                    <Button 
                      color="danger" 
                      variant="light"
                      onClick={() => {
                        const nuevosProductos = [...productos];
                        nuevosProductos.splice(index, 1);
                        setProductos(nuevosProductos);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg border">
              <h3 className="mb-4 text-lg font-semibold">Detalles de la Venta</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-medium" htmlFor="metodo-pago">Método de Pago</label>
                  <select
                    id="metodo-pago"
                    value={metodoPago}
                    onChange={e => setMetodoPago(e.target.value)}
                    className="px-3 py-2 w-full text-sm bg-gray-50 rounded-lg border border-gray-300 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Input
                    label="Observaciones"
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    placeholder="Ingrese observaciones adicionales"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border">
              <h3 className="mb-4 text-lg font-semibold">Resumen</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${productos.reduce((total, prod) => total + (prod.cantidad * prod.precio_unitario), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${productos.reduce((total, prod) => total + (prod.cantidad * prod.precio_unitario), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-4 justify-between items-center w-full">
            <div className="flex-1"></div>
            <div className="flex gap-2">
              <Button color="danger" variant="light" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                color="success" 
                onClick={handleGuardar} 
                style={{ color: "white" }}
                isLoading={isLoading}
              >
                Guardar
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>

      {/* Modal para nuevo producto */}
      <Modal isOpen={showNuevoProducto} onClose={() => setShowNuevoProducto(false)}>
        <ModalContent>
          <ModalHeader>Agregar Nuevo Producto</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="Nombre del Producto"
                value={nuevoProducto.nombreProducto}
                onChange={e => setNuevoProducto({...nuevoProducto, nombreProducto: e.target.value})}
                placeholder="Ingrese el nombre del producto"
              />
              <Input
                label="Precio Público"
                type="number"
                value={nuevoProducto.precioPublico}
                onChange={e => setNuevoProducto({...nuevoProducto, precioPublico: e.target.value})}
                placeholder="Ingrese el precio público"
              />
              <Input
                label="Precio Revendedor"
                type="number"
                value={nuevoProducto.precioRevendedor}
                onChange={e => setNuevoProducto({...nuevoProducto, precioRevendedor: e.target.value})}
                placeholder="Ingrese el precio revendedor"
              />
              <Input
                label="Cantidad en Stock"
                type="number"
                value={nuevoProducto.cantidadStock}
                onChange={e => setNuevoProducto({...nuevoProducto, cantidadStock: e.target.value})}
                placeholder="Ingrese la cantidad en stock"
              />
              <Input
                label="Descripción"
                value={nuevoProducto.descripcion}
                onChange={e => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                placeholder="Ingrese la descripción del producto"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onClick={() => setShowNuevoProducto(false)}>
              Cancelar
            </Button>
            <Button 
              color="success" 
              onClick={crearNuevoProducto}
              isLoading={isLoading}
            >
              Crear Producto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
  );
};

export default VentaLocalModal; 