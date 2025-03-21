import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Checkbox } from "@heroui/react";
import { Proceso } from '@/types/ventas';

interface ModalCierreProcesoProps {
  isOpen: boolean;
  onClose: () => void;
  proceso: Proceso | null;
  obtenerPrecioProducto: (producto_id: number) => number;
}

const ModalCierreProceso: React.FC<ModalCierreProcesoProps> = ({
  isOpen,
  onClose,
  proceso,
  obtenerPrecioProducto
}) => {
  const [comisionPorcentaje, setComisionPorcentaje] = useState<number>(20);
  const [recibioPagoTransferencia, setRecibioPagoTransferencia] = useState<boolean>(false);
  const [montoTransferencia, setMontoTransferencia] = useState<number>(0);

  // Función para calcular el total de la venta
  const calcularTotalVenta = () => {
    if (!proceso?.carga?.items) return 0;
    return proceso.precio_total_venta || 0;
  };

  // Calcular valores
  const totalVenta = calcularTotalVenta();
  const gananciaRepartidor = (totalVenta * comisionPorcentaje) / 100;
  const valorFabrica = totalVenta - gananciaRepartidor;
  const montoEfectivo = gananciaRepartidor - montoTransferencia;

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
          <div className="space-y-6">
            <Table aria-label="Detalle de Venta">
              <TableHeader>
                <TableColumn>Producto</TableColumn>
                <TableColumn>Cantidad</TableColumn>
                <TableColumn>Precio Unit.</TableColumn>
                <TableColumn>Subtotal</TableColumn>
              </TableHeader>
              <TableBody>
                {proceso?.carga?.items?.map((item, index) => {
                  const precioUnitario = item.producto.precioPublico;
                  const subtotal = item.cantidad * precioUnitario;
                  return (
                    <TableRow key={index}>
                      <TableCell>{item.producto.nombreProducto}</TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>${precioUnitario.toFixed(2)}</TableCell>
                      <TableCell>${subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                }) || []}
              </TableBody>
            </Table>

            {/* Resumen de la venta */}
            <div className="pt-4 space-y-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Venta:</span>
                <span className="text-xl font-bold">
                  ${totalVenta.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 space-y-4">
                <div className="flex gap-4 items-center">
                  <span className="font-medium">Comisión Repartidor:</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={comisionPorcentaje}
                      onChange={(e) => setComisionPorcentaje(Number(e.target.value))}
                      className="p-2 w-20 text-right rounded border"
                    />
                    <span>%</span>
                  </div>
                </div>

                {proceso?.carga?.items && (
                  <div className="space-y-4">
                    <div className="pt-2 space-y-2 border-t">
                      <div className="flex justify-between items-center text-blue-600">
                        <span className="font-medium">Valor Fábrica:</span>
                        <span className="font-bold">${valorFabrica.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-green-600">
                        <span className="font-medium">Ganancia Repartidor:</span>
                        <span className="font-bold">${gananciaRepartidor.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Nueva sección de pagos por transferencia */}
                    <div className="pt-4 space-y-4 border-t">
                      <h5 className="font-medium">Registro de Pagos</h5>
                      
                      <div className="flex gap-2 items-center">
                        <Checkbox
                          isSelected={recibioPagoTransferencia}
                          onValueChange={setRecibioPagoTransferencia}
                          aria-label="Recibió pago por transferencia"
                        >
                          ¿Recibió el repartidor pagos por transferencia?
                        </Checkbox>
                      </div>

                      {recibioPagoTransferencia && (
                        <div className="space-y-2">
                          <div className="flex gap-4 items-center">
                            <span className="font-medium">Total transferido:</span>
                            <div className="flex gap-2 items-center">
                              <span>$</span>
                              <input
                                type="number"
                                min="0"
                                max={gananciaRepartidor}
                                value={montoTransferencia}
                                onChange={(e) => setMontoTransferencia(Number(e.target.value))}
                                className="p-2 w-32 text-right rounded border"
                              />
                            </div>
                          </div>

                          <div className="p-4 mt-2 bg-gray-50 rounded-lg">
                            <p className="text-gray-700">
                              El repartidor <span className="font-medium">{proceso?.repartidor?.nombre}</span> debe pagar{' '}
                              <span className="font-bold text-primary">${montoEfectivo.toFixed(2)}</span> en efectivo
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            * Este documento sirve como comprobante de venta
          </div>
          <Button 
            color="primary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalCierreProceso;
