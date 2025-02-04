'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button } from "@heroui/react";
import * as Tooltip from '@radix-ui/react-tooltip';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Agregar la función cx si no la tienes en utils
const cx = (...args: any) => twMerge(clsx(...args));

// Agregar la constante focusInput si no la tienes en utils
const focusInput = [
  'focus:ring-2',
  'focus:ring-tremor-brand-muted focus:dark:ring-dark-tremor-brand-muted',
  'focus:border-tremor-brand-subtle focus:dark:border-dark-tremor-brand-subtle',
];

const procesosEjemplo = [
  {
    id: "1",
    fecha: "2024-03-20",
    carga: [
      { producto: "Producto A", cantidad: 100, precio: 10 },
      { producto: "Producto B", cantidad: 50, precio: 20 }
    ],
    descarga: [
      { producto: "Producto A", cantidad: 80, precio: 10 },
      { producto: "Producto B", cantidad: 45, precio: 20 }
    ]
  },
  {
    id: "2",
    fecha: "2024-03-21",
    carga: [
      { producto: "Producto C", cantidad: 200, precio: 15 },
      { producto: "Producto D", cantidad: 30, precio: 25 }
    ],
    descarga: [
      { producto: "Producto C", cantidad: 150, precio: 15 },
      { producto: "Producto D", cantidad: 20, precio: 25 }
    ]
  },
  {
    id: "3",
    fecha: "2024-03-22",
    carga: [
      { producto: "Producto E", cantidad: 120, precio: 12 },
      { producto: "Producto F", cantidad: 60, precio: 18 }
    ],
    descarga: [
      { producto: "Producto E", cantidad: 100, precio: 12 },
      { producto: "Producto F", cantidad: 50, precio: 18 }
    ]
  },
  // Agrega más procesos si es necesario
];

// Define the Proceso interface
interface Proceso {
  id: string;
  fecha: string;
  carga: { producto: string; cantidad: number; precio: number }[];
  descarga: { producto: string; cantidad: number; precio: number }[];
}

