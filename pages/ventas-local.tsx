import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, Card } from "@heroui/react";
import { FiFileText } from "react-icons/fi";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProductoVenta {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  nombre?: string;
  nombre_producto?: string;
  producto?: string;
}

interface Venta {
  id: string | number;
  productos: ProductoVenta[];
  monto_total: number;
  cliente_id?: string;
  nombre_cliente: string;
  telefono_cliente: string;
  medio_pago: string;
  forma_pago: string;
  observaciones?: string;
  fecha_venta?: string;
}

const VentasLocalPage: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [catalogoProductos, setCatalogoProductos] = useState<{ id: string, nombre: string }[]>([]);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ventas/local`);
        if (!response.ok) throw new Error('Error al obtener ventas');
        const data = await response.json();
        setVentas(data.ventas);
      } catch (err) {
        setError("Error al obtener las ventas");
      } finally {
        setLoading(false);
      }
    };
    fetchVentas();

    // Fetch productos para el catálogo
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`);
        if (!response.ok) throw new Error('Error al obtener productos');
        const data = await response.json();
        setCatalogoProductos(data.map((p: any) => ({
          id: p.id?.toString(),
          nombre: p.nombre || p.nombre_producto || p.producto || 'Sin nombre'
        })));
      } catch (err) {
        // Manejo de error opcional
      }
    };
    fetchProductos();
  }, []);

  const abrirModalPDF = (venta: Venta) => {
    setVentaSeleccionada(venta);
    setModalOpen(true);
  };

  const cerrarModalPDF = () => {
    setModalOpen(false);
    setVentaSeleccionada(null);
  };

  const descargarPDF = (venta: Venta) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Comprobante de Venta', 14, 20);
    doc.setFontSize(12);
    doc.text(`Cliente: ${venta.nombre_cliente || ''}`, 14, 35);
    doc.text(`Teléfono: ${venta.telefono_cliente || ''}`, 14, 42);
    doc.text(`Método de pago: ${venta.medio_pago || ''}`, 14, 49);
    doc.text(`Observaciones: ${venta.observaciones || ''}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
      body: venta.productos.map((p: any) => [
        getNombreProducto(p),
        p.cantidad,
        `$${p.precio_unitario}`,
        `$${(p.cantidad * p.precio_unitario).toFixed(2)}`
      ]),
    });

    doc.text(
      `Total: $${Number(venta.monto_total).toFixed(2)}`,
      14,
      ((doc as any).lastAutoTable?.finalY || 75) + 10
    );

    doc.save('venta.pdf');
  };

  const getNombreProducto = (p: ProductoVenta) => {
    return (
      p.nombre ||
      p.nombre_producto ||
      p.producto ||
      catalogoProductos.find(prod => prod.id === p.producto_id?.toString())?.nombre ||
      'Sin nombre'
    );
  };

  return (
    <div className="p-6 mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">Ventas en Local</h1>
      {loading ? (
        <div>Cargando ventas...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Card className="p-4 shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-lg border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Teléfono</th>
                  <th className="px-4 py-2">Productos</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Método de Pago</th>
                  <th className="px-4 py-2">Forma de Pago</th>
                  <th className="px-4 py-2">Observaciones</th>
                  <th className="px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id} className="border-b">
                    <td className="px-4 py-2 text-sm">
                      {venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm">{venta.nombre_cliente}</td>
                    <td className="px-4 py-2 text-sm">{venta.telefono_cliente}</td>
                    <td className="px-4 py-2 text-sm">
                      <ul className="pl-4 list-disc">
                        {venta.productos.map((p) => (
                          <li key={p.producto_id}>
                            {getNombreProducto(p)} x {p.cantidad} (${p.precio_unitario})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-2 font-semibold">${venta.monto_total}</td>
                    <td className="px-4 py-2 text-sm">{venta.medio_pago}</td>
                    <td className="px-4 py-2 text-sm">{venta.forma_pago}</td>
                    <td className="px-4 py-2 text-sm">{venta.observaciones || '-'}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => abrirModalPDF(venta)}>
                        <FiFileText className="text-xl text-blue-600 hover:text-blue-800" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Modal isOpen={modalOpen} onClose={cerrarModalPDF} size="lg">
        <ModalContent>
          <ModalHeader>Vista previa PDF</ModalHeader>
          <ModalBody>
            {ventaSeleccionada && (
              <div>
                <p><b>Cliente:</b> {ventaSeleccionada.nombre_cliente}</p>
                <p><b>Teléfono:</b> {ventaSeleccionada.telefono_cliente}</p>
                <p><b>Método de pago:</b> {ventaSeleccionada.medio_pago}</p>
                <p><b>Observaciones:</b> {ventaSeleccionada.observaciones || '-'}</p>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaSeleccionada.productos.map((p) => (
                      <tr key={p.producto_id}>
                        <td>{getNombreProducto(p)}</td>
                        <td>{p.cantidad}</td>
                        <td>${p.precio_unitario}</td>
                        <td>${(p.cantidad * p.precio_unitario).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 font-bold">Total: ${Number(ventaSeleccionada.monto_total).toFixed(2)}</div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => ventaSeleccionada && descargarPDF(ventaSeleccionada)}>
              Descargar
            </Button>
            <Button color="danger" variant="light" onClick={cerrarModalPDF}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default VentasLocalPage; 