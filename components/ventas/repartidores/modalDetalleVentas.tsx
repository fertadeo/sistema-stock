import React, { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Alert, Pagination } from "@heroui/react";
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
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

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

  // Calcular las ventas a mostrar en la página actual
  const ventasPaginadas = ventasSeleccionadas.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Utilidad para formatear montos
  const formatMonto = (valor: number) => {
    return valor.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

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
        size="4xl"
        classNames={{
          wrapper: "mt-1",
          base: "max-h-[90vh] overflow-y-auto",
          body: "min-h-[800px]"
        }}
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
                    <p className="text-xl font-bold">${formatMonto(totales.totalVenta)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Efectivo</p>
                    <p className="text-xl font-bold">${formatMonto(totales.totalEfectivo)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Transf.</p>
                    <p className="text-xl font-bold">${formatMonto(totales.totalTransferencia)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Balance Total</p>
                    <p className={`text-xl font-bold ${totales.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>${formatMonto(totales.totalBalance)}</p>
                  </div>
                </div>

                {/* Tabla de detalle */}
                <div className="h-[270px] overflow-y-auto">
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
                      {ventasPaginadas.map((venta) => (
                        <TableRow key={venta.id}>
                          <TableCell>#{venta.proceso_id}</TableCell>
                          <TableCell>{new Date(venta.fecha_cierre).toLocaleDateString()}</TableCell>
                          <TableCell>{venta.repartidor.nombre}</TableCell>
                          <TableCell>${formatMonto(Number(venta.total_venta))}</TableCell>
                          <TableCell>${formatMonto(Number(venta.monto_efectivo))}</TableCell>
                          <TableCell>${formatMonto(Number(venta.monto_transferencia))}</TableCell>
                          <TableCell>
                            <span className={Number(venta.balance_fiado) >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${formatMonto(Number(venta.balance_fiado))}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {ventasSeleccionadas.length > rowsPerPage && (
                  <div className="flex justify-center mt-4">
                    <Pagination
                      total={Math.ceil(ventasSeleccionadas.length / rowsPerPage)}
                      page={page}
                      onChange={setPage}
                    />
                  </div>
                )}

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
                        <p className="text-sm text-gray-500">Ganancia bruta: ${formatMonto(ganancias.gananciaOriginal)}</p>
                        <p className="text-sm text-gray-500">Descuento por balance: -${formatMonto(ganancias.descuentoBalance)}</p>
                        <p className="text-xl font-bold text-green-600">
                          Ganancia final:&nbsp;&nbsp;${formatMonto(ganancias.gananciaRepartidor)}
                        </p>  
                      </div>
                    </div>
                    <div className="flex flex-col justify-between p-4 h-full bg-gray-50 rounded-lg ganancia-fabrica">
                      <p className="text-sm font-bold text-gray-600">Ganancia Fábrica</p>
                      <p className="mt-auto text-xl font-bold text-blue-600">
                        ${formatMonto(ganancias.gananciaFabrica)}
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
              <div>
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
              </div>
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