const options = [
  { label: 'Hoy', days: 0 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
];

const VentasDonjavier = () => {
  const [repartidores, setRepartidores] = useState<Array<{id: string, nombre: string}>>([]);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState("");
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<Proceso | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(0);

  useEffect(() => {
    const fetchRepartidores = async () => {
      try {
        const response = await fetch('/api/repartidores');
        const data = await response.json();
        const repartidoresMapeados = data.map((nombre: string, index: number) => ({
          id: (index + 1).toString(),
          nombre: nombre
        }));
        setRepartidores(repartidoresMapeados);
      } catch (error) {
        console.error('Error al cargar repartidores:', error);
      }
    };

    fetchRepartidores();
  }, []);

  console.log('Valor seleccionado:', repartidorSeleccionado);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return `${formatDate(start)} – ${formatDate(end)}`;
  };

  const procesosFiltrados = procesosEjemplo.filter(proceso => {
    if (periodoSeleccionado === 0) {
      return new Date(proceso.fecha).toDateString() === new Date().toDateString();
    }
    const fechaProceso = new Date(proceso.fecha);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - periodoSeleccionado);
    return fechaProceso >= fechaLimite;
  });

  const calcularDiferencias = () => {
    if (!procesoSeleccionado) return [];

    return procesoSeleccionado.carga.map((itemCarga: { producto: string; cantidad: number; precio: number }) => {
      const itemDescarga = procesoSeleccionado.descarga.find(
        (d: { producto: string; cantidad: number; precio: number }) => d.producto === itemCarga.producto
      );
      const diferencia = itemCarga.cantidad - (itemDescarga?.cantidad || 0);
      const montoVenta = diferencia * itemCarga.precio;

      return {
        producto: itemCarga.producto,
        cargado: itemCarga.cantidad,
        descargado: itemDescarga?.cantidad || 0,
        diferencia,
        precio: itemCarga.precio,
        montoVenta
      };
    });
  };

  const calcularTotalVenta = () => {
    const diferencias = calcularDiferencias();
    return diferencias.reduce((total, item) => total + item.montoVenta, 0);
  };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 w-full">
          <CardHeader className="pb-2">
            <h4 className="text-lg font-semibold">Selección de Período y Repartidor</h4>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="inline-flex items-center rounded-tremor-small text-tremor-default font-medium shadow-tremor-input dark:shadow-dark-tremor-input w-full">
              {options.map((item, index) => (
                <Tooltip.Provider key={index}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        onClick={() => setPeriodoSeleccionado(item.days)}
                        className={cx(
                          index === 0
                            ? 'rounded-l-tremor-small'
                            : index === options.length - 1
                              ? '-ml-px rounded-r-tremor-small'
                              : '-ml-px',
                          focusInput,
                          'border border-tremor-border bg-tremor-background px-4 py-2 text-tremor-content-strong hover:bg-tremor-background-muted hover:text-tremor-content-strong focus:z-10 focus:outline-none dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content-strong hover:dark:bg-dark-tremor-background/50',
                          periodoSeleccionado === item.days && 'bg-tremor-background-muted'
                        )}
                      >
                        {item.label}
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        sideOffset={8}
                        className="z-50 rounded-md bg-gray-900 px-2 py-1 text-xs text-white"
                      >
                        {getDateRange(item.days)}
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              ))}
            </div>
            
            <div className="w-full">
              <Select
                label="Seleccionar Repartidor"
                placeholder="Elige un repartidor"
                value={repartidorSeleccionado}
                onChange={(e) => setRepartidorSeleccionado(e.target.value)}
              >
                {repartidores.map((repartidor) => (
                  <SelectItem 
                    key={repartidor.id} 
                    value={repartidor.id}
                  >
                    {repartidor.nombre}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Resumen de Cuenta */}
        <Card className="p-4 w-full">
          <CardHeader className="pb-2">
            <h4 className="text-lg font-semibold">Resumen de Cuenta</h4>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <p>Procesos Completados: {procesosFiltrados.length}</p>
              <p>Total a Pagar: ${calcularTotalVenta().toFixed(2)}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabla de Procesos */}
      <Card className="p-4 w-full">
        <CardHeader className="pb-2">
          <h4 className="text-lg font-semibold">Procesos de Carga y Descarga</h4>
        </CardHeader>
        <CardBody>
          <Table 
            aria-label="Tabla de Procesos"
            selectionMode="single"
            onSelectionChange={(key) => {
              const proceso = procesosFiltrados.find(p => p.id === key);
              setProcesoSeleccionado(proceso as Proceso | null);
            }}
          >
            <TableHeader>
              <TableColumn>ID Proceso</TableColumn>
              <TableColumn>Fecha</TableColumn>
              <TableColumn>Productos Cargados</TableColumn>
              <TableColumn>Productos Descargados</TableColumn>
              <TableColumn>Acciones</TableColumn>
            </TableHeader>
            <TableBody>
              {procesosFiltrados.map((proceso) => (
                <TableRow key={proceso.id}>
                  <TableCell>{proceso.id}</TableCell>
                  <TableCell>{proceso.fecha}</TableCell>
                  <TableCell>
                    {proceso.carga.reduce((sum, item) => sum + item.cantidad, 0)}
                  </TableCell>
                  <TableCell>
                    {proceso.descarga.reduce((sum, item) => sum + item.cantidad, 0)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      color="primary"
                      onClick={() => setProcesoSeleccionado(proceso as Proceso | null)}
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

      {/* Detalle del Proceso Seleccionado */}
      {procesoSeleccionado && (
        <Card className="p-4 w-full">
          <CardHeader className="pb-2">
            <h4 className="text-lg font-semibold">Detalle del Proceso</h4>
          </CardHeader>
          <CardBody>
            <Table aria-label="Tabla de Diferencias">
              <TableHeader>
                <TableColumn>Producto</TableColumn>
                <TableColumn>Cargado</TableColumn>
                <TableColumn>Descargado</TableColumn>
                <TableColumn>Diferencia</TableColumn>
                <TableColumn>Precio Unitario</TableColumn>
                <TableColumn>Monto Venta</TableColumn>
              </TableHeader>
              <TableBody>
                {calcularDiferencias().map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.producto}</TableCell>
                    <TableCell>{item.cargado}</TableCell>
                    <TableCell>{item.descargado}</TableCell>
                    <TableCell>{item.diferencia}</TableCell>
                    <TableCell>${item.precio}</TableCell>
                    <TableCell>${item.montoVenta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default VentasDonjavier;