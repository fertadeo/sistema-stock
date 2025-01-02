'use client'
import React, { useState } from 'react'
import "@/styles/globals.css"
import { Card, CardBody, CardHeader, Input, Button, Select, SelectItem } from "@nextui-org/react"
import repartidores from '@/components/soderia-data/repartidores.json'
import productos from '@/components/soderia-data/productos.json'

interface OrderForm {
  fecha: string;
  repartidor: string;
  productos: {
    id: number;
    cantidad: number;
  }[];
}

const ControlCargaPage = () => {
  const [isCarga, setIsCarga] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<OrderForm>({
    fecha: today,
    repartidor: '',
    productos: productos.map(p => ({
      id: p.id,
      cantidad: 0,
    }))
  });

  const handleProductChange = (productId: number, cantidad: number) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.map(p => {
        if (p.id === productId) {
          return { ...p, cantidad };
        }
        return p;
      })
    }));
  };

  const toggleMode = () => {
    setIsCarga(!isCarga);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Carga generada:', formData);
    // Aquí puedes agregar la lógica para enviar los datos a tu backend
  };

  return (
    <div className={`flex justify-center items-center p-2 md:p-4 w-full min-h-screen ${
      isCarga ? 'bg-green-50' : 'bg-rose-50'
    }`}>
      <div className="w-full max-w-[800px] mx-auto">
        <Card className={`w-full ${
          isCarga ? 'bg-green-100' : 'bg-rose-100'
        }`}>
          <CardHeader className={`flex flex-col gap-3 p-4 md:p-6 ${
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
          <CardBody className="p-3 md:p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
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

              {/* Productos */}
              <div className="mt-6 md:mt-8">
                <h3 className="mb-4 text-xl font-semibold md:text-2xl">Productos</h3>
                <div className="space-y-4 md:space-y-6">
                  {productos.map((producto) => (
                    <div key={producto.id} className="flex flex-col gap-4 items-center p-4 bg-gray-50 rounded-lg md:flex-row md:gap-6 md:p-6">
                      <span className="flex-grow text-base md:text-lg">{producto.Producto}</span>
                      <Input
                        type="number"
                        label="Cantidad"
                        min="0"
                        value={(formData.productos.find(p => p.id === producto.id)?.cantidad || 0).toString()}
                        onChange={(e) => handleProductChange(producto.id, parseInt(e.target.value) || 0)}
                        className="w-full text-base md:w-40 md:text-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón para generar la orden */}
              <div className="flex justify-end items-center mt-6 md:mt-8">
                <Button 
                  color="primary" 
                  type="submit"
                  size="lg"
                  className="w-full text-base md:w-auto md:text-lg"
                >
                  {isCarga ? 'Guardar Carga' : 'Guardar Descarga'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ControlCargaPage;