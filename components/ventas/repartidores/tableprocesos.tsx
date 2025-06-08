'use client'
import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Card, CardHeader, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Proceso } from '@/types/ventas';
import Notification from '@/components/notification';

interface TableProcesosProps {
  procesosFiltrados: Proceso[];
  loading: boolean;
  onSelectProceso: (proceso: Proceso | null) => void;
  setModalAbierto: (isOpen: boolean) => void;
  onProcesosActualizados?: () => void;
}

const TableProcesos = ({
  procesosFiltrados,
  loading,
  onSelectProceso,
  setModalAbierto,
  onProcesosActualizados
}: TableProcesosProps) => {
  const [borrandoId, setBorrandoId] = useState<string | null>(null);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [procesoAEliminar, setProcesoAEliminar] = useState<string | null>(null);

  // Estado para la notificación
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    description: '',
    type: 'success' as 'success' | 'error'
  });

  const handleBorrarProceso = async () => {
    if (!procesoAEliminar) return;
    setBorrandoId(procesoAEliminar);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/descargas/${procesoAEliminar}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al borrar el proceso');

      // Refresca la tabla inmediatamente
      if (onProcesosActualizados) onProcesosActualizados();

      // Muestra la notificación de éxito
      setNotification({
        isVisible: true,
        message: 'Proceso eliminado',
        description: 'El proceso fue borrado correctamente.',
        type: 'success'
      });
    } catch (error) {
      alert('Error al borrar el proceso');
    } finally {
      setBorrandoId(null);
      setModalConfirmar(false);
      setProcesoAEliminar(null);
    }
  };

  // Función para formatear la fecha a DD/MM/AAAA
  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'Sin fecha';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatearHora = (fecha: string | null) => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const formatearMonto = (monto: string | null) => {
    if (!monto) return '$0.00';
    try {
      const numero = parseFloat(monto);
      if (isNaN(numero)) return '$0.00';
      return `$${numero.toFixed(2)}`;
    } catch (error) {
      return '$0.00';
    }
  };

  return (
    <>
    <Card className="p-4 w-full">
      <CardHeader className="flex justify-between items-center pb-2">
        <h4 className="text-lg font-semibold">Descargas de Repartidores</h4>
      </CardHeader>
      <CardBody>
          <Table aria-label="Tabla de Procesos">
          <TableHeader>
            <TableColumn>ID Descarga</TableColumn>
            <TableColumn>Fecha</TableColumn>
            <TableColumn>Productos Vendidos</TableColumn>
            <TableColumn>Total Venta</TableColumn>
            <TableColumn>Estado</TableColumn>
            <TableColumn>Acciones</TableColumn>
          </TableHeader>
          <TableBody 
            emptyContent={loading ? "Cargando datos..." : "No hay datos disponibles para el período seleccionado."}
            isLoading={loading}
          >
              {procesosFiltrados
                .filter(proceso => proceso !== null)
                .sort((a, b) => {
                  // Primero los pendientes
                  if (a.estado_cuenta === 'pendiente' && b.estado_cuenta !== 'pendiente') return -1;
                  if (a.estado_cuenta !== 'pendiente' && b.estado_cuenta === 'pendiente') return 1;
                  // Luego por fecha de descarga descendente (más nuevo arriba)
                  const fechaA = new Date(a.fecha_descarga).getTime();
                  const fechaB = new Date(b.fecha_descarga).getTime();
                  return fechaB - fechaA;
                })
                .map((proceso) => (
              <TableRow 
                key={proceso.id} 
                className={`hover:bg-gray-50 ${proceso.estado_cuenta === 'finalizado' ? 'opacity-50 bg-gray-100' : ''}`}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className={`font-medium ${proceso.estado_cuenta === 'finalizado' ? 'text-gray-500' : ''}`}>
                      #{proceso.id}
                    </span>
                    <span className={`text-xs ${proceso.estado_cuenta === 'finalizado' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {proceso.repartidor.nombre}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={`font-medium text-green-600`}>
                      Carga: {formatearFecha(proceso.fecha_carga)}
                      <span className="ml-1 text-xs">{formatearHora(proceso.fecha_carga)}</span>
                    </span>
                    <span className={`font-medium text-red-600`}>
                      Descarga: {formatearFecha(proceso.fecha_descarga)}
                      <span className="ml-1 text-xs">{formatearHora(proceso.fecha_descarga)}</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={`font-medium ${proceso.estado_cuenta === 'finalizado' ? 'text-gray-500' : ''}`}>
                      {proceso.productos_detalle?.reduce((total, prod) => total + prod.cantidad_vendida, 0) || 0} unidades
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={`font-bold ${proceso.estado_cuenta === 'finalizado' ? 'text-gray-500' : ''}`}>
                      {formatearMonto(proceso.totales.monto_total?.toString())}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`flex gap-2 items-center ${
                    proceso.estado_cuenta === 'finalizado' ? 'text-gray-500' : 
                    proceso.estado_cuenta === 'pendiente' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {proceso.estado_cuenta === 'finalizado' && <span className="text-xl">✓</span>}
                    <span className="font-medium">
                      {proceso.estado_cuenta === 'finalizado' ? 'Cerrado' : 
                       proceso.estado_cuenta === 'pendiente' ? 'Pendiente' : 'Sin estado'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    color="primary"
                    onClick={() => {
                      onSelectProceso(proceso);
                      setModalAbierto(true);
                    }}
                    className={proceso.estado_cuenta === 'finalizado' ? 'opacity-50' : ''}
                  >
                    Ver Detalle
                  </Button>
                      <Button
                        size="sm"
                        color="danger"
                        className="ml-2"
                        onClick={() => {
                          setProcesoAEliminar(proceso.id.toString());
                          setModalConfirmar(true);
                        }}
                        isLoading={borrandoId === proceso.id.toString()}
                      >
                        {borrandoId === proceso.id.toString() ? 'Borrando...' : 'Borrar'}
                      </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>

      {/* Modal de confirmación */}
      <Modal isOpen={modalConfirmar} onClose={() => setModalConfirmar(false)}>
        <ModalContent>
          <ModalHeader>
            Confirmar eliminación
          </ModalHeader>
          <ModalBody>
            ¿Está seguro/a de borrar este proceso? <br />
            <span className="font-semibold text-red-600">
              Los datos que sean eliminados se perderán.
            </span>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={handleBorrarProceso} isLoading={!!borrandoId}>
              Sí, borrar
            </Button>
            <Button color="primary" variant="light" onClick={() => setModalConfirmar(false)} disabled={!!borrandoId}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Notificación */}
      <Notification
        message={notification.message}
        description={notification.description}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        type={notification.type}
      />
    </>
  );
};

export default TableProcesos; 