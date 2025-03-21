'use client'
import React from 'react';
import { Card, CardHeader, CardBody } from "@heroui/react";
import { Proceso } from '@/types/ventas';

interface CardResumenVentasProps {
  procesosFiltrados: Proceso[];
  repartidorSeleccionado: string;
  repartidores: { id: number; nombre: string }[];
  fechaInicio: Date | null;
  fechaFin: Date | null;
  calcularTotalVenta: () => number;
  obtenerProductosMasVendidos: () => Array<{
    nombre: string;
    cantidad: number;
    subtotal: number;
  }>;
  formatDate: (date: Date) => { fecha: string };
}

const CardResumenVentas: React.FC<CardResumenVentasProps> = ({
  procesosFiltrados,
  repartidorSeleccionado,
  repartidores,
  fechaInicio,
  fechaFin,
  calcularTotalVenta,
  obtenerProductosMasVendidos,
  formatDate
}) => {
  return (
    <Card className="p-4 w-full">
      <CardHeader className="pb-2">
        <h4 className="text-lg font-semibold">Resumen de Ventas</h4>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          <p>Total de Ventas: <span className="font-bold">${calcularTotalVenta().toFixed(2)}</span></p>
          <p>Procesos Completados: <span className="font-bold">{procesosFiltrados.length}</span></p>
          {repartidorSeleccionado !== 'todos' && (
            <p>Repartidor: <span className="font-bold">
              {repartidores.find(r => r.id.toString() === repartidorSeleccionado)?.nombre || 'No seleccionado'}
            </span></p>
          )}
          {fechaInicio && fechaFin && !(fechaInicio.getTime() === new Date(0).getTime()) && (
            <p>Período: <span className="font-bold">
              {formatDate(fechaInicio).fecha} - {formatDate(fechaFin).fecha}
            </span></p>
          )}
          {procesosFiltrados.length > 0 && (
            <div className="pt-4 mt-4 border-t">
              <h5 className="mb-2 font-semibold">Productos más vendidos:</h5>
              <div className="space-y-1">
                {obtenerProductosMasVendidos().slice(0, 3).map((producto, index) => (
                  <p key={index}>
                    {producto.nombre}: <span className="font-bold">{producto.cantidad} unidades</span>
                    {producto.subtotal > 0 && ` ($${producto.subtotal.toFixed(2)})`}
                  </p>
                ))}
              </div>
            </div>
          )}
          {procesosFiltrados.length > 0 && procesosFiltrados[0].envases && procesosFiltrados[0].envases.length > 0 && (
            <div className="pt-4 mt-4 border-t">
              <h5 className="mb-2 font-semibold">Déficit de envases:</h5>
              <div className="space-y-1">
                {procesosFiltrados.flatMap(proceso => {
                  // Si estamos usando el nuevo formato de datos
                  if (proceso.id === '1' && proceso.productosVendidos && proceso.productosVendidos.length > 0) {
                    // Usar el déficit de envases ya calculado en productosVendidos
                    return proceso.productosVendidos.map(producto => {
                      return {
                        producto_id: producto.producto_id,
                        nombre: producto.nombre,
                        deficit: producto.deficit_envases || 0
                      };
                    });
                  } else {
                    // Formato anterior - calcular déficit como vendidos - recuperados
                    return proceso.productosVendidos?.map(producto => {
                      const envaseRecuperado = proceso.envases?.find(e => e.producto_id === producto.producto_id);
                      const cantidadRecuperada = envaseRecuperado?.cantidad || 0;
                      const deficit = producto.cantidad - cantidadRecuperada;
                      
                      return {
                        producto_id: producto.producto_id,
                        nombre: producto.nombre,
                        deficit: deficit > 0 ? deficit : 0
                      };
                    }) || [];
                  }
                }).filter(item => item.deficit > 0).map((item, index) => (
                  <p key={index} className={item.deficit > 0 ? "text-red-600" : ""}>
                    {item.nombre}: <span className="font-bold">{item.deficit} envases faltantes</span>
                  </p>
                ))}
                {procesosFiltrados.flatMap(proceso => {
                  // Verificar si hay algún déficit
                  const hayDeficit = procesosFiltrados.flatMap(p => {
                    if (p.id === '1' && p.productosVendidos) {
                      return p.productosVendidos.map(prod => prod.deficit_envases || 0);
                    } else {
                      return p.productosVendidos?.map(prod => {
                        const envaseRecuperado = p.envases?.find(e => e.producto_id === prod.producto_id);
                        const cantidadRecuperada = envaseRecuperado?.cantidad || 0;
                        return prod.cantidad - cantidadRecuperada;
                      }) || [];
                    }
                  }).some(deficit => deficit > 0);
                  
                  if (!hayDeficit) {
                    return [{ mensaje: "No hay déficit de envases" }];
                  }
                  return [];
                }).map((item, index) => (
                  <p key={index} className="text-green-600">
                    {item.mensaje}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default CardResumenVentas;
