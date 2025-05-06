'use client'
import React, { useState, useEffect } from 'react'
import "@/styles/globals.css"
import {Card, CardBody, CardHeader, Input, Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react"
import { motion, AnimatePresence } from "framer-motion"

interface Producto {
  id: number;
  nombreProducto: string;
  precioPublico: number;
  precioRevendedor: number;
  cantidadStock: number | null;
  descripcion: string | null;
}

interface ProductoDescarga {
  id: number;
  cantidadCarga?: number;
  // Solo para productos de soda
  cajonesLlenos?: number;
  unidadesLlenas?: number;
  cajonesVacios?: number;
  unidadesVacias?: number;
  // Para productos que no son soda
  cantidadLlenos?: number;
  cantidadVacios?: number;
}

interface OrderForm {
  fecha: string;
  repartidor: string;
  productos: ProductoDescarga[];
}

interface ProductoReporte {
  producto: string;
  total?: number;
  cantidad?: number;
  llenos?: number | { total: number };
  vacios?: number | { total: number };
}

interface Diferencia {
  producto: string;
  cantidadCargada: number;
  cantidadDescargada: number;
  cantidadVendida: number;
  envasesFaltantes: number;
}

interface Repartidor {
  id: number;
  nombre: string;
  telefono: string;
  zona_reparto: string;
  activo: boolean;
  fecha_registro: string;
}

interface CargaRepartidor {
  id: number;
  repartidor_id: number;
  fecha_carga: string;
  estado: 'pendiente' | 'completada';
  items: {
    id: number;
    carga_id: number;
    producto_id: number;
    cantidad: number;
  }[];
  repartidor: {
    id: number;
    nombre: string;
    telefono: string;
    zona_reparto: string;
    activo: boolean;
    fecha_registro: string;
  };
}

const ControlCargaPage = () => {
  const [isCarga, setIsCarga] = useState(true);
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const localToday = `${yyyy}-${mm}-${dd}`;
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingRepartidores, setIsLoadingRepartidores] = useState(true);
  const [isLoadingProductos, setIsLoadingProductos] = useState(true);
  const [formData, setFormData] = useState<OrderForm>({
    fecha: localToday,
    repartidor: '',
    productos: []
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reporteTemp, setReporteTemp] = useState<any>(null);
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const [alertMessage, setAlertMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cargasPendientes, setCargasPendientes] = useState<CargaRepartidor[]>([]);
  const [cargaSeleccionada, setCargaSeleccionada] = useState<CargaRepartidor | null>(null);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<string>('');
  const [productosAdicionales, setProductosAdicionales] = useState<Producto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<number[]>([8, 9, 10, 11, 12]);
  const [isModalCambioModoOpen, setIsModalCambioModoOpen] = useState(false);
  const [cargaAEliminar, setCargaAEliminar] = useState<CargaRepartidor | null>(null);
  const [isModalEliminarCargaOpen, setIsModalEliminarCargaOpen] = useState(false);
  const [mostrarListaEliminar, setMostrarListaEliminar] = useState(false);

  useEffect(() => {
    const fetchRepartidores = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/repartidores`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Error al obtener repartidores: ${response.status}`);
        }

        const data = await response.json();
        setRepartidores(data);
      } catch (error) {
        console.error('Error al cargar repartidores:', error);
        handleError('Error al cargar la lista de repartidores');
      } finally {
        setIsLoadingRepartidores(false);
      }
    };

    fetchRepartidores();
  }, []);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`);
        if (!response.ok) {
          throw new Error('Error al cargar los productos');
        }
        const data = await response.json();
        setProductos(data);
        
        // Separar los productos adicionales (ID > 4)
        const adicionales = data.filter((p: Producto) => p.id > 4);
        setProductosAdicionales(adicionales);
        
        // Inicializar el formData con los productos principales
        setFormData(prev => ({
          ...prev,
          productos: data.map((p: Producto) => ({
            id: p.id,
            cantidadCarga: 0,
            cajonesLlenos: 0,
            unidadesLlenas: 0,
            cajonesVacios: 0,
            unidadesVacias: 0,
            cantidadLlenos: 0,
            cantidadVacios: 0
          }))
        }));
      } catch (error) {
        console.error('Error al cargar productos:', error);
        handleError('Error al cargar la lista de productos');
      } finally {
        setIsLoadingProductos(false);
      }
    };

    fetchProductos();
  }, []);

  const fetchCargasPendientes = async (repartidorId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cargas/pendientes/repartidor/${repartidorId}`);
      if (!response.ok) {
        throw new Error(`Error al obtener cargas pendientes: ${response.status}`);
      }
      const data = await response.json();
      console.log('=== DATOS RECIBIDOS DEL GET DE CARGAS PENDIENTES ===');
      console.log(data);
      console.log('==============================================');
      
      setCargasPendientes(data);
    } catch (error) {
      console.error('Error al cargar las cargas pendientes:', error);
      handleError('Error al cargar las cargas pendientes');
    }
  };

  const calcularTotalUnidades = (cajones: number = 0, unidades: number = 0) => {
    return (cajones * 6) + unidades;
  };

  const handleProductChange = (
    productId: number, 
    field: string, 
    value: number,
    isSoda: boolean = false
  ) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.map(p => {
        if (p.id === productId) {
          if (isSoda) {
            // Calcula el total de unidades para productos de soda
            const newValues = { ...p, [field]: value };
            const totalLlenos = calcularTotalUnidades(
              newValues.cajonesLlenos || 0,
              newValues.unidadesLlenas || 0
            );
            const totalVacios = calcularTotalUnidades(
              newValues.cajonesVacios || 0,
              newValues.unidadesVacias || 0
            );
            return {
              ...newValues,
              cantidadLlenos: totalLlenos,
              cantidadVacios: totalVacios
            };
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    }));
  };

  const toggleMode = () => {
    if (!isCarga && cargaSeleccionada) {
      // Si estamos en modo descarga y hay una carga seleccionada, mostrar confirmación
      setIsModalCambioModoOpen(true);
    } else {
      // En cualquier otro caso, cambiar directamente
      cambiarModo();
    }
  };

  const cambiarModo = () => {
    setIsCarga(!isCarga);
    // Limpiar el formulario
    setFormData({
      fecha: localToday,
      repartidor: '',
      productos: productos.map(p => ({
        id: p.id,
        cantidadCarga: 0,
        cajonesLlenos: 0,
        unidadesLlenas: 0,
        cajonesVacios: 0,
        unidadesVacias: 0,
        cantidadLlenos: 0,
        cantidadVacios: 0
      }))
    });
    // Limpiar la selección de carga
    setCargaSeleccionada(null);
    setRepartidorSeleccionado('');
    // Restablecer los productos seleccionados a los iniciales
    setProductosSeleccionados([8, 9, 10, 11, 12]);
    setIsModalCambioModoOpen(false);
  };

  const showAlert = (message: string) => {
    setAlertMessage(message);
    onAlertOpen();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que se haya seleccionado un repartidor
    if (!formData.repartidor) {
      showAlert('Por favor selecciona un repartidor');
      return;
    }

    const reporte = {
      tipo: isCarga ? 'CARGA' : 'DESCARGA',
      fecha: formData.fecha,
      repartidor: formData.repartidor,
      productos: formData.productos.map(producto => {
        const productoInfo = productos.find(p => p.id === producto.id);
        const isSifon = productoInfo?.nombreProducto?.toLowerCase().includes('sifon') || false;

        if (isCarga) {
          if (isSifon) {
            return {
              producto: productoInfo?.nombreProducto || 'Producto desconocido',
              cajones: Math.floor((producto.cantidadCarga || 0) / 6),
              unidades: (producto.cantidadCarga || 0) % 6,
              total: producto.cantidadCarga
            };
          }
          return {
            producto: productoInfo?.nombreProducto || 'Producto desconocido',
            cantidad: producto.cantidadCarga
          };
        } else {
          if (isSifon) {
            return {
              producto: productoInfo?.nombreProducto,
              llenos: {
                cajones: producto.cajonesLlenos,
                unidades: producto.unidadesLlenas,
                total: (producto.cajonesLlenos || 0) * 6 + (producto.unidadesLlenas || 0)
              },
              vacios: {
                cajones: producto.cajonesVacios,
                unidades: producto.unidadesVacias,
                total: (producto.cajonesVacios || 0) * 6 + (producto.unidadesVacias || 0)
              },
              faltantes: (producto.cantidadCarga || 0) - 
                ((producto.cajonesLlenos || 0) * 6 + (producto.unidadesLlenas || 0) +
                 (producto.cajonesVacios || 0) * 6 + (producto.unidadesVacias || 0))
            };
          }
          return {
            producto: productoInfo?.nombreProducto,
            llenos: producto.cantidadLlenos,
            vacios: producto.cantidadVacios,
            faltantes: (producto.cantidadCarga || 0) - 
              ((producto.cantidadLlenos || 0) + (producto.cantidadVacios || 0))
          };
        }
      }).filter(producto => {
        if (isCarga) {
          if ('total' in producto && typeof producto.total === 'number') {
            return producto.total > 0;
          }
          if ('cantidad' in producto && typeof producto.cantidad === 'number') {
            return producto.cantidad > 0;
          }
          return false;
        } else {
          const hasLlenos = 'llenos' in producto && producto.llenos !== undefined && 
            (typeof producto.llenos === 'number' ? producto.llenos > 0 : producto.llenos.total > 0);
          const hasVacios = 'vacios' in producto && producto.vacios !== undefined && 
            (typeof producto.vacios === 'number' ? producto.vacios > 0 : producto.vacios.total > 0);
          return hasLlenos || hasVacios;
        }
      })
    };

    const palabrasClave = ['sifon', 'soda', 'agua', 'bidón'];
    const hayProductoDescargado = formData.productos.some(producto => {
      const productoInfo = productos.find(p => p.id === producto.id);
      const nombre = productoInfo?.nombreProducto?.toLowerCase() || '';
      const esPorCajonUnidad = palabrasClave.some(palabra => nombre.includes(palabra));
      if (esPorCajonUnidad) {
        const totalLlenos = (producto.cajonesLlenos || 0) * 6 + (producto.unidadesLlenas || 0);
        const totalVacios = (producto.cajonesVacios || 0) * 6 + (producto.unidadesVacias || 0);
        return totalLlenos > 0 || totalVacios > 0;
      } else {
        return (producto.cantidadLlenos || 0) > 0 || (producto.cantidadVacios || 0) > 0;
      }
    });
    if (!hayProductoDescargado) {
      showAlert('Debes descargar al menos un producto');
      return;
    }

    setReporteTemp(reporte);
    setIsModalOpen(true);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => {
      setShowError(false);
    }, 3000);
  };

  const confirmarGuardado = async () => {
    try {
      if (isCarga) {
        const repartidorId = parseInt(formData.repartidor);
        
        // console.log('=== DEBUGGING INFORMACIÓN ===');
        // console.log('Estado del formulario:', formData);
        // console.log('Lista de repartidores:', repartidores);
        // console.log('ID del repartidor seleccionado:', repartidorId);
        // console.log('Repartidor encontrado:', repartidores.find(r => r.id === repartidorId)?.nombre);
        // console.log('========================');

        // Validar que existe el repartidor_id
        if (!repartidorId || !repartidores.some(r => r.id === repartidorId)) {
          console.error('Error: ID del repartidor inválido');
          // console.log('ID del repartidor buscado:', repartidorId);
          // console.log('Lista de repartidores disponibles:', repartidores.map(r => ({ id: r.id, nombre: r.nombre })));
          throw new Error('Por favor selecciona un repartidor válido');
        }

        // Guardar nueva carga
        let fechaCarga;
        if (formData.fecha === localToday) {
          // Si es hoy, agrega la hora actual
          const horaActual = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          fechaCarga = `${formData.fecha}T${horaActual}:00`;
        } else {
          // Si no es hoy, solo la fecha y hora 00:00
          fechaCarga = `${formData.fecha}T00:00:00`;
        }

        const nuevaCarga = {
          fecha: fechaCarga,
          repartidor_id: repartidorId,
          items: formData.productos
            .filter(p => {
              const productoInfo = productos.find(prod => prod.id === p.id);
              const isSifon = productoInfo?.nombreProducto?.toLowerCase().includes('sifon') || false;
              
              if (isSifon) {
                // Para sifones, sumamos cajones y unidades
                const totalUnidades = (p.cajonesLlenos || 0) * 6 + (p.unidadesLlenas || 0);
                return totalUnidades > 0;
              } else {
                // Para otros productos, usamos cantidadCarga
                return (p.cantidadCarga || 0) > 0;
              }
            })
            .map(p => {
              const productoInfo = productos.find(prod => prod.id === p.id);
              const isSifon = productoInfo?.nombreProducto?.toLowerCase().includes('sifon') || false;
              
              if (isSifon) {
                // Para sifones, calculamos el total de unidades
                const totalUnidades = (p.cajonesLlenos || 0) * 6 + (p.unidadesLlenas || 0);
                return {
                  producto_id: p.id,
                  cantidad: totalUnidades
                };
              } else {
                // Para otros productos, usamos cantidadCarga
                return {
                  producto_id: p.id,
                  cantidad: p.cantidadCarga || 0
                };
              }
            }),
          estado: "pendiente"
        };

        console.log('=== DATOS DE LA CARGA A ENVIAR ===');
        console.log('URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/cargas`);
        console.log('Método:', 'POST');
        console.log('Headers:', { 'Content-Type': 'application/json' });
        console.log('Datos:', JSON.stringify(nuevaCarga, null, 2));
        console.log('===============================');

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cargas`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevaCarga)
          });

          // console.log('=== RESPUESTA DEL SERVIDOR ===');
          // console.log('Status:', response.status);
          // console.log('Status Text:', response.statusText);
          // console.log('Headers:', Object.fromEntries(response.headers.entries()));

          const responseText = await response.text();
          // console.log('Respuesta completa:', responseText);

          if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
              // Intentar parsear como JSON si es posible
              const errorData = JSON.parse(responseText);
              errorMessage += `\nDetalles: ${JSON.stringify(errorData)}`;
            } catch {
              // Si no es JSON, usar el texto plano
              errorMessage += `\nDetalles: ${responseText}`;
            }
            throw new Error(errorMessage);
          }

          // console.log('=== OPERACIÓN EXITOSA ===');
          // console.log('La carga se guardó correctamente');
          // console.log('========================');

        } catch (fetchError) {
          console.error('=== ERROR EN LA PETICIÓN ===');
          console.error('Error completo:', fetchError);
          console.error('========================');
          throw fetchError;
        }

      } else {
        // Guardar descarga vinculada a la carga
        // Asegurarse de que el repartidor_id sea válido
        const repartidorId = cargaSeleccionada?.repartidor_id || parseInt(formData.repartidor);
        
        if (!repartidorId) {
          console.error('Error: No se pudo obtener el ID del repartidor');
          console.error('Carga seleccionada:', cargaSeleccionada);
          console.error('Form data:', formData);
          throw new Error('No se pudo obtener el ID del repartidor para la descarga');
        }

        // Validar que la carga exista y tenga un ID válido
        if (!cargaSeleccionada?.id) {
          console.error('Error: No se pudo obtener el ID de la carga');
          console.error('Carga seleccionada:', cargaSeleccionada);
          throw new Error('No se pudo obtener el ID de la carga para la descarga');
        }

        // Obtener los productos de la carga original para validación
        const productosCarga = cargaSeleccionada.items || [];
        // console.log('Productos en la carga original:', productosCarga);
        
        // Preparar los arrays de productos para la descarga
        const productosDevueltos = formData.productos
          .filter(p => (p.cantidadLlenos || 0) > 0)
          .map(p => ({
            producto_id: p.id,
            cantidad: p.cantidadLlenos || 0
          }));
          
        const envasesRecuperados = formData.productos
          .filter(p => (p.cantidadVacios || 0) > 0)
          .map(p => ({
            producto_id: p.id,
            cantidad: p.cantidadVacios || 0
          }));
        
        // Validar que no se estén devolviendo más productos de los que se cargaron
        let errorValidacion = '';
        productosDevueltos.forEach(prod => {
          const productoCarga = productosCarga.find(p => p.producto_id === prod.producto_id);
          if (!productoCarga) {
            errorValidacion = `El producto ID ${prod.producto_id} no estaba en la carga original`;
            console.error(errorValidacion);
          } else if (prod.cantidad > productoCarga.cantidad) {
            errorValidacion = `No puede devolver más productos (${prod.cantidad}) de los que se cargaron (${productoCarga.cantidad}) para el producto ID ${prod.producto_id}`;
            console.error(errorValidacion);
          }
        });
        
        if (errorValidacion) {
          throw new Error(errorValidacion);
        }
        
        const descarga = {
          repartidor_id: repartidorId,
          carga_id: cargaSeleccionada.id,
          productos_devueltos: productosDevueltos,
          envases_recuperados: envasesRecuperados,
          observaciones: `Descarga de productos de ${repartidores.find(r => r.id === repartidorId)?.nombre || 'Repartidor'}`
        };

        // Verificar que los arrays no estén vacíos
        if (descarga.productos_devueltos.length === 0 && descarga.envases_recuperados.length === 0) {
          throw new Error("No hay productos ni envases para descargar. Debe ingresar al menos un valor.");
        }

        // console.log('=== DATOS DE LA DESCARGA A ENVIAR ===');
        // console.log('URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/descargas`);
        // console.log('Método:', 'POST');
        // console.log('Headers:', { 'Content-Type': 'application/json' });
        // console.log('Datos:', JSON.stringify(descarga, null, 2));
        // console.log('===============================');

        try {
          const responseDescarga = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/descargas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(descarga)
          });

          // console.log('Respuesta del servidor:', responseText);
          
          // let errorDetail = '';
          // try {
          //   // Intentar parsear como JSON
          //   const responseJson = JSON.parse(responseText);
          //   errorDetail = responseJson.message || responseJson.error || responseText;
          // } catch (e) {
          //   // Si no es JSON, usar el texto tal cual
          //   errorDetail = responseText;
          // }

          // if (!responseDescarga.ok) {
          //   throw new Error(`Error al guardar la descarga: ${responseDescarga.status} ${responseDescarga.statusText} - ${errorDetail}`);
          // }

          // console.log('Descarga guardada correctamente');

          // Después de guardar la descarga, necesitamos actualizar el estado de la carga a 'completada'
          // Esto es necesario porque una carga con descarga ya registrada debe marcarse como completada
          // console.log(`Actualizando estado de carga ${cargaSeleccionada?.id} a completada`);
          
          // Intentar actualizar el estado de la carga usando la ruta principal de cargas
          try {
            // La ruta para actualizar una carga completa
            const rutaActualizacionCarga = `${process.env.NEXT_PUBLIC_API_URL}/api/cargas/${cargaSeleccionada.id}`;
            // console.log('URL para actualización de carga:', rutaActualizacionCarga);
            // console.log('Método:', 'PUT');
            // console.log('Datos:', JSON.stringify({ estado: 'completada' }));
            
            const responseCarga = await fetch(rutaActualizacionCarga, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ estado: 'completada' })
            });

            const responseText = await responseCarga.text();
            // console.log('Respuesta de actualización de carga:', responseText);

            if (!responseCarga.ok) {
              console.error(`Error al actualizar estado de la carga: ${responseCarga.status} ${responseCarga.statusText}`);
              console.error('Detalles del error:', responseText);
              // No lanzamos error aquí para que al menos la descarga se guarde
            } else {
              // console.log('Estado de carga actualizado correctamente a "completada"');
            }
          } catch (error) {
            console.error('Error al actualizar el estado de la carga:', error);
            // console.log('La descarga se guardó correctamente, pero no se pudo actualizar el estado de la carga');
            // No propagamos este error para que no afecte al flujo principal
          }
        } catch (error) {
          console.error('Error al procesar la descarga:', error);
          throw error;
        }
      }

      // console.log('=== RESUMEN DE OPERACIÓN ===');
      // console.log(`Repartidor: ${formData.repartidor}`);
      // console.log(`Fecha: ${formData.fecha}`);
      // console.log('\nDiferencias por producto:');
      // reporteTemp.productos.forEach((producto: ProductoReporte): void => {
      //   const cantidadLlenos = typeof producto.llenos === 'number' ? producto.llenos : producto.llenos?.total || 0;
      //   const cantidadVacios = typeof producto.vacios === 'number' ? producto.vacios : producto.vacios?.total || 0;
      //   
      //   console.log(`\nProducto: ${producto.producto}`);
      //   console.log(`Carga inicial: ${producto.total || producto.cantidad || 0} unidades`);
      //   console.log(`Descarga total: ${cantidadLlenos + cantidadVacios} unidades`);
      //   console.log(`Ventas realizadas: ${cantidadLlenos} unidades`);
      // });
      // console.log('\n=========================');

      // Limpiar el formulario después de una operación exitosa
        setFormData({
        fecha: localToday,
          repartidor: '',
          productos: productos.map(p => ({
            id: p.id,
            cantidadCarga: 0,
            cajonesLlenos: 0,
            unidadesLlenas: 0,
            cajonesVacios: 0,
            unidadesVacias: 0,
            cantidadLlenos: 0,
            cantidadVacios: 0
          }))
        });
      
      // Limpiar la carga seleccionada si estamos en modo descarga
      if (!isCarga) {
        setCargaSeleccionada(null);
      }
      
      // Mostrar mensaje de éxito
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Actualizar cargas pendientes en tiempo real después de una descarga
      if (!isCarga && repartidorSeleccionado) {
        fetchCargasPendientes(repartidorSeleccionado);
      }
      
      setIsLoadingRepartidores(false);
      setIsModalOpen(false);

    } catch (error) {
      setIsModalOpen(false);
      if (error instanceof Error) {
        handleError(error.message);
      } else {
        handleError('Hubo un error al guardar los datos. Por favor, intente nuevamente.');
      }
    }
  };

  // Modificar la función formatearFecha para incluir validación
  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'Fecha no disponible';
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  // Agregar una función para formatear la hora
  const formatearHora = (hora: string | undefined) => {
    if (!hora) return '';
    // Asumiendo que la hora viene en formato HH:MM:SS
    const [horas, minutos] = hora.split(':');
    return `${horas}:${minutos}`;
  };

  // Agregar esta función para manejar la selección de productos adicionales
  const handleAgregarProducto = (productoId: string) => {
    if (productoId) {
      const id = parseInt(productoId);
      if (!productosSeleccionados.includes(id)) {
        setProductosSeleccionados([...productosSeleccionados, id]);
      }
    }
  };

  // Agregar esta función para manejar la eliminación de productos
  const handleRemoveProduct = (productId: number) => {
    // Actualizar la lista de productos seleccionados
    setProductosSeleccionados(prev => prev.filter(id => id !== productId));
    
    // Resetear los valores del producto en el formData
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            cantidadCarga: 0,
            cajonesLlenos: 0,
            unidadesLlenas: 0,
            cajonesVacios: 0,
            unidadesVacias: 0,
            cantidadLlenos: 0,
            cantidadVacios: 0
          };
        }
        return p;
      })
    }));
  };

  // Modificar el useEffect que maneja la selección de carga
  const handleCargaSelection = (carga: CargaRepartidor) => {
    setCargaSeleccionada(carga);
    // Actualizar los productos seleccionados para mostrar solo los de la carga
    const productosEnCarga = carga.items.map(item => item.producto_id);
    setProductosSeleccionados(productosEnCarga);
    
    setFormData(prev => ({
      ...prev,
      repartidor: repartidores.find(r => r.id === carga.repartidor_id)?.nombre || '',
      productos: productos.map(p => ({
        id: p.id,
        cantidadCarga: carga.items.find(item => item.producto_id === p.id)?.cantidad || 0,
        cajonesLlenos: 0,
        unidadesLlenas: 0,
        cajonesVacios: 0,
        unidadesVacias: 0,
        cantidadLlenos: 0,
        cantidadVacios: 0,
        esProductoRecuperado: !productosEnCarga.includes(p.id) // Nuevo campo para identificar productos adicionales
      }))
    }));
  };

  const handleEliminarCarga = (carga: CargaRepartidor) => {
    setCargaAEliminar(carga);
    setIsModalEliminarCargaOpen(true);
  };

  const confirmarEliminarCarga = async () => {
    if (!cargaAEliminar) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cargas/pendientes/${cargaAEliminar.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Error al eliminar la carga');
      }
      setIsModalEliminarCargaOpen(false);
      setCargaAEliminar(null);
      if (repartidorSeleccionado) {
        fetchCargasPendientes(repartidorSeleccionado);
      }
    } catch (error) {
      setIsModalEliminarCargaOpen(false);
      setCargaAEliminar(null);
      handleError('No se pudo eliminar la carga.');
    }
  };

  return (
    <>
      <div className="flex justify-center items-start w-full min-h-screen bg-blue-500 bg-gradient-to-b from-background to-default-100">
        <div className="w-full min-w-[300px] max-w-[900px] px-4 bg-none ">

          <Card className={`w-full ${
            isCarga ? 'bg-green-100' : 'bg-rose-100'
          }`}>
            <CardHeader className={`flex flex-col gap-2 p-4 ${
              isCarga ? 'bg-green-200' : 'bg-rose-200'
            }`}>
              <h1 className="text-2xl font-bold text-center md:text-4xl">
                {isCarga ? 'Control de Carga' : 'Control de Descarga'}
              </h1>
              <div className="flex gap-3 justify-center items-center">
                <span className="text-base md:text-lg">Carga</span>
                <label className="inline-flex relative items-center cursor-pointer" htmlFor="switch">
                  <input 
                    id="switch" 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={!isCarga}
                    onChange={toggleMode}
                  />
                  <label htmlFor="switch" className="sr-only">
                    {isCarga ? 'Cambiar a descarga' : 'Cambiar a carga'}
                  </label>
                  <div className="peer h-6 w-11 rounded-full border bg-slate-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-green-300"></div>
                </label>
                <span className="text-base md:text-lg">Descarga</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
                  {/* Fecha */}
                  {isCarga ? (
                    <Input
                      type="date"
                      label="Fecha"
                      value={formData.fecha}
                      onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                      className="w-full text-base md:text-lg"
                    />
                  ) : (
                    cargaSeleccionada && (
                      <Input
                        type="date"
                        label="Fecha de la carga"
                        value={cargaSeleccionada.fecha_carga.split('T')[0]}
                        disabled
                        className="w-full text-base md:text-lg"
                      />
                    )
                  )}

                  {/* Selector de Repartidor */}
                  {!isCarga ? (
                    <div className="flex flex-col gap-4">
                  <Select
                    label="Repartidor"
                        placeholder={isLoadingRepartidores ? "Cargando repartidores..." : "Selecciona un repartidor"}
                        value={repartidorSeleccionado}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          setRepartidorSeleccionado(selectedId);
                          if (selectedId) {
                            fetchCargasPendientes(selectedId);
                          } else {
                            setCargasPendientes([]);
                          }
                        }}
                      >
                        {repartidores.map((repartidor) => (
                          <SelectItem key={repartidor.id} value={repartidor.id.toString()}>
                            {repartidor.nombre}
                          </SelectItem>
                        ))}
                      </Select>

                      {repartidorSeleccionado && (
                        <>
                          <div className="flex gap-2 items-center">
                            <Select
                              label="Seleccionar Carga Pendiente"
                              placeholder={cargasPendientes.length === 0 ? "No hay cargas pendientes" : "Selecciona una carga"}
                              value={cargaSeleccionada?.id.toString() || ""}
                              onChange={(e) => {
                                const carga = cargasPendientes.find(c => c.id.toString() === e.target.value);
                                if (carga) {
                                  handleCargaSelection(carga);
                                }
                              }}
                              className="flex-1"
                            >
                              {cargasPendientes.map(carga => {
                                const [fechaStr, horaStr] = carga.fecha_carga.split(' ');
                                // fechaStr: "2025-04-24", horaStr: "23:30:00"
                                const [anio, mes, dia] = fechaStr.split('-');
                                const horaFormateada = horaStr ? horaStr.slice(0,5) : '';
                                const fechaFormateada = `${dia}-${mes}-${anio}`;
                                const totalUnidades = carga.items.reduce((sum, item) => sum + item.cantidad, 0);
                                return (
                                  <SelectItem key={carga.id} value={carga.id.toString()}>
                                    {`Carga del ${fechaFormateada} a las ${horaFormateada} - ${totalUnidades} unidades`}
                                  </SelectItem>
                                );
                              })}
                            </Select>
                            <Button
                              color="danger"
                              isIconOnly
                              className="ml-2"
                              onClick={() => setMostrarListaEliminar(v => !v)}
                              title="Eliminar cargas pendientes"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </Button>
                          </div>
                          {/* Lista de cargas pendientes con botón de eliminar, solo si mostrarListaEliminar es true */}
                          {mostrarListaEliminar && cargasPendientes.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {cargasPendientes.map(carga => {
                                const totalUnidades = carga.items.reduce((sum, item) => sum + item.cantidad, 0);
                                const [fechaStr, horaStr] = carga.fecha_carga.split('T');
                                const fechaFormateada = formatearFecha(fechaStr);
                                const horaFormateada = horaStr ? horaStr.slice(0,5) : '';
                                return (
                                  <div key={carga.id} className="flex justify-between items-center px-2 py-1 text-sm bg-gray-50 rounded">
                                    <span>
                                      {`Carga del ${fechaFormateada} a las ${horaFormateada} - ${totalUnidades} unidades`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarCarga(carga)}
                                      className="ml-2 text-lg font-bold text-red-500 transition-colors duration-150 hover:text-red-700 focus:outline-none"
                                      title="Eliminar carga"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <Select
                      label="Repartidor"
                      placeholder={isLoadingRepartidores ? "Cargando repartidores..." : "Selecciona un repartidor"}
                    value={formData.repartidor}
                    onChange={(e) => setFormData({...formData, repartidor: e.target.value})}
                    >
                      {repartidores.map((repartidor) => (
                        <SelectItem key={repartidor.id} value={repartidor.id.toString()}>
                          {repartidor.nombre}
                      </SelectItem>
                    ))}
                  </Select>
                  )}
                </div>

                {/* Tabla de Productos */}
                {isCarga || cargaSeleccionada ? (
                  <div className="overflow-x-auto mt-6">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 text-left">Producto</th>
                          {isCarga ? (
                            <th className="p-2 w-32 text-center">
                              Cantidad
                            </th>
                          ) : (
                            <>
                              <th className="p-2 w-1/4 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-semibold text-green-600">Llenos</span>
                                </div>
                              </th>
                              <th className="p-2 w-1/4 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-semibold text-blue-600">Vacíos</span>
                                </div>
                              </th>
                              <th className="p-2 w-1/4 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-semibold text-red-600">Faltantes</span>
                                  <span className="text-xs text-gray-500">(Diferencia)</span>
                                </div>
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingProductos ? (
                          <tr>
                            <td colSpan={isCarga ? 2 : 4} className="p-4 text-center">
                              Cargando productos...
                            </td>
                          </tr>
                        ) : (
                          productos
                            .filter(producto => productosSeleccionados.includes(producto.id))
                            .map((producto) => {
                              const formProduct = formData.productos.find(p => p.id === producto.id) || {
                                id: producto.id,
                                cantidadCarga: 0,
                                cajonesLlenos: 0,
                                unidadesLlenas: 0,
                                cajonesVacios: 0,
                                unidadesVacias: 0,
                                cantidadLlenos: 0,
                                cantidadVacios: 0
                              };

                              const isSoda = producto?.nombreProducto?.toLowerCase().includes('sifon') || false;
                              const faltantes = isCarga ? 0 : 
                                (formProduct.cantidadCarga || 0) - 
                                ((formProduct.cantidadLlenos || 0) + (formProduct.cantidadVacios || 0));

                              return (
                                <tr key={producto.id} className="border-b hover:bg-gray-50">
                                  <td className="p-2">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="font-medium">{producto.nombreProducto}</div>
                                        {!isCarga && (
                                          <div className="text-sm font-bold text-gray-500">
                                            Carga inicial: {formProduct.cantidadCarga}
                                          </div>
                                        )}
                                      </div>
                                      {producto.id > 4 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveProduct(producto.id)}
                                          className="p-1 text-gray-500 transition-colors hover:text-red-500"
                                        >
                                          <svg 
                                            className="w-5 h-5" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                          >
                                            <path 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round" 
                                              strokeWidth={2} 
                                              d="M6 18L18 6M6 6l12 12" 
                                            />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  {isCarga ? (
                                    <td className="p-2">
                                      {isSoda ? (
                                        <div className="flex flex-col gap-2">
                                          <div className="flex flex-col">
                                            <div className="flex-1">
                                              <label htmlFor={`cajones-carga-${producto.id}`} className="text-xs font-medium text-gray-600">
                                                Cajones (x6):
                                              </label>
                                              <Input
                                                id={`cajones-carga-${producto.id}`}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={(formProduct.cajonesLlenos ?? 0) === 0 ? "" : (formProduct.cajonesLlenos ?? 0).toString()}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  handleProductChange(
                                                    producto.id,
                                                    'cajonesLlenos',
                                                    value === "" ? 0 : parseInt(value) || 0,
                                                    true
                                                  );
                                                }}
                                                className="w-full"
                                                size="sm"
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <label htmlFor={`unidades-carga-${producto.id}`} className="text-xs font-medium text-gray-600">
                                                Unidades:
                                              </label>
                                              <Input
                                                id={`unidades-carga-${producto.id}`}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={(formProduct.unidadesLlenas ?? 0) === 0 ? "" : (formProduct.unidadesLlenas ?? 0).toString()}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  handleProductChange(
                                                    producto.id,
                                                    'unidadesLlenas',
                                                    value === "" ? 0 : parseInt(value) || 0,
                                                    true
                                                  );
                                                }}
                                                className="w-full"
                                                size="sm"
                                              />
                                            </div>
                                          </div>
                                          <div className="font-medium text-center text-gray-600 text-m">
                                            Total: {(formProduct.cajonesLlenos || 0) * 6 + (formProduct.unidadesLlenas || 0)} unidades
                                          </div>
                                        </div>
                                      ) : (
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          value={(formProduct.cantidadCarga ?? 0) === 0 ? "" : (formProduct.cantidadCarga ?? 0).toString()}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            handleProductChange(
                                              producto.id,
                                              'cantidadCarga',
                                              value === "" ? 0 : parseInt(value) || 0
                                            );
                                          }}
                                          className="w-full"
                                          size="sm"
                                        />
                                      )}
                                    </td>
                                  ) : (
                                    <>
                                      <td className="p-2">
                                        {isSoda ? (
                                          <div className="flex flex-col gap-2">
                                            <div className="flex flex-col">
                                              <label htmlFor={`cajones-llenos-${producto.id}`} className="text-xs font-medium text-green-600">
                                                Cajones Llenos (x6):
                                              </label>
                                              <Input
                                                id={`cajones-llenos-${producto.id}`}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={(formProduct.cajonesLlenos ?? 0) === 0 ? "" : (formProduct.cajonesLlenos ?? 0).toString()}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  handleProductChange(
                                                    producto.id,
                                                    'cajonesLlenos',
                                                    value === "" ? 0 : parseInt(value) || 0,
                                                    true
                                                  );
                                                }}
                                                className="w-full border-green-200 focus:border-green-500"
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label htmlFor={`unidades-llenas-${producto.id}`} className="text-xs font-medium text-green-600">
                                                Unidades Llenas:
                                              </label>
                                              <Input
                                                id={`unidades-llenas-${producto.id}`}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={(formProduct.unidadesLlenas ?? 0) === 0 ? "" : (formProduct.unidadesLlenas ?? 0).toString()}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  handleProductChange(
                                                    producto.id,
                                                    'unidadesLlenas',
                                                    value === "" ? 0 : parseInt(value) || 0,
                                                    true
                                                  );
                                                }}
                                                className="w-full border-green-200 focus:border-green-500"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={(formProduct.cantidadLlenos ?? 0) === 0 ? "" : (formProduct.cantidadLlenos ?? 0).toString()}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              handleProductChange(
                                                producto.id,
                                                'cantidadLlenos',
                                                value === "" ? 0 : parseInt(value) || 0
                                              );
                                            }}
                                            className="w-full"
                                            size="sm"
                                          />
                                        )}
                                      </td>
                                      <td className="p-2">
                                        {isSoda ? (
                                          <div className="flex flex-col gap-2">
                                            <div className="flex flex-col">
                                              <label htmlFor={`cajones-vacios-${producto.id}`} className="text-xs font-medium text-blue-600">
                                                Cajones Vacios:
                                              </label>
                                              <Input
                                                id={`cajones-vacios-${producto.id}`}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={(formProduct.cajonesVacios ?? 0) === 0 ? "" : (formProduct.cajonesVacios ?? 0).toString()}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  handleProductChange(
                                                    producto.id,
                                                    'cajonesVacios',
                                                    value === "" ? 0 : parseInt(value) || 0,
                                                    true
                                                  );
                                                }}
                                                className="w-full border-blue-200 focus:border-blue-500"
                                              />
                                            </div>
                                            <div className="flex flex-col">
                                              <label htmlFor={`unidades-vacias-${producto.id}`} className="text-xs font-medium text-blue-600">
                                                Unidades Vacias:
                                              </label>
                                              <Input
                                                id={`unidades-vacias-${producto.id}`}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={(formProduct.unidadesVacias ?? 0) === 0 ? "" : (formProduct.unidadesVacias ?? 0).toString()}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  handleProductChange(
                                                    producto.id,
                                                    'unidadesVacias',
                                                    value === "" ? 0 : parseInt(value) || 0,
                                                    true
                                                  );
                                                }}
                                                className="w-full border-blue-200 focus:border-blue-500"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={(formProduct.cantidadVacios ?? 0) === 0 ? "" : (formProduct.cantidadVacios ?? 0).toString()}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              handleProductChange(
                                                producto.id,
                                                'cantidadVacios',
                                                value === "" ? 0 : parseInt(value) || 0
                                              );
                                            }}
                                            className="w-full"
                                            size="sm"
                                          />
                                        )}
                                      </td>
                                      <td className="p-2">
                                        {faltantes > 0 ? (
                                          <div className="text-red-600">
                                            {faltantes} unidades
                                        </div>
                                        ) : (
                                          <div className="text-gray-500">
                                            {faltantes} unidades
                                          </div>
                                        )}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-6 text-center text-gray-500">
                    Selecciona una carga pendiente para ver los productos.
                  </div>
                )}

                {isCarga || cargaSeleccionada ? (
                  <div className="mb-4">
                    <Select
                      label="Agregar otro producto"
                      placeholder={productos.filter(p => !productosSeleccionados.includes(p.id)).length === 0 
                        ? "No hay productos para agregar" 
                        : "Seleccionar producto adicional"}
                      onChange={(e) => handleAgregarProducto(e.target.value)}
                    >
                      {(!isCarga ? productos : productosAdicionales)
                        .filter(producto => !productosSeleccionados.includes(producto.id))
                        .map((producto) => (
                          <SelectItem 
                            key={producto.id} 
                            value={producto.id.toString()}
                          >
                            {producto.nombreProducto}
                          </SelectItem>
                        ))
                      }
                    </Select>
                  </div>
                ) : null}

                <div className="mt-6">
                  <Button type="submit" className="w-full">
                  {isCarga ? 'Guardar Carga' : 'Guardar Descarga'}
                </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal 
        isOpen={isAlertOpen} 
        onOpenChange={onAlertClose}
        size="sm"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Atención
              </ModalHeader>
              <ModalBody>
                <p>{alertMessage}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Aceptar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        size="lg"
      >
        <ModalContent>
          {(onClose) => {
            // Busca el repartidor por ID
            const repartidorEncontrado = repartidores.find(r => r.id === parseInt(formData.repartidor));
            const nombreRepartidor = repartidorEncontrado ? repartidorEncontrado.nombre : 'Desconocido';

            return (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirmar {isCarga ? 'Carga' : 'Descarga'}
              </ModalHeader>
              <ModalBody>
                <p>¿Estás seguro de que deseas guardar esta {isCarga ? 'carga' : 'descarga'}?</p>
                <p className="text-sm text-gray-600">
                    Repartidor: <span className="font-medium">{formData.repartidor}</span>
                </p>
                <p className="text-sm text-gray-600">
                    Fecha: <span className="font-medium">{formatearFecha(formData.fecha)}</span>
                </p>
                {formData.fecha === localToday && (
                  <p className="text-sm text-gray-600">
                      Hora: <span className="font-medium">{formatearHora(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))}</span>
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={confirmarGuardado}>
                  Confirmar
                </Button>
              </ModalFooter>
            </>
            );
          }}
        </ModalContent>
      </Modal>

      {/* @ts-ignore */}
      <AnimatePresence mode="wait">
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex fixed inset-0 z-50 justify-center items-center bg-green-500/95"
          >
            <div className="p-8 text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <svg 
                  className="mx-auto w-24 h-24"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-4 text-4xl font-bold"
              >
                ¡{isCarga ? 'Carga' : 'Descarga'} Exitosa!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl"
              >
                La {isCarga ? 'carga' : 'descarga'} ha sido guardada correctamente
              </motion.p>
            </div>
          </motion.div>
        )}
        {showError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex fixed inset-0 z-50 justify-center items-center bg-red-500/95"
          >
            <div className="p-8 text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <svg 
                  className="mx-auto w-24 h-24"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-4 text-4xl font-bold"
              >
                ¡Error!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl"
              >
                {errorMessage}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showError && (
        <div className="fixed top-0 right-0 left-0 p-4 text-white bg-red-500">
          {errorMessage}
        </div>
      )}

      {/* Modal de confirmación de cambio de modo */}
      <Modal 
        isOpen={isModalCambioModoOpen} 
        onOpenChange={setIsModalCambioModoOpen}
        size="sm"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirmar cambio
              </ModalHeader>
              <ModalBody>
                <p>¿Estás seguro que deseas abandonar la descarga actual y crear una nueva carga?</p>
                <p className="text-sm text-gray-600">
                  Los datos no guardados se perderán.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={cambiarModo}>
                  Confirmar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={isModalEliminarCargaOpen} 
        onOpenChange={setIsModalEliminarCargaOpen}
        size="sm"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirmar eliminación
              </ModalHeader>
              <ModalBody>
                <p>¿Estás seguro que deseas eliminar esta carga pendiente?</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={confirmarEliminarCarga}>
                  Eliminar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ControlCargaPage;