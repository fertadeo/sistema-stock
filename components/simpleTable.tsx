"use client";

import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Input } from "@heroui/react";

interface Venta {
  venta_id: string;
  revendedor_nombre: string;
  fecha_venta: string;
  monto_total: string;
  forma_pago: string;
  medio_pago: string;
  zona?: string;
  direccion?: string;
}

interface ApiResponse {
  ventas: Venta[];
  estadisticas: {
    montoTotal: string;
    totalVentas: number;
    ventasConSaldo: number;
    ventasPorDia: Record<string, number>;
    ventasPorMedioPago: {
      efectivo: number;
      transferencia: number;
    };
  };
}

export default function SimpleTable() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const rowsPerPage = 5;

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ventas/resumen`);
        const data: ApiResponse = await response.json();
        setVentas(data.ventas);
      } catch (error) {
        console.error("Error al obtener ventas:", error);
      }
    };

    fetchVentas();
  }, []);

  // Función para obtener el nombre a mostrar en la columna Revendedor
  const getNombreRevendedor = (venta: Venta) => {
    // Si no hay nombre del revendedor o está vacío, mostrar "Venta en local"
    if (!venta.revendedor_nombre || venta.revendedor_nombre.trim() === '') {
      return "Venta en local";
    }
    // Si hay nombre del revendedor, mostrarlo
    return venta.revendedor_nombre;
  };

  // Función para obtener las clases CSS del nombre
  const getNombreClasses = (venta: Venta) => {
    if (!venta.revendedor_nombre || venta.revendedor_nombre.trim() === '') {
      return "text-yellow-600 font-bold";
    }
    return "";
  };

  // Filtrar ventas basado en el término de búsqueda
  const ventasFiltradas = ventas.filter((venta) => {
    const searchString = searchTerm.toLowerCase().trim();
    
    // Si no hay término de búsqueda, mostrar todas las ventas
    if (!searchString) return true;

    // Buscar en todos los campos relevantes
    return (
      venta.venta_id.toLowerCase().includes(searchString) ||
      venta.revendedor_nombre.toLowerCase().includes(searchString) ||
      formatDate(venta.fecha_venta).toLowerCase().includes(searchString) ||
      venta.monto_total.toString().includes(searchString) ||
      venta.medio_pago.toLowerCase().includes(searchString) ||
      venta.forma_pago.toLowerCase().includes(searchString) ||
      (venta.zona && venta.zona.toLowerCase().includes(searchString)) ||
      (venta.direccion && venta.direccion.toLowerCase().includes(searchString))
    );
  });

  // Calcular páginas basado en resultados filtrados
  const pages = Math.ceil(ventasFiltradas.length / rowsPerPage);
  
  // Obtener las ventas de la página actual
  const ventasPaginadas = ventasFiltradas.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset página cuando cambia la búsqueda
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <Table
        selectionMode="single"
        aria-label="Tabla de últimas ventas"
        bottomContent={
          pages > 1 ? (
            <div className="flex justify-center w-full">
              <Pagination
                isCompact
                showControls
                showShadow
                color="success"
                page={page}
                total={pages}
                onChange={setPage}
                classNames={{
                  cursor: "bg-[#18bca4] text-white",
                  item: "text-[#18bca4]",
                  next: "text-[#18bca4]",
                  prev: "text-[#18bca4]",
                }}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn>VENTA #</TableColumn>
          <TableColumn>REVENDEDOR</TableColumn>
          <TableColumn>FECHA</TableColumn>
          <TableColumn>MONTO</TableColumn>
          <TableColumn>PAGO</TableColumn>
        </TableHeader>
        <TableBody>
          {ventasPaginadas.length > 0 ? (
            ventasPaginadas.map((venta) => (
              <TableRow key={venta.venta_id}>
                <TableCell>{`#${venta.venta_id.slice(0, 8)}`}</TableCell>
                <TableCell>
                  <span className={getNombreClasses(venta)}>
                    {getNombreRevendedor(venta)}
                  </span>
                </TableCell>
                <TableCell>{formatDate(venta.fecha_venta)}</TableCell>
                <TableCell>${Number(venta.monto_total).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</TableCell>
                <TableCell>
                  <span className={`capitalize ${venta.medio_pago === 'efectivo' ? 'text-green-600' : 'text-blue-600'}`}>
                    {venta.medio_pago}
                  </span>
                  {venta.forma_pago === 'parcial' && (
                    <span className="ml-2 text-yellow-600">(Parcial)</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>No hay ventas registradas</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {ventasFiltradas.length === 0 && (
        <div className="relative px-4 py-3 text-teal-700 bg-teal-200 bg-opacity-30 rounded border border-teal-500 border-opacity-30" role="alert">
          {searchTerm ? (
            <>
              <strong className="font-bold">No se encontraron resultados! <br /></strong>
              <span className="block sm:inline">No hay ventas que coincidan con tu búsqueda.</span>
            </>
          ) : (
            <>
              <strong className="font-bold">No hay ventas registradas! <br /></strong>
              <span className="block sm:inline">Las ventas realizadas aparecerán aquí.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
