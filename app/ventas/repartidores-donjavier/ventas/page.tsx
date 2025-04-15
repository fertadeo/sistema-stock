'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import * as Tooltip from '@radix-ui/react-tooltip';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import TableProcesos from '@/components/ventas/repartidores/tableprocesos';
import ModalCierreProceso from '@/components/ventas/repartidores/modalcierreproceso';
import CardResumenVentas from '@/components/ventas/repartidores/cardResumenVentas';
import TableVentasCerradas from '@/components/ventas/repartidores/tableVentasCerradas';
import { Proceso, VentaCerrada } from '@/types/ventas';

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

// Definir las opciones de filtrado
const options = [
  { label: 'Hoy', days: 0 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
];

// Registrar los componentes necesarios de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

const VentasDonjavier = () => {
  // Función para formatear fechas
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return {
      fecha: `${year}-${month}-${day}`,
      hora: `${hours}:${minutes}`
    };
  };

  // Función para obtener un rango de fechas
  const getDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    
    if (days > 0) {
      // Para rangos de días, restar los días a la fecha inicial
    start.setDate(end.getDate() - days);
    } else if (days === 0) {
      // Para "Hoy", usar el inicio del día actual
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      // Para "Mostrar Todo", usar un rango amplio
      start.setFullYear(start.getFullYear() - 1); // Un año atrás
    }

    console.log('Rango de fechas calculado:', {
      days,
      start: start.toISOString(),
      end: end.toISOString()
    });

    return {
      startDate: start,
      endDate: end,
      formattedRange: `${formatDate(start).fecha} – ${formatDate(end).fecha}`
    };
  };

  const [repartidores, setRepartidores] = useState<any[]>([]);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<string>('');
  const [procesosFiltrados, setProcesosFiltrados] = useState<Proceso[]>([]);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<Proceso | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date(0)); // Fecha mínima por defecto
  const [fechaFin, setFechaFin] = useState<Date>(new Date()); // Fecha actual por defecto
  const [loading, setLoading] = useState<boolean>(true);
  const [productos, setProductos] = useState<any[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number>(7); // Default a 7 días
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comisionPorcentaje, setComisionPorcentaje] = useState<number>(20); // Default 20%
  const [selectedTab, setSelectedTab] = useState("pendientes");
  const [loadingVentasCerradas, setLoadingVentasCerradas] = useState<boolean>(true);
  const [ventasCerradas, setVentasCerradas] = useState<VentaCerrada[]>([]);

  // Función para obtener el precio de un producto específico
  const obtenerPrecioProducto = (producto_id: number) => {
    const productoEncontrado = productos.find(p => p.id === producto_id);
    return productoEncontrado?.precioPublico || 0;
  };

  // Función para obtener las ventas de un repartidor
  const fetchVentasRepartidor = async (repartidorId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/descargas/repartidor/${repartidorId}`
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener las ventas');
      }
      
      const data = await response.json();
      console.log('Datos de descargas obtenidos:', data);
      setProcesosFiltrados(data);
      
    } catch (error) {
      console.error('Error:', error);
      setProcesosFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVentasCerradas = async (repartidorId: string) => {
    try {
      setLoadingVentasCerradas(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ventas-cerradas/repartidor/${repartidorId}`
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener las ventas cerradas');
      }
      
      const data = await response.json();
      console.log('Datos de ventas cerradas obtenidos:', data);
      
      if (data.success && data.ventas_cerradas) {
        setVentasCerradas(data.ventas_cerradas);
      } else {
        setVentasCerradas([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setVentasCerradas([]);
    } finally {
      setLoadingVentasCerradas(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repartidores`);
        if (!response.ok) {
          throw new Error('Error al obtener los repartidores');
        }
        const data = await response.json();
        setRepartidores(data);
        
        // Seleccionar el primer repartidor por defecto
        if (data.length > 0) {
          const primerRepartidorId = data[0].id.toString();
          setRepartidorSeleccionado(primerRepartidorId);
          await fetchVentasRepartidor(primerRepartidorId);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInicial();
  }, []);

  // Actualizar datos cuando cambia el repartidor
  useEffect(() => {
    if (repartidorSeleccionado) {
      Promise.all([
        fetchVentasRepartidor(repartidorSeleccionado),
        fetchVentasCerradas(repartidorSeleccionado)
      ]);
    }
  }, [repartidorSeleccionado]);

  // Actualizar fechas cuando cambia el período
  useEffect(() => {
    const range = getDateRange(periodoSeleccionado);
    setFechaInicio(range.startDate);
    setFechaFin(range.endDate);
  }, [periodoSeleccionado]);

  console.log('Valor seleccionado:', repartidorSeleccionado);

  // Función para calcular el total de ventas de todos los procesos
  const calcularTotalVenta = () => {
    return procesosFiltrados.reduce((total, proceso) => {
      const monto = proceso.totales?.monto_total ? parseFloat(proceso.totales.monto_total.toString()) : 0;
      return total + monto;
    }, 0);
  };

  const obtenerProductosMasVendidos = () => {
    if (!procesosFiltrados.length) return [];
    
    return procesosFiltrados.map(proceso => ({
      nombre: proceso.observaciones,
      cantidad: proceso.productos_detalle?.reduce((total, prod) => total + prod.cantidad_vendida, 0) || 0,
      subtotal: parseFloat(proceso.totales?.monto_total?.toString() || '0')
    })).sort((a, b) => b.cantidad  - a.cantidad);
  };

  // Función para preparar los datos del gráfico
  const prepararDatosGrafico = (procesos: Proceso[]) => {
    const ventasPorFecha = procesos.reduce((acc: Record<string, number>, proceso) => {
      const fecha = new Date(proceso.fecha_descarga).toLocaleDateString();
      const monto = proceso.totales?.monto_total ? parseFloat(proceso.totales.monto_total.toString()) : 0;
      acc[fecha] = (acc[fecha] || 0) + monto;
      return acc;
    }, {});

    // Ordenar fechas
    const fechasOrdenadas = Object.keys(ventasPorFecha).sort();

    return {
      labels: fechasOrdenadas,
      datasets: [
        {
          label: 'Ventas por día',
          data: fechasOrdenadas.map(fecha => ventasPorFecha[fecha]),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Opciones del gráfico
  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Ventas Diarias',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Fecha',
        },
      },
    },
  };

  // Función para actualizar los datos
  const actualizarDatos = async () => {
    if (repartidorSeleccionado) {
      try {
        // Actualizar procesos pendientes y ventas cerradas en paralelo
        const [procesosResponse, ventasResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/descargas/repartidor/${repartidorSeleccionado}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ventas-cerradas/repartidor/${repartidorSeleccionado}`)
        ]);

        if (procesosResponse.ok) {
          const data = await procesosResponse.json();
          setProcesosFiltrados(data);
        }

        if (ventasResponse.ok) {
          const data = await ventasResponse.json();
          if (data.success && data.ventas_cerradas) {
            setVentasCerradas(data.ventas_cerradas);
          }
        }
      } catch (error) {
        console.error('Error al actualizar datos:', error);
      }
    }
  };

  // Función para actualizar las ventas cerradas
  const actualizarVentasCerradas = async () => {
    if (repartidorSeleccionado) {
      await fetchVentasCerradas(repartidorSeleccionado);
    }
  };

  return (
    <div className="p-4 mx-auto space-y-4 max-w-[1400px]">
        <Card className="p-4 w-full">
          <CardHeader className="pb-2">
          <h4 className="text-xl font-semibold">Ventas por Repartidor</h4>
          </CardHeader>
          <CardBody className="space-y-4">
          <div className="w-full">
            <Tabs 
              aria-label="Repartidores" 
              selectedKey={repartidorSeleccionado}
              onSelectionChange={(key) => setRepartidorSeleccionado(key.toString())}
              className="w-full"
              variant="underlined"
              size="lg"
            >
              {repartidores.map((repartidor) => (
                <Tab key={repartidor.id.toString()} title={repartidor.nombre} />
              ))}
            </Tabs>
          </div>
{/* 
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Período de tiempo</h5>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="inline-flex items-center font-medium rounded-tremor-small text-tremor-default shadow-tremor-input dark:shadow-dark-tremor-input">
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
                              'border border-tremor-border bg-tremor-background px-3 py-1.5 text-sm text-tremor-content-strong hover:bg-tremor-background-muted hover:text-tremor-content-strong focus:z-10 focus:outline-none dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content-strong hover:dark:bg-dark-tremor-background/50',
                              periodoSeleccionado === item.days && 'bg-tremor-background-muted text-primary border-primary'
                          )}
                        >
                          {item.label}
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="top"
                          sideOffset={8}
                          className="z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded-md"
                        >
                            {getDateRange(item.days).formattedRange}
                          <Tooltip.Arrow className="fill-gray-900" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                ))}
              </div>
                <Button 
                  size="sm"
                  variant="light"
                  onClick={() => {
                    setPeriodoSeleccionado(-1);
                    setFechaInicio(new Date(0));
                    setFechaFin(new Date());
                  }}
                >
                  Mostrar Todo
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fechaInicio" className="block mb-1 text-sm font-medium text-gray-700">Fecha Inicio</label>
                <input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio.toISOString().split('T')[0]}
                  onChange={(e) => setFechaInicio(new Date(e.target.value))}
                  className="p-2 w-full text-sm rounded border focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="fechaFin" className="block mb-1 text-sm font-medium text-gray-700">Fecha Fin</label>
                <input
                  id="fechaFin"
                  type="date"
                  value={fechaFin.toISOString().split('T')[0]}
                  onChange={(e) => setFechaFin(new Date(e.target.value))}
                  className="p-2 w-full text-sm rounded border focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div> */}

          {loading && (
            <div className="flex justify-center items-center py-2">
              <div className="w-5 h-5 rounded-full border-b-2 animate-spin border-primary"></div>
              <span className="ml-2 text-sm text-gray-600">Cargando datos...</span>
            </div>
          )}
          </CardBody>
        </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tabs de Ventas */}
        <div className="lg:col-span-2">
          <Card className="p-4 w-full">
            <CardHeader className="pb-2">
              <h4 className="text-lg font-semibold">Gestión de Ventas</h4>
            </CardHeader>
            <CardBody>
              <Tabs 
                selectedKey={selectedTab} 
                onSelectionChange={(key) => setSelectedTab(key.toString())}
                className="mb-4"
              >
                <Tab key="pendientes" title="Descargas Pendientes">
                  <TableProcesos 
                    procesosFiltrados={procesosFiltrados}
                    loading={loading}
                    onSelectProceso={setProcesoSeleccionado}
                    setModalAbierto={setModalAbierto}
                  />
                </Tab>
                <Tab key="cerradas" title="Ventas Cerradas">
                  <TableVentasCerradas 
                    repartidorId={repartidorSeleccionado}
                    ventasCerradas={ventasCerradas}
                    loading={loadingVentasCerradas}
                    onVentasActualizadas={actualizarVentasCerradas}
                  />
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>

        {/* Resumen de Cuenta
        <CardResumenVentas
          procesosFiltrados={procesosFiltrados}
          repartidorSeleccionado={repartidorSeleccionado}
          repartidores={repartidores}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          calcularTotalVenta={calcularTotalVenta}
          obtenerProductosMasVendidos={obtenerProductosMasVendidos}
          formatDate={formatDate}
        /> */}

        {/* Gráfico de Ventas */}
        {/* <Card className="p-4 w-full">
          <CardHeader className="pb-2">
            <h4 className="text-lg font-semibold">
              Gráfico de Ventas {repartidorSeleccionado !== 'todos' && 
                `- ${repartidores.find(r => r.id.toString() === repartidorSeleccionado)?.nombre}`
              }
            </h4>
          </CardHeader>
          <CardBody>
            <div className="w-full h-[250px]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 rounded-full border-b-2 animate-spin border-primary"></div>
                </div>
              ) : procesosFiltrados.length > 0 ? (
                <Bar 
                  data={prepararDatosGrafico(procesosFiltrados)} 
                  options={opcionesGrafico}
                />
              ) : (
                <div className="flex justify-center items-center h-full text-gray-500">
                  No hay datos disponibles para mostrar
                </div>
              )}
            </div>
          </CardBody>
        </Card> */}
      </div>

      <ModalCierreProceso
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setProcesoSeleccionado(null);
        }}
        proceso={procesoSeleccionado}
        obtenerPrecioProducto={obtenerPrecioProducto}
        onProcesoGuardado={actualizarDatos}
      />
    </div>
  );
};

export default VentasDonjavier;