'use client';
import '../../../styles/globals.css'; 
import React from 'react';
import {Button, Input, Card, CardBody, CardHeader, Divider, Popover, PopoverTrigger, PopoverContent, Select, SelectItem } from "@nextui-org/react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { Calendar } from "@nextui-org/calendar";
import { useState } from "react";
import Link from "next/link";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "@react-types/calendar";
import productosData from '../../../components/soderia-data/productos.json';
import revendedoresData from '../../../components/soderia-data/revendedores.json';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BudgetResume from '@/components/budgetResume';
import Alert from '@/components/shared/alert';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface BudgetResume {
  totalCajones: number;
  totalUnidades: number;
  totalGeneral: number;
}

interface Revendedor {
  id: string;
  name: string;
}

export default function NuevaVenta() {
  const defaultDate = today(getLocalTimeZone());
  const [selectedDate, setSelectedDate] = useState<DateValue>(defaultDate);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(
    productosData
      .filter(producto => [1, 2, 3].includes(producto.id))
      .map(producto => ({
        id: producto.id,
        name: producto.Producto,
        price: producto.PrecioRevendedor ?? 0, // Add null check with ?? 0
        quantity: 0
      }))
  );
  const [selectedRevendedor, setSelectedRevendedor] = useState("");
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

  const handleAddProduct = (productId: string) => {
    const selectedProduct = productosData.find(p => p.id === parseInt(productId));
    if (selectedProduct && !products.some(p => p.id === selectedProduct.id)) {
      setProducts([...products, {
        id: selectedProduct.id,
        name: selectedProduct.Producto,
        price: selectedProduct.PrecioRevendedor ?? 0,
        quantity: 0
      }]);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleQuantityChange = (productId: number, value: number) => {
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
      totalGeneral: updatedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0)
    };

    setBudgetResume(newResume);
  };

  const handleGenerateVenta = async () => {
    if (!selectedRevendedor) {
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Debe seleccionar un revendedor para generar la venta'
      });
      return;
    }

    const hasProducts = products.some(p => p.quantity > 0);
    if (!hasProducts) {
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Debe agregar al menos un producto a la venta'
      });
      return;
    }

    if (budgetResume.totalGeneral === 0) {
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'El total de la venta no puede ser $0'
      });
      return;
    }

    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const pdf = new jsPDF({
        format: 'a4',
        unit: 'mm'
      });
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      pdf.save(`Venta-Revendedor-${selectedRevendedor}-${selectedDate}.pdf`);

      setAlertInfo({
        show: true,
        type: 'success',
        title: 'Éxito',
        message: `Venta generada exitosamente\nTotal Cajones: ${budgetResume.totalCajones}\nTotal Unidades: ${budgetResume.totalUnidades}\nTotal General: $${budgetResume.totalGeneral}`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setAlertInfo({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Hubo un error generando el PDF. Por favor intente nuevamente.'
      });
    }
    setShowPDF(true);
  };

  const selectedRevendedorName = revendedoresData.revendedores.find(
    revendedor => revendedor === selectedRevendedor
  ) || '';

  console.log('Revendedor elegido:', selectedRevendedorName);
  console.log('Nombre del revendedor seleccionado:', selectedRevendedor);
  console.log('Datos de revendedores:', revendedoresData.revendedores);

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
                          value={selectedDate.toString()}
                          readOnly
                          placeholder="Selecciona una fecha"
                          className="pl-10 w-[200px]"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="transform" >
                      <Calendar
                        defaultValue={defaultDate}
                        value={selectedDate}
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
                  <Select
                    id="revendedor"
                    color="secondary"
                    placeholder="Selecciona un revendedor"
                    value={selectedRevendedor}
                    onChange={(e) => {
                      setSelectedRevendedor(e.target.value);
                      console.log('Revendedor seleccionado:', e.target.value);
                    }}
                    className="w-[200px]"
                  >
                    {revendedoresData.revendedores.map((revendedor, index) => (
                      <SelectItem key={index} value={revendedor}>
                        {revendedor}
                      </SelectItem>
                    ))}
                  </Select>
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
                      <p className="text-gray-500">Precio: ${product.price}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      {product.name.toLowerCase().includes('soda') ? (
                        <>
                          <div>
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
                                const unidadesSueltas = product.quantity % 6;
                                handleQuantityChange(product.id, (cajones * 6) + unidadesSueltas);
                              }}
                              className="w-24"
                              variant="bordered"
                              color="secondary"
                            />
                          </div>
                          <div>
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
                                const cajones = Math.floor(product.quantity / 6);
                                handleQuantityChange(product.id, (cajones * 6) + unidadesSueltas);
                              }}
                              className="w-24"
                              variant="bordered"
                              color="secondary"
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
                          onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                          className="w-24"
                          variant="bordered"
                          color="secondary"
                          readOnly={product.name.toLowerCase().includes('soda')}
                        />
                      </div>
                      <div className="flex justify-end mt-2 mr-12 min-w-36">
                    <h2 className="text-lg font-bold">Total: ${product.price * product.quantity}</h2>
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
                  {productosData.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id.toString()}>
                      {producto.Producto}
                    </SelectItem>
                  ))}
                </Select>
        
              </div>

              {/* Totales - Agregar después del mapping de productos */}
              <div className="p-4 mt-4 bg-gray-200 rounded-lg">
                <h2 className="mb-4 text-xl font-bold">Resumen de la Venta</h2>
                <div className="space-y-2">
                  {products.filter(p => p.quantity > 0).map(product => (
                    <div key={product.id} className="flex justify-between">
                      <span>{product.name} x {product.quantity}</span>
                      <span>${product.price * product.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-gray-400">
                    <div className="flex justify-between font-bold">
                      <span>Total Cajones:</span>
                      <span>{budgetResume.totalCajones}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total Unidades:</span>
                      <span>{budgetResume.totalUnidades}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total General:</span>
                      <span>${products.reduce((sum, product) => sum + (product.price * product.quantity), 0)}</span>
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
                  onClick={handleGenerateVenta}
                >
                  Generar Venta
                </Button>

                {alertInfo.show && (
                  <Alert
                    type={alertInfo.type}
                    title={alertInfo.title}
                    message={alertInfo.message}
                    onClose={() => setAlertInfo(prev => ({ ...prev, show: false }))}
                  />
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Contenido a convertir en PDF */}
      <div ref={invoiceRef} className={`p-6 bg-white ${showPDF ? '':'hidden'}`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Sodería Don Javier
            </h1>
            <p className="font-bold">Revendedor: {selectedRevendedorName}</p>
          </div>
          <div className="text-right">
            <div className="text-gray-600">
              <p>Gerónimo del Barco 2560</p>
              <p>Río Cuarto, Córdoba</p>
              <p>Tel: 3585602938</p>
            </div>
            <p className="text-gray-600">Fecha: {selectedDate.toString()}</p>
          </div>
        </div>

        {/* Lista de productos */}
        <table className="mb-8 w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-semibold text-left text-gray-900">Producto</th>
              <th className="px-4 py-3 font-semibold text-center text-gray-900">Cajones</th>
              <th className="px-4 py-3 font-semibold text-center text-gray-900">Unidades</th>
              <th className="px-4 py-3 font-semibold text-center text-gray-900">Total Unid.</th>
              <th className="px-4 py-3 font-semibold text-right text-gray-900">Precio Unit.</th>
              <th className="px-4 py-3 font-semibold text-right text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {products.filter(p => p.quantity > 0).map(product => (
              <tr key={product.id} className="border-b border-gray-200">
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3 text-center">
                  {product.name.toLowerCase().includes('soda') ? Math.floor(product.quantity / 6) : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  {product.name.toLowerCase().includes('soda') ? product.quantity % 6 : '-'}
                </td>
                <td className="px-4 py-3 text-center">{product.quantity}</td>
                <td className="px-4 py-3 text-right">${product.price}</td>
                <td className="px-4 py-3 text-right">${product.price * product.quantity}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={5} className="px-4 py-3 text-right">Total General:</td>
              <td className="px-4 py-3 text-right">
                ${products.reduce((sum, product) => sum + (product.price * product.quantity), 0)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="pt-4 mt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Gracias por su compra. Para consultas comunicarse al 3585602938.
          </p>
        </div>
      </div>
    </div>
  );
}
