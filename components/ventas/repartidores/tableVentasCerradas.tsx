import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Card, CardHeader, CardBody, Input, Select, SelectItem, Button, Checkbox, Selection } from "@heroui/react";
import ModalDetalleVentas from './modalDetalleVentas';
import { VentaCerrada } from '@/types/ventas';

interface TableVentasCerradasProps {
  repartidorId: string;
  ventasCerradas: VentaCerrada[];
  loading: boolean;
  onVentasActualizadas?: () => void;
}

// Función auxiliar para obtener el primer y último día del mes actual
const obtenerFechasMesActual = () => {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString().split('T')[0];
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    .toISOString().split('T')[0];
  return { primerDia, ultimoDia };
};

const TableVentasCerradas: React.FC<TableVentasCerradasProps> = ({ 
  repartidorId,
  ventasCerradas,
  loading,
  onVentasActualizadas
}) => {
  const { primerDia, ultimoDia } = obtenerFechasMesActual();
  
  const [filtros, setFiltros] = useState({
    fechaInicio: primerDia,
    fechaFin: ultimoDia,
    estadoBalance: 'todos',
    estadoRendicion: 'pendiente'
  });
  const [ventasFiltradas, setVentasFiltradas] = useState<VentaCerrada[]>([]);
  const [totales, setTotales] = useState({
    ventasTotal: 0,
    balanceTotal: 0,
    cantidadVentas: 0
  });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función auxiliar para convertir a número
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') {
      const cleanedValue = value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleanedValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === 'number' ? value : 0;
  };

  // Función para calcular el balance
  const calcularBalance = (venta: VentaCerrada): number => {
    const totalVenta = parseNumber(venta.total_venta);
    const montoEfectivo = parseNumber(venta.monto_efectivo);
    const montoTransferencia = parseNumber(venta.monto_transferencia);
    const totalRecaudado = montoEfectivo + montoTransferencia;
    return totalRecaudado - totalVenta;
  };

  useEffect(() => {
    const ventasFiltradas = ventasCerradas.filter(venta => {
      const fechaVenta = new Date(venta.fecha_cierre);
      const cumpleFechaInicio = !filtros.fechaInicio || fechaVenta >= new Date(filtros.fechaInicio);
      const cumpleFechaFin = !filtros.fechaFin || fechaVenta <= new Date(filtros.fechaFin);
      const cumpleEstadoBalance = 
        filtros.estadoBalance === 'todos' ||
        (filtros.estadoBalance === 'alDia' && parseNumber(venta.balance_fiado) >= 0) ||
        (filtros.estadoBalance === 'conDeuda' && parseNumber(venta.balance_fiado) < 0);

      return cumpleFechaInicio && cumpleFechaFin && cumpleEstadoBalance;
    });

    setVentasFiltradas(ventasFiltradas);

    // Calcular totales asegurando que trabajamos con números
    setTotales({
      ventasTotal: ventasFiltradas.reduce((sum, venta) => sum + parseNumber(venta.total_venta), 0),
      balanceTotal: ventasFiltradas.reduce((sum, venta) => {
        const totalVenta = parseNumber(venta.total_venta);
        const montoEfectivo = parseNumber(venta.monto_efectivo);
        const montoTransferencia = parseNumber(venta.monto_transferencia);
        const totalRecaudado = montoEfectivo + montoTransferencia;
        return sum + (totalRecaudado - totalVenta);
      }, 0),
      cantidadVentas: ventasFiltradas.length
    });
  }, [ventasCerradas, filtros]);

  const handleSelectionChange = (selection: Selection) => {
    if (selection === "all") {
      const pendientesIds = ventasFiltradas
        .filter(venta => venta.estado === 'Pendiente')
        .map(venta => venta.id.toString());
      setSelectedKeys(new Set(pendientesIds));
    } else if (selection instanceof Set) {
      setSelectedKeys(selection as Set<string>);
    } else {
      setSelectedKeys(new Set());
    }
  };

  const getSelectedCount = () => {
    return selectedKeys instanceof Set ? selectedKeys.size : 0;
  };

  const handleFinalizarSeleccionados = async () => {
    try {
      const ventasSeleccionadas = getVentasSeleccionadas();
      console.log('Ventas seleccionadas para finalizar:', ventasSeleccionadas);
      
      const promises = ventasSeleccionadas.map(venta => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/ventas-cerradas/${venta.id}/finalizar`;
        console.log('Enviando petición a:', url);
        
        return fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        }).then(async response => {
          const data = await response.json();
          console.log(`Respuesta para venta ${venta.id}:`, data);
          return data;
        });
      });

      const resultados = await Promise.all(promises);
      console.log('Resultados de todas las peticiones:', resultados);
      
      // Verificar si todas las peticiones fueron exitosas
      const todasExitosas = resultados.every(result => result.success);
      if (todasExitosas) {
        setSelectedKeys(new Set()); // Limpiar selección
        // Aquí podrías actualizar la lista de ventas o emitir un evento para recargar los datos
      } else {
        console.error('Algunas peticiones fallaron:', resultados.filter(result => !result.success));
      }
    } catch (error) {
      console.error('Error al finalizar las rendiciones:', error);
    }
  };

  // Función para obtener las ventas seleccionadas
  const getVentasSeleccionadas = () => {
    const ventas = ventasFiltradas.filter(venta => 
      selectedKeys.has(venta.id.toString())
    );
    console.log('Ventas filtradas:', ventasFiltradas.map(v => ({ id: v.id, estado: v.estado })));
    console.log('Keys seleccionadas:', selectedKeys);
    console.log('Ventas seleccionadas:', ventas.map(v => ({ id: v.id, estado: v.estado })));
    return ventas;
  };

  return (
    <Card className="p-4 w-full">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold">Ventas Cerradas</h4>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            type="date"
            label="Fecha Inicio"
            value={filtros.fechaInicio}
            onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
          />
          <Input
            type="date"
            label="Fecha Fin"
            value={filtros.fechaFin}
            onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
          />
          <Select
            label="Estado Balance/Fiado"
            value={filtros.estadoBalance}
            onChange={(e) => setFiltros({...filtros, estadoBalance: e.target.value})}
          >
            <SelectItem key="todos" value="todos">Todos</SelectItem>
            <SelectItem key="alDia" value="alDia">Positivo</SelectItem>
            <SelectItem key="conDeuda" value="conDeuda">Negativo</SelectItem>
          </Select>
          <Select
            label="Estado Rendición"
            value={filtros.estadoRendicion}
            onChange={(e) => setFiltros({...filtros, estadoRendicion: e.target.value})}
          >
            <SelectItem key="todos" value="todos">Todos</SelectItem>
            <SelectItem key="pendiente" value="pendiente">Rendición Pendiente</SelectItem>
            <SelectItem key="finalizado" value="finalizado">Finalizado</SelectItem>
          </Select>
        </div>

        {/* Resumen de totales */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3"> 
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Ventas</p>
            <p className="text-xl font-bold">${totales.ventasTotal.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Balance Total</p>
            <p className={`text-xl font-bold ${totales.balanceTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totales.balanceTotal.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Cantidad de Ventas</p>
            <p className="text-xl font-bold">{totales.cantidadVentas}</p>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        {ventasFiltradas.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No hay ventas por administrar en caja
          </div>
        ) : (
          <Table 
            aria-label="Tabla de Ventas Cerradas"
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
            disabledKeys={new Set(ventasFiltradas
              .filter(venta => (venta as any).estado === 'Finalizado')
              .map(venta => venta.id.toString()))}
            classNames={{
              base: "min-w-full",
              th: "bg-default-100",
              td: "cursor-pointer",
              tr: "transition-colors hover:bg-gray-50",
              tbody: "divide-y divide-gray-200"
            }}
          >
            <TableHeader>
              <TableColumn>ID Proceso</TableColumn>
              <TableColumn>Fecha</TableColumn>
              <TableColumn>Repartidor</TableColumn>
              <TableColumn>Total Venta</TableColumn>
              <TableColumn>Efectivo</TableColumn>
              <TableColumn>Transferencia</TableColumn>
              <TableColumn>Balance</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn>Acciones</TableColumn>
            </TableHeader>
            <TableBody 
              items={ventasFiltradas}
              emptyContent={"No hay ventas por administrar en caja"}
            >
              {(venta) => (
                <TableRow key={venta.id.toString()}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">#{venta.proceso_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(venta.fecha_cierre).toLocaleDateString()}</TableCell>
                  <TableCell>{venta.repartidor.nombre}</TableCell>
                  <TableCell>
                    ${parseNumber(venta.total_venta).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ${parseNumber(venta.monto_efectivo).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ${parseNumber(venta.monto_transferencia).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className={`${venta.estado === 'Finalizado' 
                      ? 'text-gray-500' 
                      : calcularBalance(venta) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${calcularBalance(venta).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      venta.estado === 'Finalizado' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {venta.estado}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onClick={() => {
                        setSelectedKeys(new Set([venta.id.toString()]));
                        setIsModalOpen(true);
                      }}
                    >
                      Ver Detalle
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-end mt-4">
          {getSelectedCount() > 0 && (
            <Button
              color="primary"
              onClick={() => setIsModalOpen(true)}
            >
              Ver Detalle ({getSelectedCount()})
            </Button>
          )}
        </div>
      </CardBody>

      {/* Modal de detalle */}
      <ModalDetalleVentas
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ventasSeleccionadas={getVentasSeleccionadas()}
        onVentasActualizadas={onVentasActualizadas}
      />
    </Card>
  );
};

export default TableVentasCerradas;
