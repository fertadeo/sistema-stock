'use client'
import React, { useState } from 'react'
import "@/styles/globals.css"
import {Card, CardBody, CardHeader, Input, Button, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react"
import repartidores from '@/components/soderia-data/repartidores.json'
import productos from '@/components/soderia-data/productos.json'
import { motion, AnimatePresence } from "framer-motion"

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

const ControlCargaPage = () => {
  const [isCarga, setIsCarga] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<OrderForm>({
    fecha: today,
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reporteTemp, setReporteTemp] = useState<any>(null);
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const [alertMessage, setAlertMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    setIsCarga(!isCarga);
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
        const isSifon = productoInfo?.Producto.toLowerCase().includes('sifon');

        if (isCarga) {
          if (isSifon) {
            return {
              producto: productoInfo?.Producto,
              cajones: Math.floor((producto.cantidadCarga || 0) / 6),
              unidades: (producto.cantidadCarga || 0) % 6,
              total: producto.cantidadCarga
            };
          }
          return {
            producto: productoInfo?.Producto,
            cantidad: producto.cantidadCarga
          };
        } else {
          if (isSifon) {
            return {
              producto: productoInfo?.Producto,
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
            producto: productoInfo?.Producto,
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

    // Validar que haya al menos un producto con cantidad
    if (reporte.productos.length === 0) {
      showAlert('Debes cargar al menos un producto');
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

  const confirmarGuardado = () => {
    try {
      // Simulamos un error aleatorio (30% de probabilidad de error)
      if (Math.random() < 0.3) {
        throw new Error("Error de conexión con el servidor");
      }

      console.log('=== REPORTE DE ' + reporteTemp.tipo + ' ===');
      console.log('Fecha:', reporteTemp.fecha);
      console.log('Repartidor:', reporteTemp.repartidor);
      console.log('Productos:', reporteTemp.productos);
      console.log('========================');

      setIsModalOpen(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          fecha: today,
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
      }, 3000);
    } catch (error) {
      setIsModalOpen(false);
      if (error instanceof Error) {
        handleError(error.message);
      } else {
        handleError('Hubo un error al guardar los datos. Por favor, intente nuevamente.');
      }
    }
  };

  return (
    <>
      <div className="flex justify-center w-full min-h-screen bg-gradient-to-b from-background to-default-100">
        <div className="w-full min-w-[300px] max-w-[900px] px-4">
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
                    onChange={() => setIsCarga(!isCarga)}
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
                  <Input
                    type="date"
                    label="Fecha"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full text-base md:text-lg"
                  />

                  {/* Selector de Repartidor */}
                  <Select
                    label="Repartidor"
                    placeholder="Selecciona un repartidor"
                    value={formData.repartidor}
                    onChange={(e) => setFormData({...formData, repartidor: e.target.value})}
                    className="text-base md:text-lg"
                  >
                    {repartidores.repartidores.map((repartidor, index) => (
                      <SelectItem key={index} value={repartidor}>
                        {repartidor}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Tabla de Productos */}
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
                      {productos.map((producto) => {
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

                        const isSoda = producto.Producto.toLowerCase().includes('sifon');
                        const faltantes = isCarga ? 0 : 
                          (formProduct.cantidadCarga || 0) - 
                          ((formProduct.cantidadLlenos || 0) + (formProduct.cantidadVacios || 0));

                        return (
                          <tr key={producto.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div className="font-medium">{producto.Producto}</div>
                              {!isCarga && (
                                <div className="text-xs text-gray-500">
                                  Carga inicial: {formProduct.cantidadCarga}
                                </div>
                              )}
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
                                          value={Math.floor((formProduct.cantidadCarga || 0) / 6).toString()}
                                          onChange={(e) => {
                                            const cajones = parseInt(e.target.value) || 0;
                                            const unidades = formProduct.cantidadCarga ? formProduct.cantidadCarga % 6 : 0;
                                            handleProductChange(
                                              producto.id,
                                              'cantidadCarga',
                                              (cajones * 6) + unidades
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
                                          max="5"
                                          value={((formProduct.cantidadCarga || 0) % 6).toString()}
                                          onChange={(e) => {
                                            const unidades = parseInt(e.target.value) || 0;
                                            const cajones = formProduct.cantidadCarga ? Math.floor(formProduct.cantidadCarga / 6) : 0;
                                            handleProductChange(
                                              producto.id,
                                              'cantidadCarga',
                                              (cajones * 6) + unidades
                                            );
                                          }}
                                          className="w-full"
                                          size="sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-center text-gray-600">
                                      Total: {formProduct.cantidadCarga || 0} unidades
                                    </div>
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={formProduct.cantidadCarga?.toString() || "0"}
                                    onChange={(e) => handleProductChange(producto.id, 'cantidadCarga', parseInt(e.target.value) || 0)}
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
                                          value={formProduct.cajonesLlenos?.toString() || "0"}
                                          onChange={(e) => handleProductChange(
                                            producto.id, 
                                            'cajonesLlenos', 
                                            parseInt(e.target.value) || 0, 
                                            true
                                          )}
                                          className="w-full border-green-200 focus:border-green-500"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label htmlFor={`unidades-llenas-${producto.id}`} className="text-xs font-medium text-green-600">
                                          Unidades:
                                        </label>
                                        <Input
                                          id={`unidades-llenas-${producto.id}`}
                                          type="number"
                                          min="0"
                                          max="5"
                                          value={formProduct.unidadesLlenas?.toString() || "0"}
                                          onChange={(e) => handleProductChange(
                                            producto.id, 
                                            'unidadesLlenas', 
                                            parseInt(e.target.value) || 0, 
                                            true
                                          )}
                                          className="w-full border-green-200 focus:border-green-500"
                                        />
                                      </div>
                                      <div className="text-sm font-medium text-gray-600">
                                        Total: {(formProduct.cajonesLlenos || 0) * 6 + (formProduct.unidadesLlenas || 0)} unidades
                                      </div>
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      min="0"
                                      value={formProduct.cantidadLlenos?.toString() || "0"}
                                      onChange={(e) => handleProductChange(
                                        producto.id, 
                                        'cantidadLlenos', 
                                        parseInt(e.target.value) || 0
                                      )}
                                      className="w-full"
                                    />
                                  )}
                                </td>
                                <td className="p-2">
                                  {isSoda ? (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex flex-col">
                                        <label htmlFor={`cajones-vacios-${producto.id}`} className="text-xs font-medium text-blue-600">
                                          Cajones Vacíos (x6):
                                        </label>
                                        <Input
                                          id={`cajones-vacios-${producto.id}`}
                                          type="number"
                                          min="0"
                                          value={formProduct.cajonesVacios?.toString() || "0"}
                                          onChange={(e) => handleProductChange(
                                            producto.id, 
                                            'cajonesVacios', 
                                            parseInt(e.target.value) || 0, 
                                            true
                                          )}
                                          className="w-full border-blue-200 focus:border-blue-500"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label htmlFor={`unidades-vacias-${producto.id}`} className="text-xs font-medium text-blue-600">
                                          Unidades:
                                        </label>
                                        <Input
                                          id={`unidades-vacias-${producto.id}`}
                                          type="number"
                                          min="0"
                                          max="5"
                                          value={formProduct.unidadesVacias?.toString() || "0"}
                                          onChange={(e) => handleProductChange(
                                            producto.id, 
                                            'unidadesVacias', 
                                            parseInt(e.target.value) || 0, 
                                            true
                                          )}
                                          className="w-full border-blue-200 focus:border-blue-500"
                                        />
                                      </div>
                                      <div className="text-sm font-medium text-gray-600">
                                        Total: {(formProduct.cajonesVacios || 0) * 6 + (formProduct.unidadesVacias || 0)} unidades
                                      </div>
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      min="0"
                                      value={formProduct.cantidadVacios?.toString() || "0"}
                                      onChange={(e) => handleProductChange(
                                        producto.id, 
                                        'cantidadVacios', 
                                        parseInt(e.target.value) || 0
                                      )}
                                      className="w-full"
                                    />
                                  )}
                                </td>
                                <td className={`p-2 text-center ${
                                  faltantes > 0 ? 'text-red-500' : 'text-green-500'
                                }`}>
                                  <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold">{faltantes}</span>
                                    <span className="text-xs">
                                      {faltantes > 0 ? 'Faltan envases' : 'Completo'}
                                    </span>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Button 
                  color="primary" 
                  type="submit"
                  size="lg"
                  className="mt-6"
                >
                  {isCarga ? 'Guardar Carga' : 'Guardar Descarga'}
                </Button>
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
          {(onClose) => (
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
                  Fecha: <span className="font-medium">{formData.fecha}</span>
                </p>
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
          )}
        </ModalContent>
      </Modal>

      <AnimatePresence>
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
    </>
  );
};

export default ControlCargaPage;