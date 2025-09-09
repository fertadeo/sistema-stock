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
  onPreciosActualizados?: () => void;
  onVentasCerradasActualizadas?: () => void;
}

const ModalCierreProceso: React.FC<ModalCierreProcesoProps> = ({
  isOpen,
  onClose,
  proceso,
  obtenerPrecioProducto,
  onProcesoGuardado,
  onPreciosActualizados,
  onVentasCerradasActualizadas
}) => {
  const [comisionPorcentaje, setComisionPorcentaje] = useState<number>(20);
  const [montoTransferencia, setMontoTransferencia] = useState<number>(0);
  const [montoEfectivoRecaudado, setMontoEfectivoRecaudado] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [productosDetalle, setProductosDetalle] = useState<any[]>([]);
  const [editandoPrecioIndex, setEditandoPrecioIndex] = useState<number | null>(null);
  const [preciosOriginales, setPreciosOriginales] = useState<number[]>([]);
  const [preciosModificados, setPreciosModificados] = useState<{[key: number]: number}>({});
  const [resultadoGuardado, setResultadoGuardado] = useState<{[index: number]: {success: boolean, message: string}}>(
    {}
  );
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    description: '',
    type: 'success' as 'success' | 'error'
  });

  // Agregar nuevo estado para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [preciosConfirmados, setPreciosConfirmados] = useState(false);

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

  // Función para prevenir el cambio de valor con la rueda del mouse en inputs number
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
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
    // Validar que el precio sea un número válido y no negativo
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
      return;
    }

    const nuevosProductos = [...productosDetalle];
    const cantidad = nuevosProductos[index].cantidad_vendida;
    
    // Calcular el nuevo subtotal con precisión de 2 decimales
    const subtotal = Number((nuevoPrecio * cantidad).toFixed(2));
    
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      precio_unitario: nuevoPrecio,
      subtotal: subtotal
    };
    
    setProductosDetalle(nuevosProductos);
    
    // Guardar el precio modificado
    setPreciosModificados(prev => ({
      ...prev,
      [index]: nuevoPrecio
    }));
  };

  // Función para guardar todos los precios modificados
  const guardarPreciosModificados = async () => {
    if (!proceso?.id || Object.keys(preciosModificados).length === 0) return;

    try {
      const preciosUnitarios = Object.entries(preciosModificados).map(([index, precio]) => ({
        producto_id: productosDetalle[parseInt(index)].producto_id,
        precio_unitario: precio
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/descargas/${proceso.id}/precios-unitarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precios_unitarios: preciosUnitarios
        })
      });

      if (!response.ok) throw new Error('Error al actualizar los precios unitarios');

      // Actualizar precios originales con los nuevos valores
      setPreciosOriginales(prev => {
        const nuevos = [...prev];
        Object.entries(preciosModificados).forEach(([index, precio]) => {
          nuevos[parseInt(index)] = precio;
        });
        return nuevos;
      });

      // Mostrar mensaje de éxito
      setResultadoGuardado(prev => ({
        ...prev,
        ...Object.keys(preciosModificados).reduce((acc, index) => ({
          ...acc,
          [index]: { success: true, message: '¡Precios actualizados correctamente!' }
        }), {})
      }));

      // Limpiar precios modificados
      setPreciosModificados({});

      // Refetch para actualizar datos en tiempo real
      await refetchProceso();

      // Notificar a la página que los precios se actualizaron
      if (onPreciosActualizados) {
        onPreciosActualizados();
      }

    } catch (error) {
      console.error('Error al actualizar precios unitarios:', error);
      setResultadoGuardado(prev => ({
        ...prev,
        ...Object.keys(preciosModificados).reduce((acc, index) => ({
          ...acc,
          [index]: { success: false, message: 'Error al actualizar los precios.' }
        }), {})
      }));
    } finally {
      // Limpiar mensajes después de 2.5 segundos
      setTimeout(() => {
        setResultadoGuardado({});
      }, 2500);
    }
  };

  // Modificar el manejador de teclas para usar la nueva función
  const handleKeyDown = async (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && proceso?.estado_cuenta !== 'finalizado') {
      await guardarPreciosModificados();
      setEditandoPrecioIndex(null);
    } else if (e.key === 'Escape') {
      setEditandoPrecioIndex(null);
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

  // Modificar handleGuardarProceso para que primero muestre el modal de confirmación
  const handleGuardarProceso = async () => {
    if (!proceso?.id || !proceso.repartidor?.id) {
      console.error('Faltan datos del proceso o repartidor');
      return;
    }

    // Si hay una edición pendiente, la cerramos y nos aseguramos de tomar el valor actual
    if (editandoPrecioIndex !== null) {
      setEditandoPrecioIndex(null);
    }

    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  // Nueva función para procesar el guardado después de la confirmación
  const procesarGuardado = async () => {
    setIsLoading(true);
    try {
      // SIEMPRE enviar todos los precios unitarios actuales antes de guardar el proceso
      const preciosUnitarios = productosDetalle.map((item) => ({
        producto_id: item.producto_id,
        precio_unitario: item.precio_unitario
      }));

      // Guardar los precios unitarios actuales
      const responsePrecios = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/descargas/${proceso?.id}/precios-unitarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precios_unitarios: preciosUnitarios
        })
      });

      if (!responsePrecios.ok) {
        throw new Error('Error al actualizar los precios unitarios');
      }

      // Actualizar precios originales
      setPreciosOriginales(productosDetalle.map(item => item.precio_unitario));

      // Notificar actualización de precios
      if (onPreciosActualizados) {
        onPreciosActualizados();
      }

      const datosProceso = {
        proceso_id: proceso?.id,
        monto_efectivo: montoEfectivoRecaudado,
        monto_transferencia: montoTransferencia,
        balance_fiado: balanceFiado,
        repartidor_id: proceso?.repartidor?.id
      };

      // Guardar el proceso en ventas-cerradas
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
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/procesos/${proceso?.id}`, {
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

      // Cerrar los modales y actualizar los datos
      setShowConfirmModal(false);
      onClose();
      if (onProcesoGuardado) {
        onProcesoGuardado();
      }
      
      // Actualizar ventas cerradas si existe la función
      if (onVentasCerradasActualizadas) {
        onVentasCerradasActualizadas();
      }
      
      // Refetch para actualizar datos en tiempo real
      setTimeout(async () => {
        await refetchProceso();
      }, 500);

    } catch (error) {
      console.error('Error:', error);
      setNotification({
        isVisible: true,
        message: 'Error al guardar el proceso',
        description: 'Ha ocurrido un error al intentar guardar el proceso. Por favor, intente nuevamente.',
        type: 'error'
      });
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
    <>
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
                              value={item.precio_unitario === 0 ? "" : item.precio_unitario}
                              onChange={(e) => {
                                if (proceso?.estado_cuenta !== 'finalizado') {
                                  const nuevoPrecio = parseFloat(e.target.value) || 0;
                                  handlePrecioUnitarioChange(index, nuevoPrecio);
                                }
                              }}
                              onFocus={() => setEditandoPrecioIndex(index)}
                              onBlur={() => setEditandoPrecioIndex(null)}
                              onKeyDown={(e) => handleKeyDown(e, index)}
                              onWheel={handleWheel}
                              placeholder="0"
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
                                  className={`ml-1 p-0.5 text-green-600 hover:text-green-800 focus:outline-none ${!preciosModificados[index] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  disabled={!preciosModificados[index]}
                                  onClick={async () => await guardarPreciosModificados()}
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
      </Modal>

      {/* Modal de confirmación de precios */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-bold">Confirmar Precios Unitarios</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600">
                Por favor, revise los precios unitarios antes de cerrar el proceso. 
                Estos precios quedarán registrados en el historial.
              </p>
              
              <Table aria-label="Tabla de precios unitarios">
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
                        <div className="flex items-center gap-2">
                          <span>$</span>
                          <span className="font-medium">{item.precio_unitario.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-4 mt-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Venta:</span>
                  <span className="text-xl font-bold">${totalVenta.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-2 justify-end">
              <Button
                color="danger"
                variant="light"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                color="success"
                onClick={procesarGuardado}
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Confirmar y Guardar'}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModalCierreProceso;
