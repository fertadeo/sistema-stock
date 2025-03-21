'use client'
import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Card, CardHeader, CardBody, Checkbox } from "@heroui/react";
import { Proceso } from '@/types/ventas';

interface TableProcesosProps {
  procesosFiltrados: Proceso[];
  loading: boolean;
  onSelectProceso: (proceso: Proceso | null) => void;
  setModalAbierto: (isOpen: boolean) => void;
}

const TableProcesos = ({ procesosFiltrados, loading, onSelectProceso, setModalAbierto }: TableProcesosProps) => {
  const [procesosSeleccionados, setProcesosSeleccionados] = useState<number[]>([]);

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

  // Función para manejar la selección de todos los procesos
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setProcesosSeleccionados(procesosFiltrados.map(proceso => proceso.id));
    } else {
      setProcesosSeleccionados([]);
    }
  };

  // Función para manejar la selección individual
  const handleSelectProceso = (id: number, checked: boolean) => {
    if (checked) {
      setProcesosSeleccionados([...procesosSeleccionados, id]);
    } else {
      setProcesosSeleccionados(procesosSeleccionados.filter(pid => pid !== id));
    }
  };

  // Función para cerrar los procesos seleccionados
  const cerrarProcesosSeleccionados = () => { 
    // Aquí implementaremos la lógica para cerrar los procesos
    console.log('Procesos a cerrar:', procesosSeleccionados);
  };

  return (
    <Card className="p-4 w-full">
      <CardHeader className="flex justify-between items-center pb-2">
        <h4 className="text-lg font-semibold">Ventas de Repartidores</h4>
        {procesosSeleccionados.length > 0 && (
          <Button 
            color="success"
            onClick={cerrarProcesosSeleccionados}
            className="text-white bg-green-600"
          >
            Cerrar {procesosSeleccionados.length} Procesos Seleccionados
          </Button>
        )}
      </CardHeader>
      <CardBody>
        <Table 
          aria-label="Tabla de Procesos"
        >
          <TableHeader>
            <TableColumn>
              <Checkbox
                aria-label="Seleccionar todos los procesos"
                isSelected={procesosSeleccionados.length === procesosFiltrados.length}
                isIndeterminate={procesosSeleccionados.length > 0 && procesosSeleccionados.length < procesosFiltrados.length}
                onValueChange={handleSelectAll}
              />
            </TableColumn>
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
            {procesosFiltrados.filter(proceso => proceso !== null).map((proceso) => (
              <TableRow key={proceso.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    aria-label={`Seleccionar proceso ${proceso.id}`}
                    isSelected={procesosSeleccionados.includes(proceso.id)}
                    onValueChange={(checked) => handleSelectProceso(proceso.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">#{proceso.id}</span>
                    <span className="text-xs text-gray-500">{proceso.repartidor.nombre}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{formatearFecha(proceso.fecha_descarga)}</span>
                    <span className="text-sm text-gray-500">
                      {formatearHora(proceso.fecha_descarga)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{proceso.productos_vendidos || 0} unidades</span>
                    {proceso.productos_devueltos ? (
                      <span className={`text-xs ${proceso.productos_devueltos.length === 0 ? 'text-gray-500' : 'text-green-600'}`}>
                        {proceso.productos_devueltos.reduce((total, prod) => total + prod.cantidad, 0)} u. llenas devueltas
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">0 u. llenas devueltas</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">
                      {formatearMonto(proceso.precio_total_venta?.toString())}
                    </span>
                    {proceso.ganancia_repartidor && (
                      <span className="text-xs text-gray-500">
                        Rep: {formatearMonto(proceso.ganancia_repartidor)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`flex gap-2 items-center ${
                    proceso.estado_cuenta === 'finalizado' ? 'text-green-600' : 
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
                  >
                    Ver Detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default TableProcesos; 