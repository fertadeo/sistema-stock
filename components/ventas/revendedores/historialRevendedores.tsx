'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Alert,
  Spinner,
  useDisclosure
} from "@heroui/react";
import { DatePicker } from "@heroui/react";
import { DateValue, parseDate } from "@internationalized/date";
import { BarChart10 } from '@/components/charts/BarChart10';

interface VentaRevendedor {
  venta_id: string;
  fecha_venta: string;
  revendedor_nombre: string;
  productos: any[];
  monto_total: string;
}

interface Estadisticas {
  ventaTotal: number;
  cantidadVentas: number;
  diaMasVentas: string;
}

interface Revendedor {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombreProducto: string;
  precioPublico: number;
  precioRevendedor: number;
  cantidadStock: number | null;
  descripcion: string | null;
}

export default function HistorialRevendedores() {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete} = useDisclosure();
  const [ventas, setVentas] = useState<VentaRevendedor[]>([]);
  const [revendedores, setRevendedores] = useState<Revendedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [revendedorSeleccionado, setRevendedorSeleccionado] = useState<number | "">("");
  const [fechaInicio, setFechaInicio] = useState<DateValue | null>(null);
  const [fechaFin, setFechaFin] = useState<DateValue | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 8;
  const [fechaSeleccionadaGrafico, setFechaSeleccionadaGrafico] = useState<string | null>(null);
  const [nuevoRevNombre, setNuevoRevNombre] = useState("");
  const [cargandoNuevoRev, setCargandoNuevoRev] = useState(false);
  const [errorNuevoRev, setErrorNuevoRev] = useState("");
  const [alertaExito, setAlertaExito] = useState(false);
  const [alertaError, setAlertaError] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState("");
  const [ventaAEliminar, setVentaAEliminar] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Obtener ventas de revendedores
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${API_URL}/api/ventas/resumen`)
      .then(res => res.json())
      .then(data => {
        console.log('VENTAS:', data);
        if (Array.isArray(data)) {
          setVentas(data);
        } else if (Array.isArray(data.ventas)) {
          setVentas(data.ventas);
        } else {
          setVentas([]);
        }
      })
      .catch(() => {
        setVentas([]);
      });
  }, []);

  // Obtener revendedores al montar
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${API_URL}/api/revendedores`)
      .then(res => res.json())
      .then(data => {
        console.log('REVENDEDORES:', data);
        if (data.success) setRevendedores(data.revendedores);
        else setRevendedores([]);
      })
      .catch(() => setRevendedores([]));
  }, []);

  // Obtener productos al montar
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${API_URL}/api/productos`)
      .then(res => res.json())
      .then(data => {
        setProductos(data);
      })
      .catch(() => setProductos([]));
  }, []);

  // Filtrar ventas por revendedor (usando id)
  const ventasFiltradas = ventas.filter(v => {
    let coincideRevendedor = true;
    if (revendedorSeleccionado !== "") {
      const rev = revendedores.find(r => r.id === revendedorSeleccionado);
      coincideRevendedor = rev ? v.revendedor_nombre === rev.nombre : false;
    }
    const fechaVenta = new Date(v.fecha_venta);
    // Convertir fechaInicio y fechaFin a Date para comparar correctamente
    let coincideFechaInicio = true;
    let coincideFechaFin = true;
    if (fechaInicio) {
      const fechaInicioDate = new Date(fechaInicio.toString());
      // Comparar solo la parte de la fecha (sin hora)
      coincideFechaInicio = fechaVenta >= new Date(fechaInicioDate.toISOString().slice(0, 10));
    }
    if (fechaFin) {
      const fechaFinDate = new Date(fechaFin.toString());
      coincideFechaFin = fechaVenta <= new Date(fechaFinDate.toISOString().slice(0, 10) + 'T23:59:59');
    }
    return coincideRevendedor && coincideFechaInicio && coincideFechaFin;
  });

  // Calcular estadísticas en el render
  const estadisticas: Estadisticas = React.useMemo(() => {
    if (ventasFiltradas.length > 0) {
      const ventaTotal = ventasFiltradas.reduce((sum, v) => sum + Number(v.monto_total), 0);
      const ventasPorDia = ventasFiltradas.reduce((acc, v) => {
        const dia = new Date(v.fecha_venta).toLocaleDateString('es-ES', { weekday: 'long' });
        acc[dia] = (acc[dia] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const diaMasVentas = Object.entries(ventasPorDia)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
      return {
        ventaTotal,
        cantidadVentas: ventasFiltradas.length,
        diaMasVentas
      };
    } else {
      return {
        ventaTotal: 0,
        cantidadVentas: 0,
        diaMasVentas: ''
      };
    }
  }, [ventasFiltradas]);

  // Preparar datos para el gráfico
  const datosGrafico = React.useMemo(() => {
    // Agrupar ventas por fecha
    const ventasPorFecha = ventasFiltradas.reduce((acc, venta) => {
      const fecha = new Date(venta.fecha_venta).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      if (!acc[fecha]) {
        acc[fecha] = 0;
      }
      acc[fecha] += Number(venta.monto_total);
      return acc;
    }, {} as Record<string, number>);

    // Convertir a formato para el gráfico
    return Object.entries(ventasPorFecha).map(([fecha, monto]) => ({
      date: fecha,
      Ventas: monto
    }));
  }, [ventasFiltradas]);

  // Calcular ventas para la página actual
  const ventasPaginadas = React.useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    return ventasFiltradas.slice(inicio, fin);
  }, [ventasFiltradas, paginaActual]);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(ventasFiltradas.length / filasPorPagina);

  // Resetear a la primera página cuando cambian los filtros
  React.useEffect(() => {
    setPaginaActual(1);
  }, [revendedorSeleccionado, fechaInicio, fechaFin]);

  // Función para eliminar una venta (a implementar)
  const handleEliminarVenta = async (ventaId: string) => {
    setVentaAEliminar(ventaId);
    onOpenDelete();
  };

  const confirmarEliminacion = async () => {
    if (!ventaAEliminar) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${API_URL}/api/ventas/${ventaAEliminar}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        setMensajeAlerta('Venta eliminada exitosamente');
        setAlertaExito(true);
        setTimeout(() => setAlertaExito(false), 5000);
        // Refrescar lista de ventas
        fetch(`${API_URL}/api/ventas/resumen`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setVentas(data);
            } else if (Array.isArray(data.ventas)) {
              setVentas(data.ventas);
            }
          });
      } else {
        setMensajeAlerta(data.message || 'Error al eliminar la venta');
        setAlertaError(true);
        setTimeout(() => setAlertaError(false), 5000);
      }
    } catch (err) {
      setMensajeAlerta('Error de red al eliminar la venta');
      setAlertaError(true);
      setTimeout(() => setAlertaError(false), 5000);
    }

    onOpenChangeDelete();
    setVentaAEliminar(null);
  };

  const abrirModal = () => onOpen();
  const cerrarModal = () => {
    onOpenChange();
    setNuevoRevNombre("");
    setErrorNuevoRev("");
  };

  const handleCrearRevendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoNuevoRev(true);
    setErrorNuevoRev("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${API_URL}/api/revendedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoRevNombre })
      });
      const data = await res.json();
      if (data.success) {
        setMensajeAlerta('Revendedor creado exitosamente');
        setAlertaExito(true);
        setTimeout(() => setAlertaExito(false), 5000);
        // Refrescar lista de revendedores
        fetch(`${API_URL}/api/revendedores`)
          .then(res => res.json())
          .then(data => {
            if (data.success) setRevendedores(data.revendedores);
          });
        // Espera 3 segundos antes de cerrar el modal y quitar el spinner
        setTimeout(() => {
          setCargandoNuevoRev(false);
          cerrarModal();
        }, 3000);
      } else {
        setErrorNuevoRev(data.message || 'Error al crear revendedor');
        setMensajeAlerta('Error al crear revendedor');
        setAlertaError(true);
        setTimeout(() => setAlertaError(false), 5000);
        setCargandoNuevoRev(false);
      }
    } catch (err) {
      setErrorNuevoRev('Error de red');
      setMensajeAlerta('Error de red al crear revendedor');
      setAlertaError(true);
      setTimeout(() => setAlertaError(false), 5000);
      setCargandoNuevoRev(false);
    }
  };

  // Cerrar modal con ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrarModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Función para obtener el nombre del producto por ID
  const obtenerNombreProducto = (productoId: string) => {
    const producto = productos.find(p => p.id.toString() === productoId);
    return producto ? producto.nombreProducto : `Producto ${productoId}`;
  };

  return (
    <div className="flex flex-col p-4 w-full h-screen bg-gray-50">
      <div className="space-y-4 w-full h-full">
        {/* Título y botón nuevo revendedor */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-center">Historial de Ventas a Revendedores</h1>
          <button
            className="px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            onClick={abrirModal}
          >
            Nuevo revendedor
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 items-start md:flex-row">
          <div className="flex flex-1 items-center p-4 bg-white rounded-xl shadow">
            <div className="w-full">
              <label 
                htmlFor="revendedor-select"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Seleccionar Revendedor
              </label>
              <select
                id="revendedor-select"
                value={revendedorSeleccionado}
                onChange={e => setRevendedorSeleccionado(Number(e.target.value) || "")}
                className="px-3 py-2 w-full text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los revendedores</option>
                {revendedores.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-1 gap-2 items-center p-4 bg-white rounded-xl shadow">
            <DatePicker
              label="Fecha Inicio"
              value={fechaInicio}
              onChange={setFechaInicio}
              className="w-full"
            />
            {/* Botón limpiar fechas */}
            {(fechaInicio || fechaFin) && (
              <button
                type="button"
                className="px-4 py-2 ml-2 text-base font-normal text-green-700 bg-green-100 rounded-lg border-none shadow-none transition-colors hover:bg-green-200"
                onClick={() => {
                  setFechaInicio(null);
                  setFechaFin(null);
                }}
                title="Limpiar fechas"
              >
                Limpiar fechas
              </button>
            )}
          </div>
          <div className="flex flex-1 items-center p-4 bg-white rounded-xl shadow">
            <DatePicker
              label="Fecha Fin"
              value={fechaFin}
              onChange={setFechaFin}
              className="w-full"
            />
          </div>
        </div>

        {/* Estadísticas */}
        {ventasFiltradas.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="bg-blue-50">
              <CardBody>
                <h3 className="text-lg font-semibold text-blue-800">Venta Total</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${estadisticas.ventaTotal.toLocaleString()}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-green-50">
              <CardBody>
                <h3 className="text-lg font-semibold text-green-800">Cantidad de Ventas</h3>
                <p className="text-2xl font-bold text-green-600">
                  {estadisticas.cantidadVentas}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-purple-50">
              <CardBody>
                <h3 className="text-lg font-semibold text-purple-800">Día con más ventas</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {estadisticas.diaMasVentas}
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Gráfico */}
        <div className="p-6 h-1/3 bg-white rounded-2xl shadow">
          <BarChart10
            data={datosGrafico}
            ventas={ventas}
            onBarSelect={(date) => {
              if (date) {
                const partes = date.split('/');
                if (partes.length === 3) {
                  const day = partes[0];
                  const month = partes[1];
                  const year = partes[2];
                  if (day && month && year) {
                    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    const parsed = parseDate(isoDate);
                    setFechaInicio(parsed);
                    setFechaFin(parsed);
                    setPaginaActual(1);
                    setFechaSeleccionadaGrafico(date);
                  }
                } else {
                  console.warn('Formato de fecha inesperado:', date);
                }
              } else {
                setFechaInicio(null);
                setFechaFin(null);
                setFechaSeleccionadaGrafico(null);
              }
            }}
            fechaSeleccionada={fechaSeleccionadaGrafico}
          />
          {fechaSeleccionadaGrafico && (
            <div className="flex justify-end mt-2">
              <button
                className="text-xs text-blue-600 underline hover:text-blue-800"
                onClick={() => {
                  setFechaInicio(null);
                  setFechaFin(null);
                  setFechaSeleccionadaGrafico(null);
                }}
              >
                Limpiar filtro de fecha
              </button>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-auto flex-1 p-4 bg-white rounded-2xl shadow-lg">
          <Table aria-label="Tabla de ventas a revendedores" className="w-full">
            <TableHeader>
              <TableColumn>Fecha</TableColumn>
              <TableColumn>Revendedor</TableColumn>
              <TableColumn>Productos</TableColumn>
              <TableColumn>Monto</TableColumn>
              <TableColumn>Opciones</TableColumn>
            </TableHeader>
            <TableBody>
              {ventasPaginadas.map((venta) => (
                <TableRow key={venta.venta_id}>
                  <TableCell>
                    {venta.fecha_venta
                      ? new Date(venta.fecha_venta).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : ''}
                  </TableCell>
                  <TableCell>{venta.revendedor_nombre}</TableCell>
                  <TableCell>
                    {Array.isArray(venta.productos)
                      ? venta.productos
                          .map(
                            (p: any) =>
                              `${obtenerNombreProducto(p.producto_id)} x${p.cantidad}u. Subtotal: $${Number(p.subtotal).toLocaleString('es-AR')}`
                          )
                          .join(', ')
                      : ''}
                  </TableCell>
                  <TableCell>
                    {venta.monto_total
                      ? `$${Number(venta.monto_total).toLocaleString('es-AR')}`
                      : ''}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="p-2 rounded transition hover:bg-red-100"
                      title="Eliminar venta"
                      onClick={() => handleEliminarVenta(venta.venta_id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Controles de paginación */}
          {ventasFiltradas.length > 0 && (
            <div className="flex justify-between items-center px-2 mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {ventasPaginadas.length} de {ventasFiltradas.length} ventas
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal para crear revendedor */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Crear nuevo revendedor
                </ModalHeader>
                <ModalBody>
                  <form onSubmit={handleCrearRevendedor} className="flex flex-col gap-4">
                    <Input
                      label="Nombre"
                      value={nuevoRevNombre}
                      onChange={e => setNuevoRevNombre(e.target.value)}
                      required
                      type="text"
                    />
                    {errorNuevoRev && <div className="text-sm text-red-600">{errorNuevoRev}</div>}
                  </form>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose} isDisabled={cargandoNuevoRev}>
                    Cancelar
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={() => {
                      const event = new Event('submit') as unknown as React.FormEvent;
                      handleCrearRevendedor(event);
                    }}
                    isDisabled={cargandoNuevoRev}
                    className="flex gap-2 items-center"
                  >
                    {cargandoNuevoRev && (
                      <Spinner size="sm" color="white" />
                    )}
                    {cargandoNuevoRev ? 'Creando...' : 'Crear'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Modal de confirmación para eliminar venta */}
        <Modal isOpen={isOpenDelete} onOpenChange={onOpenChangeDelete}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Confirmar eliminación
                </ModalHeader>
                <ModalBody>
                  <p className="font-semibold text-red-600">
                    ¿Estás seguro que deseas eliminar esta venta?
                  </p>
                  <p className="text-gray-600">
                    Esta acción no se puede deshacer y los datos se perderán permanentemente.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button 
                    color="danger" 
                    onPress={confirmarEliminacion}
                  >
                    Eliminar
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Alert de éxito */}
        {alertaExito && (
          <Alert
            color="success"
            className="fixed bottom-6 right-6 z-[10000] w-1/5"
            onClose={() => setAlertaExito(false)}
            isVisible={alertaExito}
          >
            {mensajeAlerta}
          </Alert>
        )}

        {/* Alert de error */}
        {alertaError && (
          <Alert
            color="danger"
            className="fixed bottom-6 right-6 z-[10000] w-1/5"
            onClose={() => setAlertaError(false)}
            isVisible={alertaError}
          >
            {mensajeAlerta}
          </Alert>
        )}
      </div>
    </div>
  );
}
