'use client'
import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Card, CardHeader, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Proceso } from '@/types/ventas';
import Notification from '@/components/notification';
import { authFetch } from '@/lib/api/fetchWithAuth';

interface TableProcesosProps {
  procesosFiltrados: Proceso[];
  loading: boolean;
  onSelectProceso: (proceso: Proceso | null) => void;
  onEditarProceso?: (proceso: Proceso) => void;
  setModalAbierto: (isOpen: boolean) => void;
  onProcesosActualizados?: () => void;
}

const TableProcesos = ({
  procesosFiltrados,
  loading,
  onSelectProceso,
  onEditarProceso,
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
      const response = await authFetch(
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

  const procesosOrdenados = procesosFiltrados
    .filter(proceso => proceso !== null)
    .sort((a, b) => {
      if (a.estado_cuenta === 'pendiente' && b.estado_cuenta !== 'pendiente') return -1;
      if (a.estado_cuenta !== 'pendiente' && b.estado_cuenta === 'pendiente') return 1;
      const fechaA = new Date(a.fecha_descarga).getTime();
      const fechaB = new Date(b.fecha_descarga).getTime();
      return fechaB - fechaA;
    });

  const unidadesVendidas = (proceso: Proceso) =>
    proceso.productos_detalle?.reduce((total, prod) => total + prod.cantidad_vendida, 0) || 0;

  const abrirDetalle = (proceso: Proceso) => {
    onSelectProceso(proceso);
    setModalAbierto(true);
  };

  const pedirBorrado = (proceso: Proceso) => {
    setProcesoAEliminar(proceso.id.toString());
    setModalConfirmar(true);
  };

  return (
    <>
    <Card className="p-2 w-full sm:p-4">
      <CardHeader className="flex justify-between items-center px-2 pb-2 sm:px-3">
        <h4 className="text-lg font-semibold">Descargas de Repartidores</h4>
      </CardHeader>
      <CardBody className="px-2 sm:px-3">
        <div className="space-y-3 md:hidden">
          {loading && (
            <p className="py-8 text-sm text-center text-gray-500">Cargando datos...</p>
          )}
          {!loading && procesosOrdenados.length === 0 && (
            <p className="py-8 text-sm text-center text-gray-500">No hay datos disponibles para el período seleccionado.</p>
          )}
          {procesosOrdenados.map((proceso) => {
            const cerrado = proceso.estado_cuenta === 'finalizado';
            const pendiente = proceso.estado_cuenta === 'pendiente';
            return (
              <article
                key={proceso.id}
                className={`rounded-xl border p-3 ${cerrado ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex gap-2 justify-between items-start">
                  <div className="min-w-0">
                    <p className={`font-semibold ${cerrado ? 'text-gray-500' : 'text-gray-900'}`}>#{proceso.id}</p>
                    <p className="text-sm text-gray-500 truncate">{proceso.repartidor.nombre}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    cerrado ? 'bg-gray-200 text-gray-600' : pendiente ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cerrado ? 'Cerrado' : pendiente ? 'Pendiente' : 'Sin estado'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <p className="text-green-700">
                    <span className="block text-xs text-gray-500">Carga</span>
                    {formatearFecha(proceso.fecha_carga)} {formatearHora(proceso.fecha_carga)}
                  </p>
                  <p className="text-red-700">
                    <span className="block text-xs text-gray-500">Descarga</span>
                    {formatearFecha(proceso.fecha_descarga)} {formatearHora(proceso.fecha_descarga)}
                  </p>
                  <p className={cerrado ? 'text-gray-500' : 'text-gray-800'}>
                    <span className="block text-xs text-gray-500">Vendidos</span>
                    {unidadesVendidas(proceso)} unidades
                  </p>
                  <p className={`font-bold ${cerrado ? 'text-gray-500' : 'text-gray-900'}`}>
                    <span className="block text-xs font-normal text-gray-500">Total</span>
                    {formatearMonto(proceso.totales.monto_total?.toString())}
                  </p>
                </div>
                <div className={`grid gap-2 mt-3 ${onEditarProceso ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <Button size="sm" color="primary" className="w-full" onClick={() => abrirDetalle(proceso)}>
                    Detalle
                  </Button>
                  {onEditarProceso && (
                    <Button size="sm" variant="flat" color="warning" className="w-full" onClick={() => onEditarProceso(proceso)}>
                      Editar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    color="danger"
                    className="w-full"
                    onClick={() => pedirBorrado(proceso)}
                    isLoading={borrandoId === proceso.id.toString()}
                  >
                    Borrar
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden table-scroll md:block">
          <div className="min-w-[860px]">
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
                {procesosOrdenados.map((proceso) => (
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
                      <span className="font-medium text-green-600">
                        Carga: {formatearFecha(proceso.fecha_carga)}
                        <span className="ml-1 text-xs">{formatearHora(proceso.fecha_carga)}</span>
                      </span>
                      <span className="font-medium text-red-600">
                        Descarga: {formatearFecha(proceso.fecha_descarga)}
                        <span className="ml-1 text-xs">{formatearHora(proceso.fecha_descarga)}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${proceso.estado_cuenta === 'finalizado' ? 'text-gray-500' : ''}`}>
                      {unidadesVendidas(proceso)} unidades
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-bold ${proceso.estado_cuenta === 'finalizado' ? 'text-gray-500' : ''}`}>
                      {formatearMonto(proceso.totales.monto_total?.toString())}
                    </span>
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
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        color="primary"
                        onClick={() => abrirDetalle(proceso)}
                        className={proceso.estado_cuenta === 'finalizado' ? 'opacity-50' : ''}
                      >
                        Ver Detalle
                      </Button>
                      {onEditarProceso && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          onClick={() => onEditarProceso(proceso)}
                        >
                          Editar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        color="danger"
                        onClick={() => pedirBorrado(proceso)}
                        isLoading={borrandoId === proceso.id.toString()}
                      >
                        {borrandoId === proceso.id.toString() ? 'Borrando...' : 'Borrar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
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