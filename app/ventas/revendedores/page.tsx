'use client';
import '../../../styles/globals.css'; 
import React, { useState, useEffect } from 'react';
import {Button, Input, Card, CardBody, CardHeader, Divider, Popover, PopoverTrigger, PopoverContent, Select, SelectItem, Alert } from "@heroui/react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { Calendar } from "@heroui/calendar";
import Link from "next/link";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "@react-types/calendar";
import revendedoresData from '../../../components/soderia-data/revendedores.json';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BudgetResume from '@/components/budgetResume';
import PDFContent from '@/components/PDFContent';
import CustomSelect from '@/components/shared/CustomSelect';

interface Product {
  nombreProducto: any;
  id: number;
  name: string;
  precioRevendedor: number;
  quantity: number;
}

interface BudgetResume {
  totalCajones: number;
  totalUnidades: number;
  totalGeneral: number;
}

interface Revendedor {
  id: number;
  nombre: string;
}

interface VentaData {
  revendedor_nombre: string;
  repartidor_id: string;
  productos: {
    producto_id: string;
    cantidad: number;
    precio_unitario: string;
    subtotal: string;
  }[];
  monto_total: string;
  medio_pago: string;
  forma_pago: string;
  saldo_monto: string;
}

export default function NuevaVenta() {
  const defaultDate = today(getLocalTimeZone());
  const [selectedDate, setSelectedDate] = useState<DateValue>(defaultDate);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedRevendedor, setSelectedRevendedor] = useState<string>("");
  const [budgetResume, setBudgetResume] = useState<BudgetResume>({
    totalCajones: 0,
    totalUnidades: 0,
    totalGeneral: 0
  });
  const invoiceRef = React.useRef(null);
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    type: 'error' | 'warning' | 'success' | 'primary';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'error',
    title: '',
    message: ''
  });
  const [showPDF, setShowPDF] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [revendedores, setRevendedores] = useState<Revendedor[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/productos`;
        // console.log('Llamando a la API en:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // console.log('Respuesta recibida del servidor:', data);

        const filteredProducts = data
          .filter((producto: { id: number }) => [8, 9].includes(producto.id))
          .map((producto: {
            id: number;
            nombreProducto: string;
            precioPublico: number;
            precioRevendedor: number;
            cantidadStock: number | null;
            descripcion: string | null;
          }) => ({
            id: producto.id,
            name: producto.nombreProducto || '',
            precioRevendedor: producto.precioRevendedor ?? 0,
            quantity: 0
          }));
        
        const allAvailableProducts = data.map((producto: {
          id: number;
          nombreProducto: string;
          precioPublico: number;
          precioRevendedor: number;
          cantidadStock: number | null;
          descripcion: string | null;
        }) => ({
          id: producto.id,
          name: producto.nombreProducto || '',
          precioRevendedor: producto.precioRevendedor ?? 0,
          quantity: 0
        }));

        setProducts(filteredProducts);
        setAllProducts(allAvailableProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${API_URL}/api/revendedores`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setRevendedores(data.revendedores);
        else setRevendedores([]);
      })
      .catch(() => setRevendedores([]));
  }, []);

  const handleAddProduct = (productId: string) => {
    const selectedProduct = allProducts.find(p => p.id === parseInt(productId));
    if (selectedProduct && !products.some(p => p.id === selectedProduct.id)) {
      setProducts([...products, {
        id: selectedProduct.id,
        name: selectedProduct.name,
        precioRevendedor: selectedProduct.precioRevendedor ?? 0,
        quantity: 0,
        nombreProducto: undefined
      }]);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleQuantityChange = (productId: number, value: number) => {
    // Validar que el valor no sea negativo
    if (value < 0) {
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se permiten valores negativos'
      });
      return;
    }

    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, quantity: value }
        : product
    ));

    // Actualizar resumen del presupuesto
    const updatedProducts = products.map(product =>
      product.id === productId ? { ...product, quantity: value } : product
    );

    const newResume = {
      totalCajones: updatedProducts.reduce((sum, product) => 
        sum + (product.name.toLowerCase().includes('soda') ? Math.floor(product.quantity / 6) : 0), 0),
      totalUnidades: updatedProducts.reduce((sum, product) => sum + product.quantity, 0),
      totalGeneral: updatedProducts.reduce((sum, product) => sum + (product.precioRevendedor * product.quantity), 0)
    };

    setBudgetResume(newResume);
  };

  // Agregar useEffect para manejar la limpieza del revendedor
  useEffect(() => {
    if (alertInfo.show && alertInfo.type === 'success') {
      // Forzar la limpieza del revendedor
      setSelectedRevendedor("");
      // También limpiar el select
      const selectElement = document.getElementById('revendedor') as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = "";
        // Disparar el evento change para forzar la actualización
        const event = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(event);
      }
    }
  }, [alertInfo]);

  const resetForm = () => {
    setIsResetting(true);
    setSelectedDate(defaultDate);
    setSelectedRevendedor(""); // Limpiar el estado
    // Mantener los productos pero resetear sus cantidades a cero
    setProducts(prevProducts => 
      prevProducts.map(product => ({
        ...product,
        quantity: 0
      }))
    );
    setBudgetResume({
      totalCajones: 0,
      totalUnidades: 0,
      totalGeneral: 0
    });
    setShowPDF(false);
    setAlertInfo({
      show: false,
      type: 'error',
      title: '',
      message: ''
    });
    setTimeout(() => {
      setIsResetting(false);
    }, 100);
  };

  const handleGenerateVenta = async () => {
    if (isGeneratingPDF) return; // Prevenir múltiples clicks

    // Validar campos requeridos
    if (!selectedRevendedor) {
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Debes seleccionar un revendedor'
      });
      return;
    }

    if (!selectedDate) {
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Debes seleccionar una fecha'
      });
      return;
    }

    // Verificar si hay productos con cantidad mayor a 0
    const productosConCantidad = products.filter(p => p.quantity > 0);
    if (productosConCantidad.length === 0) {
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Debes agregar al menos un producto.'
      });
      return;
    }

    try {
      setIsGeneratingPDF(true);

      // Obtener el nombre del revendedor seleccionado
      const revendedorSeleccionado = revendedores.find(r => r.id === parseInt(selectedRevendedor));
      
      if (!revendedorSeleccionado) {
        throw new Error('Revendedor no encontrado');
      }

      // Preparar los productos en el formato requerido
      const productosFormateados = products
        .filter(p => p.quantity > 0)
        .map(p => ({
          producto_id: p.id.toString(),
          cantidad: p.quantity,
          precio_unitario: p.precioRevendedor.toFixed(2),
          subtotal: (p.precioRevendedor * p.quantity).toFixed(2)
        }));

      // Preparar datos para la API
      const ventaData = {
        tipo: "REVENDEDOR",
        revendedor_nombre: revendedorSeleccionado.nombre,
        repartidor_id: "",
        productos: productosFormateados,
        monto_total: products
          .reduce((sum, p) => sum + (p.precioRevendedor * p.quantity), 0)
          .toFixed(2),
        medio_pago: "efectivo",
        forma_pago: "total",
        saldo_monto: "0.00"
      };

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/ventas`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ventaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la venta');
      }

      const savedVenta = await response.json();
      console.log('Respuesta recibida del servidor:', savedVenta);

      // Continuar con la generación del PDF...
      setShowPDF(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!invoiceRef.current) {
        throw new Error('No se pudo generar el contenido del PDF');
      }

      // Generar PDF...
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Crear el PDF
      const pdf = new jsPDF({
        format: 'a4',
        unit: 'mm'
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png', 1.0);

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');

      // Guardar el PDF
      pdf.save(`Venta-Revendedor-${revendedorSeleccionado.nombre}-${formatDate(selectedDate)}.pdf`);
      console.log("PDF generado");

      // Mostrar alerta de éxito
      setAlertInfo({
        show: true,
        type: 'success',
        title: 'Venta Exitosa',
        message: `La venta se ha registrado correctamente y el PDF ha sido generado.\nTotal: $${ventaData.monto_total}`
      });

      // Esperar 3 segundos antes de resetear el formulario
      setTimeout(() => {
        resetForm();
      }, 3000);

    } catch (error) {
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al procesar la venta'
      });
    } finally {
      setIsGeneratingPDF(false);
      setShowPDF(false);
    }
  };

  const selectedRevendedorIndex = parseInt(selectedRevendedor);
  const selectedRevendedorName = revendedoresData.revendedores[selectedRevendedorIndex] || 'Nombre no disponible';

  // console.log('Revendedor elegido:', selectedRevendedorName);
  // console.log('Nombre del revendedor seleccionado:', selectedRevendedor);
  // console.log('Datos de revendedores:', revendedoresData.revendedores);
  // console.log('RevendedoresData', revendedoresData);
  const formatDate = (date: DateValue) => {
    const day = String(date.day).padStart(2, '0');
    const month = String(date.month).padStart(2, '0');
    const year = date.year;

    return `${day}/${month}/${year}`;
  };

  return (
    <div className="container p-4 mx-auto">
      <div className="flex items-center mb-4">
        <Link href="/ventas">
        <Button
            color='secondary'
            variant="solid"
            className="flex items-center mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2 w-5 h-5">
              <path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver
          </Button>
        </Link>
        <div className="flex flex-grow justify-center items-center">
          <h1 className="text-2xl font-bold text-center">Detalles de la Venta</h1>
        </div>
      </div>

      <div className="mx-auto max-w-full">
        <Card className="p-6">
          <CardHeader>
    
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {/* Date Picker */}
              <div className="flex justify-between">
                <div className="flex items-center">
                  <label htmlFor="fecha" className="mr-2 text-xl font-bold">Fecha:</label>
                  <Popover isOpen={open} onOpenChange={setOpen}>
                    <PopoverTrigger>
                      <div className="relative flex-grow">
                        <div className="absolute left-2 top-1/2 z-10 transform -translate-y-1/2">
                          <CalendarIcon className="w-5 h-5 text-secondary" />
                        </div>
                        <Input
                          id="fecha"
                          variant="bordered"
                          color="secondary"
                          type="text"
                          value={formatDate(selectedDate)}
                          readOnly
                          placeholder="Selecciona una fecha"
                          className="pl-10 w-[200px]"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="transform" >
                      <Calendar
                        defaultValue={defaultDate}
                        value={ selectedDate}
                        onChange={(date: React.SetStateAction<DateValue>) => {
                          if (date) {
                            setSelectedDate(date);
                            setOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Revendedor */}
                <div className="flex items-center">
                  <label htmlFor="revendedor" className="mr-2 text-xl font-bold">Revendedor:</label>
                  <CustomSelect
                    value={selectedRevendedor}
                    onChange={(value) => setSelectedRevendedor(value)}
                    options={[
                      { value: "", label: "Elegir un revendedor" },
                      ...revendedores.map((rev) => ({
                        value: rev.id.toString(),
                        label: rev.nombre
                      }))
                    ]}
                    placeholder="Selecciona un revendedor"
                    className="w-[200px]"
                    color="secondary"
                  />
                </div>
              </div>

           

              {/* Lista de Productos */}
              <div className="flex items-center"> 
                <h2 className="mt-8 text-xl font-bold">Productos:</h2>
              </div>

              {products.map((product) => (
                <div key={product.id} className="relative p-4 bg-gray-100 rounded-lg">
                  <Button
                    isIconOnly
                    color="danger"
                    variant="light"
                    onClick={() => handleRemoveProduct(product.id)}
                    className="absolute top-2 right-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{product.name}</p>
                      <p className="text-gray-500">Precio: ${product.precioRevendedor}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      {product.name && product.name.toLowerCase().includes('soda') ? (
                        <>
                          <div className="flex flex-col h-[85px] justify-end">
                            <label htmlFor={`cajones-${product.id}`} className="block mb-2 text-gray-700">
                              Cajones
                            </label>
                            <Input
                              id={`cajones-${product.id}`}
                              type="number"
                              placeholder="0"
                              value={Math.floor(product.quantity / 6).toString()}
                              onChange={(e) => {
                                const cajones = parseInt(e.target.value) || 0;
                                if (cajones >= 0) {
                                  const unidadesSueltas = product.quantity % 6;
                                  handleQuantityChange(product.id, (cajones * 6) + unidadesSueltas);
                                }
                              }}
                              className="w-24"
                              variant="bordered"
                              color="secondary"
                              min="0"
                            />
                          </div>
                          <div className="flex flex-col h-[85px] justify-end">
                            <label htmlFor={`sueltas-${product.id}`} className="block mb-2 text-gray-700">
                              Unidades Sueltas
                            </label>
                            <Input
                              id={`sueltas-${product.id}`}
                              type="number"
                              placeholder="0"
                              value={Math.floor(product.quantity % 6).toString()}
                              onChange={(e) => {
                                const unidadesSueltas = parseInt(e.target.value) || 0;
                                if (unidadesSueltas >= 0) {
                                  const cajones = Math.floor(product.quantity / 6);
                                  handleQuantityChange(product.id, (cajones * 6) + unidadesSueltas);
                                }
                              }}
                              className="w-24"
                              variant="bordered"
                              color="secondary"
                              min="0"
                            />
                          </div>
                        </>
                      ) : null}
                      <div className="ml-24">
                        <label htmlFor={`quantity-${product.id}`} className="block mb-2 text-gray-700">
                          Total Unidades
                        </label>
                        <Input
                          id={`quantity-${product.id}`}
                          type="number"
                          placeholder="0"
                          value={product.quantity.toString()}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value >= 0) {
                              handleQuantityChange(product.id, value);
                            }
                          }}
                          className="w-24"
                          variant="bordered"
                          color="secondary"
                          isReadOnly={product.name?.toLowerCase().includes('soda') || false}
                          min="0"
                        />
                      </div>
                      <div className="flex justify-end mt-2 mr-12 min-w-36">
                      <h2 className="text-lg font-bold">Total: ${product.precioRevendedor * (product.quantity || 0)}</h2>
                  </div>
                    </div>
                  </div>
                 
                </div>
              ))}



                 {/* Selector de Productos */}
                 <label htmlFor="producto" className="block mb-2 text-gray-700">Agregar Productos</label>
              <div className="flex items-center">
                <Select
                  label="Agregar Producto"
                  placeholder="Selecciona un producto"
                  onChange={(e) => handleAddProduct(e.target.value)}
                  className="mb-4 w-full"
                >
                  {allProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - ${product.precioRevendedor}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Totales - Agregar después del mapping de productos */}
              <div className="p-4 mt-4 bg-gray-200 rounded-lg">
                <h2 className="mb-4 text-xl font-bold">Resumen de la Venta</h2>
                <div className="space-y-2">
                 
                  <div className="pt-2 mt-2 border-t border-gray-400">
                    {/* Desglose por producto */}
                    {products
                      .filter(p => p.quantity > 0)
                      .map(product => (
                        <div key={product.id} className="flex justify-between mb-2">
                          <span>{product.name}:</span>
                          <div className="text-right">
                            {product.name.toLowerCase().includes('soda') ? (
                              <span>
                                {Math.floor(product.quantity / 6)} cajones
                                {product.quantity % 6 > 0 && ` + ${product.quantity % 6} unidades`}
                                {' - '}
                              </span>
                            ) : (
                              <span>{product.quantity} unidades - </span>
                            )}
                            <span className="font-bold">${(product.precioRevendedor * product.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}

                    {/* Línea divisoria */}
                    <div className="my-2 border-t border-gray-400"></div>

                   
                    <div className="flex justify-between mt-2 text-lg font-bold">
                      <span>Total General:</span>
                      <span>${products.reduce((sum, p) => sum + (p.precioRevendedor * p.quantity), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Divider className="my-4" />
              
              {/* Botón para generar venta y Alert */}
              <div className="space-y-4">
                <Button
                  color="secondary"
                  variant="solid"
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    handleGenerateVenta();
                  }}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <div className="flex justify-center items-center">
                      <svg className="mr-3 w-5 h-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generando PDF...
                    </div>
                  ) : (
                    'Generar Venta'
                  )}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Asegurarnos de que PDFContent esté montado cuando isGeneratingPDF es true */}
      {(isGeneratingPDF || showPDF) && (
        <PDFContent
          selectedRevendedorName={revendedores.find(r => r.id === parseInt(selectedRevendedor))?.nombre || 'Revendedor no seleccionado'}
          selectedDate={selectedDate}
          products={products}
          formatDate={formatDate}
          invoiceRef={invoiceRef}
        />
      )}

      {/* Mensaje de alerta flotante */}
      {alertInfo.show && (
        <div className="fixed top-4 right-4 z-50">
          <Alert 
            color={alertInfo.type === 'success' ? 'success' : 'danger'}
            title={alertInfo.title}
            className="w-[400px]"
          >
            {alertInfo.message}
          </Alert>
        </div>
      )}
    </div>
  );
}
