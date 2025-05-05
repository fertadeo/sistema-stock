import React, { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Alert } from "@heroui/react";
import { VentaCerrada } from '@/types/ventas';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ModalDetalleVentasProps {
  isOpen: boolean;
  onClose: () => void;
  ventasSeleccionadas: VentaCerrada[];
  onVentasActualizadas?: () => void;
}

const ModalDetalleVentas: React.FC<ModalDetalleVentasProps> = ({
  isOpen,
  onClose,
  ventasSeleccionadas,
  onVentasActualizadas
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [observaciones, setObservaciones] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showFloatingAlert, setShowFloatingAlert] = useState<boolean>(false);
  const [showInput, setShowInput] = useState<boolean>(true);

  // Limpiar mensajes cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  // Ocultar el alert flotante después de 3 segundos
  useEffect(() => {
    if (showFloatingAlert) {
      const timer = setTimeout(() => {
        setShowFloatingAlert(false);
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showFloatingAlert]);

  // Verificar si todas las ventas están finalizadas
  const todasFinalizadas = ventasSeleccionadas.every(venta => venta.estado === 'Finalizado');

  // Agregar console.log para ver los datos
  console.log('Datos de ventas seleccionadas:', ventasSeleccionadas);

  // Función para calcular totales
  const calcularTotales = () => {
    return ventasSeleccionadas.reduce((acc, venta) => ({
      totalVenta: acc.totalVenta + Number(venta.total_venta),
      totalEfectivo: acc.totalEfectivo + Number(venta.monto_efectivo),
      totalTransferencia: acc.totalTransferencia + Number(venta.monto_transferencia),
      totalBalance: acc.totalBalance + Number(venta.balance_fiado)
    }), {
      totalVenta: 0,
      totalEfectivo: 0,
      totalTransferencia: 0,
      totalBalance: 0
    });
  };

  // Calcular ganancias
  const calcularGanancias = () => {
    const gananciaTotal = totales.totalVenta * (porcentajeGanancia / 100);
    const gananciaFabrica = totales.totalVenta - gananciaTotal;
    const gananciaRepartidorFinal = gananciaTotal - Math.abs(totales.totalBalance);
    return { 
      gananciaRepartidor: gananciaRepartidorFinal,
      gananciaFabrica,
      gananciaOriginal: gananciaTotal,
      descuentoBalance: Math.abs(totales.totalBalance)
    };
  };

  const totales = calcularTotales();
  const ganancias = calcularGanancias();

  const handleCerrarCaja = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ventas-cerradas/finalizar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: ventasSeleccionadas.map(venta => venta.id),
          comision_porcentaje: porcentajeGanancia,
          observaciones: observaciones || `Cierre de cuentas del ${new Date().toLocaleDateString()}`,
          grupo_cierre: new Date().toISOString() // Identificador único para el grupo
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess("Cierre de caja realizado con éxito");
        onClose();
        setShowFloatingAlert(true);
        if (onVentasActualizadas) {
          onVentasActualizadas();
        }
      } else {
        setError(data.message || 'Error al cerrar la caja');
        console.error('Error en la respuesta:', data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cerrar la caja';
      setError(errorMessage);
      console.error('Error al cerrar caja:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (!modalContentRef.current) return;

    try {
      setIsLoading(true);
      setShowInput(false);
      // Ocultar elementos específicos
      const footer = modalContentRef.current.querySelector('.modal-footer');
      const alertFinalizadas = modalContentRef.current.querySelector('.alert-finalizadas');
      const buttons = modalContentRef.current.querySelectorAll('button');
      
      if (footer) (footer as HTMLElement).style.display = 'none';
      if (alertFinalizadas) (alertFinalizadas as HTMLElement).style.display = 'none';
      buttons.forEach(button => {
        (button as HTMLElement).style.display = 'none';
      });

      const canvas = await html2canvas(modalContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`cierre-caja-${ventasSeleccionadas[0].proceso_id}.pdf`);

      // Restaurar la visibilidad
      if (footer) (footer as HTMLElement).style.display = '';
      if (alertFinalizadas) (alertFinalizadas as HTMLElement).style.display = '';
      buttons.forEach(button => {
        (button as HTMLElement).style.display = '';
      });
      setShowInput(true);
    } catch (error) {
      setError('Error al generar el PDF');
      console.error('Error al generar PDF:', error);
      setShowInput(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showFloatingAlert && success && (
        <div className="fixed top-4 right-4 z-[9999]">
          <Alert 
            color="success"
            className="shadow-lg"
          >
            {success}
          </Alert>
        </div>
      )}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
      >
        <ModalContent>
          <div ref={modalContentRef}>
            <ModalHeader className="flex flex-col gap-1">
              <h4 className="text-xl font-bold">Detalle de Ventas Seleccionadas</h4>
              <p className="text-sm text-gray-600">
                {ventasSeleccionadas.length} venta{ventasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{ventasSeleccionadas.length !== 1 ? 's' : ''}
              </p>
              {todasFinalizadas && (
                <div className="px-6">
                  <Alert 
                    color="warning"
                    className="mb-4 alert-finalizadas"
                  >
                    Estas ventas ya están finalizadas y no pueden modificarse
                  </Alert>
                </div>
              )}
            </ModalHeader>
            {error && (
              <div className="px-6">
                <Alert 
                  color="danger"
                  className="shadow-lg"
                >
                  {error}
                </Alert>
              </div>
            )}
            <ModalBody>
              <div className="space-y-6">
                {/* Resumen de totales */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Ventas</p>
                    <p className="text-xl font-bold">${totales.totalVenta.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Efectivo</p>
                    <p className="text-xl font-bold">${totales.totalEfectivo.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Transf.</p>
                    <p className="text-xl font-bold">${totales.totalTransferencia.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Balance Total</p>
                    <p className={`text-xl font-bold ${totales.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${totales.totalBalance.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Tabla de detalle */}
                <Table aria-label="Detalle de Ventas">
                  <TableHeader>
                    <TableColumn>ID Proceso</TableColumn>
                    <TableColumn>Fecha</TableColumn>
                    <TableColumn>Repartidor</TableColumn>
                    <TableColumn>Total Venta</TableColumn>
                    <TableColumn>Efectivo</TableColumn>
                    <TableColumn>Transferencia</TableColumn>
                    <TableColumn>Balance</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {ventasSeleccionadas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell>#{venta.proceso_id}</TableCell>
                        <TableCell>{new Date(venta.fecha_cierre).toLocaleDateString()}</TableCell>
                        <TableCell>{venta.repartidor.nombre}</TableCell>
                        <TableCell>${Number(venta.total_venta).toFixed(2)}</TableCell>
                        <TableCell>${Number(venta.monto_efectivo).toFixed(2)}</TableCell>
                        <TableCell>${Number(venta.monto_transferencia).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={Number(venta.balance_fiado) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${Number(venta.balance_fiado).toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Sección de ganancias */}
                <div className="mt-6 space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-64">
                      <label htmlFor="porcentajeGanancia" className="block mb-1 text-sm font-medium text-gray-700">
                        Porcentaje de Ganancia Repartidor
                      </label>
                      <div className="flex items-center">
                        <input
                          id="porcentajeGanancia"
                          type="number"
                          min="0"
                          max="100"
                          value={porcentajeGanancia}
                          onChange={(e) => setPorcentajeGanancia(Number(e.target.value))}
                          className={`block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 text-center ${
                            todasFinalizadas ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          disabled={todasFinalizadas}
                          style={{ display: showInput ? 'block' : 'none' }}
                        />
                        <span
                          style={{ display: showInput ? 'none' : 'inline-block', minWidth: 40, textAlign: 'center' }}
                        >
                          {porcentajeGanancia} %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-bold text-gray-600">Ganancia Repartidor:&nbsp;&nbsp;({porcentajeGanancia}%)</p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Ganancia bruta: ${ganancias.gananciaOriginal.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Descuento por balance: -${ganancias.descuentoBalance.toFixed(2)}</p>
                        <p className="text-xl font-bold text-green-600">
                          Ganancia final:&nbsp;&nbsp;${ganancias.gananciaRepartidor.toFixed(2)}
                        </p>  
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg ganancia-fabrica">
                      <p className="text-sm font-bold text-gray-600">Ganancia Fábrica</p>
                      <p className="text-xl font-bold text-blue-600">
                        ${ganancias.gananciaFabrica.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agregar campo de observaciones antes del footer */}
                <div className="mt-6">
                  <label htmlFor="observaciones" className="block mb-1 text-sm font-medium text-gray-700">
                    Observaciones
                  </label>
                  <textarea
                    id="observaciones"
                    rows={2}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      todasFinalizadas ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Ingrese observaciones sobre el cierre de caja"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    disabled={todasFinalizadas}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="flex justify-between items-center">
              {todasFinalizadas ? (
                <Button 
                  color="primary"
                  onClick={handleDescargarPDF}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Generando PDF...' : 'Descargar PDF'}
                </Button>
              ) : (
                <Button 
                  color="success"
                  className="text-white bg-green-600"
                  onClick={handleCerrarCaja}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Procesando...' : 'Cerrar Caja'}
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
            </ModalFooter>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModalDetalleVentas; 