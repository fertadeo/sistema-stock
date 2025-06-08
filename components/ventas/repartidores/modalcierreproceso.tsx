import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Checkbox, Alert, Input } from "@heroui/react";
import { Proceso } from '@/types/ventas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import Notification from "@/components/notification";

// Agregar la declaración de tipos para autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => void;
  }
}

interface ModalCierreProcesoProps {
  isOpen: boolean;
  onClose: () => void;
  proceso: Proceso | null;
  obtenerPrecioProducto: (producto_id: number) => number;
  onProcesoGuardado: () => void;
}

const ModalCierreProceso: React.FC<ModalCierreProcesoProps> = ({
  isOpen,
  onClose,
  proceso,
  obtenerPrecioProducto,
  onProcesoGuardado
}) => {
  const [comisionPorcentaje, setComisionPorcentaje] = useState<number>(20);
  const [montoTransferencia, setMontoTransferencia] = useState<number>(0);
  const [montoEfectivoRecaudado, setMontoEfectivoRecaudado] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [productosDetalle, setProductosDetalle] = useState<any[]>([]);
  const [editandoPrecioIndex, setEditandoPrecioIndex] = useState<number | null>(null);
  const [preciosOriginales, setPreciosOriginales] = useState<number[]>([]);
  const [resultadoGuardado, setResultadoGuardado] = useState<{[index: number]: {success: boolean, message: string}}>(
    {}
  );
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    description: '',
    type: 'success' as 'success' | 'error'
  });

  // Cargar los montos cuando se abre el modal y el proceso está cerrado
  useEffect(() => {
    if (proceso?.id && proceso.estado_cuenta === 'finalizado') {
      const cargarDatosVenta = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ventas-cerradas?proceso_id=${proceso.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Datos de venta cerrada por proceso_id:', data);
            if (data.success && data.ventas_cerradas) {
              // Buscamos la venta cerrada que corresponde a este proceso
              const ventaCerrada = data.ventas_cerradas.find(
                (venta: { proceso_id: number }) => venta.proceso_id === proceso.id
              );
              
              if (ventaCerrada) {
                console.log('Venta cerrada encontrada:', ventaCerrada);
                setMontoEfectivoRecaudado(parseFloat(ventaCerrada.monto_efectivo) || 0);
                setMontoTransferencia(parseFloat(ventaCerrada.monto_transferencia) || 0);
              }
            }
          }
        } catch (error) {
          console.error('Error al cargar datos de la venta:', error);
        }
      };
      cargarDatosVenta();
    } else {
      // Si el proceso no está cerrado, reiniciar los valores
      setMontoEfectivoRecaudado(0);
      setMontoTransferencia(0);
    }
  }, [proceso?.id, proceso?.estado_cuenta, isOpen]);

  // Inicializar los productos detalle y precios originales cuando se abre el modal
  useEffect(() => {
    if (proceso?.productos_detalle) {
      setProductosDetalle(proceso.productos_detalle.map(item => ({
        ...item,
        precio_unitario: item.precio_unitario || 0
      })));
      setPreciosOriginales(proceso.productos_detalle.map(item => item.precio_unitario || 0));
    }
  }, [proceso?.productos_detalle]);

  // Función para formatear números con separadores de miles
  const formatearNumero = (numero: number): string => {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Función para limpiar el formato y obtener solo números
  const limpiarFormato = (valor: string): number => {
    return parseFloat(valor.replace(/\./g, "")) || 0;
  };

  // Función para calcular el total de la venta
  const calcularTotalVenta = () => {
    if (!productosDetalle || productosDetalle.length === 0) return 0;
    return productosDetalle.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  };

  // Calcular valores
  const totalVenta = calcularTotalVenta();
  const totalRecaudado = montoEfectivoRecaudado + montoTransferencia;
  const balanceFiado = totalRecaudado - totalVenta;

  // Función para actualizar el precio unitario de un producto
  const handlePrecioUnitarioChange = (index: number, nuevoPrecio: number) => {
    const nuevosProductos = [...productosDetalle];
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      precio_unitario: nuevoPrecio,
      subtotal: nuevoPrecio * nuevosProductos[index].cantidad_vendida
    };
    setProductosDetalle(nuevosProductos);
  };

  // PUT individual por producto
  const actualizarPrecioUnitarioFila = async (index: number) => {
    if (!proceso?.id) return;
    const item = productosDetalle[index];
    try {
      const body = {
        precios_unitarios: [
          { producto_id: item.producto_id, precio_unitario: item.precio_unitario }
        ]
      };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/descargas/${proceso.id}/precios-unitarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Error al actualizar el precio unitario');
      setPreciosOriginales(prev => prev.map((p, i) => i === index ? item.precio_unitario : p));
      setResultadoGuardado(prev => ({
        ...prev,
        [index]: { success: true, message: '¡Precio actualizado correctamente!' }
      }));

      // Refetch para actualizar datos en tiempo real
      await refetchProceso();

    } catch (error) {
      setResultadoGuardado(prev => ({
        ...prev,
        [index]: { success: false, message: 'Error al actualizar el precio en la base de datos.' }
      }));
    } finally {
      setTimeout(() => {
        setResultadoGuardado(prev => {
          const nuevo = { ...prev };
          delete nuevo[index];
          return nuevo;
        });
      }, 2500);
    }
  };

  // Función para actualizar los precios unitarios en la API
  const actualizarPreciosUnitarios = async () => {
    if (!proceso?.id) return;

    try {
      const preciosUnitarios = productosDetalle.map(item => ({
        producto_id: item.producto_id,
        precio_unitario: item.precio_unitario
      }));

      console.log('PUT /api/descargas/' + proceso.id + '/precios-unitarios', {
        precios_unitarios: preciosUnitarios
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/descargas/${proceso.id}/precios-unitarios`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          precios_unitarios: preciosUnitarios
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los precios unitarios');
      }

      // Actualizar el proceso local con los nuevos precios
      if (proceso.productos_detalle) {
        proceso.productos_detalle = productosDetalle;
      }
    } catch (error) {
      console.error('Error al actualizar precios unitarios:', error);
    }
  };

  // Nueva función para recargar el proceso
  const refetchProceso = async () => {
    if (!proceso?.id) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/procesos/${proceso.id}`);
      if (response.ok) {
        const data = await response.json();
        // Actualiza el estado local con los datos nuevos
        if (data && data.proceso) {
          setProductosDetalle(data.proceso.productos_detalle.map((item: any) => ({
            ...item,
            precio_unitario: item.precio_unitario || 0
          })));
          setPreciosOriginales(data.proceso.productos_detalle.map((item: any) => item.precio_unitario || 0));
        }
      }
    } catch (error) {
      console.error('Error al recargar el proceso:', error);
    }
  };

  const handleGuardarProceso = async () => {
    if (!proceso?.id || !proceso.repartidor?.id) {
      console.error('Faltan datos del proceso o repartidor');
      return;
    }

    // Si hay una edición pendiente, la cerramos y nos aseguramos de tomar el valor actual
    if (editandoPrecioIndex !== null) {
      setEditandoPrecioIndex(null);
      // No hace falta esperar, porque productosDetalle ya tiene el valor actualizado
    }

    setIsLoading(true);
    try {
      // Primero actualizar los precios unitarios
      await actualizarPreciosUnitarios();

      const datosProceso = {
        proceso_id: proceso.id,
        monto_efectivo: montoEfectivoRecaudado,
        monto_transferencia: montoTransferencia,
        balance_fiado: balanceFiado,
        repartidor_id: proceso.repartidor.id
      };

      console.log('Datos del proceso a cerrar:', {
        proceso: {
          id: proceso.id,
          repartidor: proceso.repartidor,
          fecha_descarga: proceso.fecha_descarga,
          estado_cuenta: proceso.estado_cuenta,
          totales: proceso.totales,
          productos_detalle: proceso.productos_detalle
        },
        datosEnvio: datosProceso,
        calculos: {
          totalVenta,
          totalRecaudado,
          balanceFiado
        }
      });

      // Primero guardar el proceso en ventas-cerradas
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ventas-cerradas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosProceso)
      });

      if (!response.ok) {
        throw new Error('Error al guardar el proceso');
      }

      // Actualizar el estado del proceso a procesado
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/procesos/${proceso.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: 'procesado'
        })
      });

      if (!updateResponse.ok) {
        console.warn('No se pudo actualizar el estado del proceso');
      }

      // Cerrar el modal y actualizar los datos
      onClose();
      // Pequeño retraso para asegurar que el backend haya procesado los cambios
      setTimeout(async () => {
        await refetchProceso();
        onProcesoGuardado();
      }, 500);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generarPDF = () => {
    if (!proceso) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título y encabezado
    doc.setFontSize(18);
    doc.text('Boleta de Venta', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Repartidor: ${proceso.repartidor?.nombre || 'No especificado'}`, 15, 25);
    doc.text(`ID Proceso: ${proceso.id}`, pageWidth - 15, 25, { align: 'right' });
    doc.text(`Fecha: ${new Date(proceso.fecha_descarga).toLocaleDateString()}`, pageWidth - 15, 30, { align: 'right' });
    doc.text(`Hora: ${new Date(proceso.fecha_descarga).toLocaleTimeString()}`, pageWidth - 15, 35, { align: 'right' });

    // Tabla de productos
    const productosData = proceso.productos_detalle?.map(item => [
      item.nombre,
      item.cantidad_vendida.toString(),
      `$${item.precio_unitario.toFixed(2)}`,
      `$${item.subtotal.toFixed(2)}`
    ]) || [];

    autoTable(doc, {
      startY: 45,
      head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: productosData,
    });

    // Resumen de pagos
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.text('Resumen de Pagos:', 15, finalY);
    doc.text(`Total Venta: $${totalVenta.toFixed(2)}`, pageWidth - 15, finalY, { align: 'right' });
    doc.text(`Efectivo Recaudado: $${montoEfectivoRecaudado.toFixed(2)}`, pageWidth - 15, finalY + 7, { align: 'right' });
    doc.text(`Transferencia: $${montoTransferencia.toFixed(2)}`, pageWidth - 15, finalY + 14, { align: 'right' });
    doc.text(`Total Recaudado: $${totalRecaudado.toFixed(2)}`, pageWidth - 15, finalY + 21, { align: 'right' });
    
    const balanceText = `Balance Fiado: $${balanceFiado.toFixed(2)} ${balanceFiado < 0 ? '(Faltante)' : '(A favor)'}`;
    doc.setTextColor(balanceFiado >= 0 ? 0x00 : 0xFF, 0x00, 0x00);
    doc.text(balanceText, pageWidth - 15, finalY + 28, { align: 'right' });

    // Guardar el PDF
    doc.save(`boleta-venta-${proceso.id}.pdf`);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xl font-bold">Boleta de Venta</h4>
              <p className="text-sm text-gray-600">
                Repartidor: {proceso?.repartidor?.nombre || 'No especificado'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">ID Proceso: {proceso?.id}</p>
              <p className="text-sm text-gray-600">
                Fecha: {proceso?.fecha_descarga ? new Date(proceso.fecha_descarga).toLocaleDateString() : 'No disponible'}
              </p>
              <p className="text-sm text-gray-600">
                Hora: {proceso?.fecha_descarga ? new Date(proceso.fecha_descarga).toLocaleTimeString() : 'No disponible'}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {proceso?.estado_cuenta === 'finalizado' && (
            <Alert
              color="warning"
              variant="flat"
              className="mb-4"
            >
              Este proceso ya está finalizado y no puede ser modificado.
            </Alert>
          )}
          <div className="space-y-6">
            <Table aria-label="Detalle de Venta">
              <TableHeader>
                <TableColumn>Producto</TableColumn>
                <TableColumn>Cantidad</TableColumn>
                <TableColumn>Precio Unitario</TableColumn>
                <TableColumn>Subtotal</TableColumn>
              </TableHeader>
              <TableBody>
                {productosDetalle.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.cantidad_vendida}</TableCell>
                    <TableCell>
                      <div className="flex relative flex-col gap-1 items-start">
                        <div className="flex gap-2 items-center">
                          <span>$</span>
                          <input
                            type="number"
                            value={item.precio_unitario}
                            onChange={(e) => {
                              if (proceso?.estado_cuenta !== 'finalizado') {
                                const nuevoPrecio = parseFloat(e.target.value) || 0;
                                handlePrecioUnitarioChange(index, nuevoPrecio);
                              }
                            }}
                            onFocus={() => setEditandoPrecioIndex(index)}
                            onBlur={() => setEditandoPrecioIndex(null)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' &&
                                  proceso?.estado_cuenta !== 'finalizado' &&
                                  item.precio_unitario !== preciosOriginales[index]
                              ) {
                                await actualizarPrecioUnitarioFila(index);
                                setEditandoPrecioIndex(null);
                              } else if (e.key === 'Escape') {
                                setEditandoPrecioIndex(null);
                              }
                            }}
                            className={`w-24 text-right rounded border transition-colors duration-200 ${
                              proceso?.estado_cuenta === 'finalizado'
                                ? 'bg-gray-100 cursor-not-allowed'
                                : editandoPrecioIndex === index
                                  ? 'bg-yellow-100 border-yellow-400'
                                  : 'bg-white'
                            }`}
                            disabled={proceso?.estado_cuenta === 'finalizado'}
                            min="0"
                            step="0.01"
                          />
                          {proceso?.estado_cuenta !== 'finalizado' && (
                            <>
                              <button
                                type="button"
                                className="p-0.5 text-blue-500 hover:text-blue-700 focus:outline-none"
                                tabIndex={-1}
                                onClick={() => setEditandoPrecioIndex(index)}
                              >
                                <PencilSquareIcon className="w-5 h-5" />
                              </button>
                              <button
                                type="button"
                                className={`ml-1 p-0.5 text-green-600 hover:text-green-800 focus:outline-none ${item.precio_unitario === preciosOriginales[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={item.precio_unitario === preciosOriginales[index]}
                                onClick={async () => await actualizarPrecioUnitarioFila(index)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                        {editandoPrecioIndex === index && (
                          <span className="mt-1 text-xs text-blue-600">Presione enter para guardar cambios</span>
                        )}
                        {resultadoGuardado[index] && (
                          <Alert
                            color={resultadoGuardado[index].success ? 'success' : 'danger'}
                            variant="flat"
                            className="mt-1"
                          >
                            {resultadoGuardado[index].message}
                          </Alert>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Resumen de la venta */}
            <div className="pt-4 space-y-4 border-t">
              <div className="flex gap-4 justify-end items-center">
                <span className="font-bold">Total Venta:</span>
                <span className="w-32 text-xl font-bold text-right">
                  ${totalVenta.toFixed(2)}
                </span>
              </div>

              {proceso?.productos_detalle && (
                <div className="space-y-4">
                  {/* Nueva sección de pagos por transferencia */}
                  <div className="pt-4 space-y-4 border-t">
                    <h5 className="font-bold">Registro de Pagos</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="flex justify-end items-center">
                          <span className="font-bold">Recaudación en Efectivo:</span>
                        </div>
                        <div className="flex justify-end items-center">
                          <span className="font-bold">Total transferido:</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex gap-2 items-center w-32">
                          <span>$</span>
                          <input
                            type="text"
                            value={montoEfectivoRecaudado === 0 ? '' : formatearNumero(montoEfectivoRecaudado)}
                            onChange={(e) => {
                              if (proceso?.estado_cuenta !== 'finalizado') {
                                const valorLimpio = limpiarFormato(e.target.value);
                                setMontoEfectivoRecaudado(valorLimpio);
                              }
                            }}
                            className={`p-2 w-full text-right rounded border ${
                              proceso?.estado_cuenta === 'finalizado' ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="0"
                            readOnly={proceso?.estado_cuenta === 'finalizado'}
                          />
                        </div>
                        <div className="flex gap-2 items-center w-32">
                          <span>$</span>
                          <input
                            type="text"
                            value={montoTransferencia === 0 ? '' : formatearNumero(montoTransferencia)}
                            onChange={(e) => {
                              if (proceso?.estado_cuenta !== 'finalizado') {
                                const valorLimpio = limpiarFormato(e.target.value);
                                setMontoTransferencia(valorLimpio);
                              }
                            }}
                            placeholder="0"
                            className={`p-2 w-full text-right rounded border ${
                              proceso?.estado_cuenta === 'finalizado' ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            readOnly={proceso?.estado_cuenta === 'finalizado'}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 mt-2 space-y-2 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">
                        Total recaudado: <span className="font-medium">${totalRecaudado.toFixed(2)}</span>
                      </p>
                      <p className={`font-medium ${balanceFiado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Balance Fiado: ${balanceFiado.toFixed(2)}
                        {balanceFiado < 0 ? ' (Faltante)' : ' (A favor)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex gap-2 justify-end">
          {proceso?.estado_cuenta === 'finalizado' && (
            <Button 
              color="primary"
              onClick={generarPDF}
            >
              Descargar PDF
            </Button>
          )}
          <Button 
            color="danger"
            variant="light"
            onClick={onClose}
            disabled={isLoading}
          >
            Cerrar
          </Button>
          {proceso?.estado_cuenta !== 'finalizado' && (
            <Button 
              color="success"
              className="text-white bg-green-600"
              onClick={handleGuardarProceso}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Proceso'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
      <Notification
        message={notification.message}
        description={notification.description}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        type={notification.type}
      />
    </Modal>
  );
};

export default ModalCierreProceso;
