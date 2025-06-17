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

  const calcularTotalVentaPorProductos = (venta: VentaCerrada): number => {
    if (!venta.productos_detalle || !Array.isArray(venta.productos_detalle)) return 0;
    // Calculamos el total sumando los subtotales de cada producto
    // Cada subtotal ya está calculado como precio_unitario * cantidad_vendida
    return venta.productos_detalle.reduce((sum, prod) => {
      const subtotal = Number(prod.subtotal) || 0;
      return sum + subtotal;
    }, 0);
  };

  useEffect(() => {
    const ventasFiltradas = ventasCerradas
      .filter(venta => {
        const fechaVenta = venta.fecha_carga ? new Date(venta.fecha_carga) : new Date(venta.fecha_cierre);
        // Ajustar las fechas de inicio y fin para incluir el día completo
        const fechaInicio = filtros.fechaInicio ? new Date(filtros.fechaInicio) : null;
        const fechaFin = filtros.fechaFin ? new Date(filtros.fechaFin) : null;
        
        if (fechaFin) {
          fechaFin.setHours(23, 59, 59, 999); // Establecer al final del día
        }
        if (fechaInicio) {
          fechaInicio.setHours(0, 0, 0, 0); // Establecer al inicio del día
        }

        const cumpleFechaInicio = !fechaInicio || fechaVenta >= fechaInicio;
        const cumpleFechaFin = !fechaFin || fechaVenta <= fechaFin;
        const cumpleEstadoBalance = 
          filtros.estadoBalance === 'todos' ||
          (filtros.estadoBalance === 'alDia' && parseNumber(venta.balance_fiado) >= 0) ||
          (filtros.estadoBalance === 'conDeuda' && parseNumber(venta.balance_fiado) < 0);

        return cumpleFechaInicio && cumpleFechaFin && cumpleEstadoBalance;
      })
      .sort((a, b) => {
        if (a.grupo_cierre === b.grupo_cierre) {
          return new Date(a.fecha_cierre).getTime() - new Date(b.fecha_cierre).getTime();
        }
        if (!a.grupo_cierre) return 1;
        if (!b.grupo_cierre) return -1;
        return a.grupo_cierre.localeCompare(b.grupo_cierre);
      });

    setVentasFiltradas(ventasFiltradas);

    setTotales({
      ventasTotal: ventasFiltradas.reduce((sum, venta) => sum + parseNumber(venta.total_venta), 0),
      balanceTotal: ventasFiltradas
        .filter(venta => venta.estado !== 'Finalizado')
        .reduce((sum, venta) => {
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
      // Obtener la última venta seleccionada o deseleccionada
      const currentKeys = Array.from(selectedKeys).map(String);
      const newKeys = Array.from(selection).map(String);
      
      // Encontrar qué ID cambió (fue añadido o removido)
      const changedId = currentKeys.length > newKeys.length 
        ? currentKeys.find(id => !newKeys.includes(id)) 
        : newKeys.find(id => !currentKeys.includes(id));
      
      if (changedId) {
        const venta = ventasFiltradas.find(v => v.id.toString() === changedId);
        if (venta?.grupo_cierre) {
          // Si la venta pertenece a un grupo
          const ventasDelMismoGrupo = ventasFiltradas
            .filter(v => v.grupo_cierre === venta.grupo_cierre)
            .map(v => v.id.toString());
          
          if (currentKeys.length > newKeys.length) {
            // Si estamos deseleccionando, quitamos todo el grupo
            setSelectedKeys(new Set(Array.from(selectedKeys)
              .filter(id => !ventasDelMismoGrupo.includes(id))));
          } else {
            // Si estamos seleccionando, añadimos todo el grupo
            setSelectedKeys(new Set([...Array.from(selectedKeys), ...ventasDelMismoGrupo]));
          }
        } else {
          // Si no pertenece a un grupo, mantener la selección normal
          setSelectedKeys(selection as Set<string>);
        }
      } else {
        setSelectedKeys(selection as Set<string>);
      }
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
      
      const promises = ventasSeleccionadas.map(venta => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/ventas-cerradas/${venta.id}/finalizar`;
        
        return fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        }).then(async response => {
          const data = await response.json();
          return data;
        });
      });

      const resultados = await Promise.all(promises);
      
      // Verificar si todas las peticiones fueron exitosas
      const todasExitosas = resultados.every(result => result.success);
      if (todasExitosas) {
        setSelectedKeys(new Set()); // Limpiar selección
        // Aquí podrías actualizar la lista de ventas o emitir un evento para recargar los datos
      }
    } catch (error) {
      // console.error('Error al finalizar las rendiciones:', error);
    }
  };

  // Función para obtener las ventas seleccionadas
  const getVentasSeleccionadas = () => {
    const ventas = ventasFiltradas.filter(venta => 
      selectedKeys.has(venta.id.toString())
    );
    return ventas;
  };

  // Función para determinar si una venta es la primera o última de su grupo
  const getVentaGroupStyle = (venta: VentaCerrada, index: number, ventas: VentaCerrada[]) => {
    if (!venta.grupo_cierre) return '';

    const prevVenta = index > 0 ? ventas[index - 1] : null;
    const nextVenta = index < ventas.length - 1 ? ventas[index + 1] : null;

    const isFirstInGroup = !prevVenta || prevVenta.grupo_cierre !== venta.grupo_cierre;
    const isLastInGroup = !nextVenta || nextVenta.grupo_cierre !== venta.grupo_cierre;

    const classes = ['relative', 'border-l-2', 'border-r-2', 'border-green-500/30', 'bg-green-50/30'];

    if (isFirstInGroup) {
      classes.push('border-t-2', 'rounded-t-[15px]');
    }
    if (isLastInGroup) {
      classes.push('border-b-2', 'rounded-b-[15px]');
    }

    return classes.join(' ');
  };

  const handleRowClick = (venta: VentaCerrada) => {
    if (venta.grupo_cierre && venta.estado === 'Finalizado') {
      const ventasDelMismoGrupo = ventasFiltradas.filter(v => 
        v.grupo_cierre === venta.grupo_cierre
      );
      setSelectedKeys(new Set(ventasDelMismoGrupo.map(v => v.id.toString())));
      setIsModalOpen(true);
    }
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
              .filter(venta => venta.estado === 'Finalizado' && (!venta.grupo_cierre || venta.grupo_cierre === ''))
              .map(venta => venta.id.toString()))}
            classNames={{
              base: "min-w-full",
              th: "bg-default-100",
              td: "cursor-pointer",
              tr: "transition-colors hover:bg-gray-50"
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
              {(venta) => {
                const index = ventasFiltradas.indexOf(venta);
                return (
                  <TableRow 
                    key={venta.id.toString()}
                    className={getVentaGroupStyle(venta, index, ventasFiltradas)}
                    onClick={() => handleRowClick(venta)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">#{venta.proceso_id}</span>
                        {venta.grupo_cierre && (
                          <div className="flex gap-1 items-center text-xs text-gray-500">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Grupo {new Date(venta.grupo_cierre).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {venta.fecha_carga ? (
                          <span className="font-medium text-green-600">
                            Carga: {new Date(venta.fecha_carga).toLocaleDateString()} <span className="ml-1 text-xs">{new Date(venta.fecha_carga).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        ) : null}
                        <span className="font-medium text-red-600">
                          Descarga: {new Date(venta.fecha_cierre).toLocaleDateString()} <span className="ml-1 text-xs">{new Date(venta.fecha_cierre).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{venta.repartidor.nombre}</TableCell>
                    <TableCell>
                      ${calcularTotalVentaPorProductos(venta).toFixed(2)}
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
                        isIconOnly
                        onClick={(e) => {
                          e.stopPropagation();
                          // Aquí deberías llamar a la función para ver el PDF
                          // Por ejemplo: verPDF(venta)
                        }}
                        title="Ver PDF"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v2.25A2.25 2.25 0 0 1 17.25 18.75H6.75A2.25 2.25 0 0 1 4.5 16.5V7.5A2.25 2.25 0 0 1 6.75 5.25h2.25m3-1.5 6 6m0 0H15a.75.75 0 0 1-.75-.75V3.75m6 6v7.5A2.25 2.25 0 0 1 17.25 18.75H6.75A2.25 2.25 0 0 1 4.5 16.5V7.5A2.25 2.25 0 0 1 6.75 5.25h2.25" />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }}
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
