import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Checkbox, Alert } from "@heroui/react";
import { Proceso } from '@/types/ventas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

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
    if (!proceso?.productos_detalle) return 0;
    return proceso.totales.monto_total || 0;
  };

  // Calcular valores
  const totalVenta = calcularTotalVenta();
  const totalRecaudado = montoEfectivoRecaudado + montoTransferencia;
  const balanceFiado = totalRecaudado - totalVenta;

  const handleGuardarProceso = async () => {
    if (!proceso?.id || !proceso.repartidor?.id) {
      console.error('Faltan datos del proceso o repartidor');
      return;
    }

    setIsLoading(true);
    try {
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
      setTimeout(() => {
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
                <TableColumn>Precio Unit.</TableColumn>
                <TableColumn>Subtotal</TableColumn>
              </TableHeader>
              <TableBody>
                {proceso?.productos_detalle?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.cantidad_vendida}</TableCell>
                    <TableCell>${item.precio_unitario.toFixed(2)}</TableCell>
                    <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                )) || []}
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
                            value={montoEfectivoRecaudado ? formatearNumero(montoEfectivoRecaudado) : '0'}
                            onChange={(e) => {
                              if (proceso?.estado_cuenta !== 'finalizado') {
                                const valorLimpio = limpiarFormato(e.target.value);
                                setMontoEfectivoRecaudado(valorLimpio);
                              }
                            }}
                            className={`p-2 w-full text-right rounded border ${
                              proceso?.estado_cuenta === 'finalizado' ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            readOnly={proceso?.estado_cuenta === 'finalizado'}
                          />
                        </div>
                        <div className="flex gap-2 items-center w-32">
                          <span>$</span>
                          <input
                            type="text"
                            value={montoTransferencia ? formatearNumero(montoTransferencia) : '0'}
                            onChange={(e) => {
                              if (proceso?.estado_cuenta !== 'finalizado') {
                                const valorLimpio = limpiarFormato(e.target.value);
                                setMontoTransferencia(valorLimpio);
                              }
                            }}
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
  );
};

export default ModalCierreProceso;
