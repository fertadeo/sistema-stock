'use client'
import React, { useEffect, useState } from 'react';
import '../../../styles/globals.css';
import { Table, Button, Card, CardHeader, CardBody, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Balance = () => {
  const [salesData, setSalesData] = useState([
    {
      revendedor_id: "12345",
      repartidor_id: "67890",
      productos: [
        {
          producto_id: "prod-1",
          cantidad: 2,
          precio_unitario: "100.00",
          subtotal: "200.00"
        }
      ],
      monto_total: "200.00",
      medio_pago: "efectivo",
      forma_pago: "parcial",
      saldo_monto: "50.00"
    },
    {
      revendedor_id: "54321",
      repartidor_id: "09876",
      productos: [
        {
          producto_id: "prod-2",
          cantidad: 1,
          precio_unitario: "150.00",
          subtotal: "150.00"
        },
        {
          producto_id: "prod-3",
          cantidad: 3,
          precio_unitario: "50.00",
          subtotal: "150.00"
        }
      ],
      monto_total: "300.00",
      medio_pago: "tarjeta",
      forma_pago: "total",
      saldo_monto: "0.00"
    },
    {
      revendedor_id: "67890",
      repartidor_id: "12345",
      productos: [
        {
          producto_id: "prod-4",
          cantidad: 5,
          precio_unitario: "20.00",
          subtotal: "100.00"
        }
      ],
      monto_total: "100.00",
      medio_pago: "efectivo",
      forma_pago: "parcial",
      saldo_monto: "20.00"
    },
    // Puedes agregar más datos de ejemplo aquí
  ]);
  const [loading, setLoading] = useState(false); // Cambiado a false para simular carga de datos

  useEffect(() => {
    // Simulación de la obtención de datos de ventas
    const fetchSalesData = async () => {
      // Aquí deberías hacer la llamada a tu API para obtener los datos de ventas
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ventas-resumen`);
      // const data = await response.json();
      // setSalesData(data);
      // setLoading(false);
    };

    // Simulamos que los datos ya están cargados
    setLoading(false);
    fetchSalesData();
  }, []);

  const chartData = {
    labels: salesData.map(sale => `Rev. ${sale.revendedor_id}`), // Agregamos "Rev." para mejor legibilidad
    datasets: [
      {
        label: 'Monto Total',
        data: salesData.map(sale => parseFloat(sale.monto_total)),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Ventas por Revendedor',
      },
    },
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {loading ? (
        <span>Loading...</span>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card de Resumen */}
            <Card className="p-4">
              <CardHeader className="pb-2">
                <h4 className="text-lg font-semibold">Resumen de Ventas</h4>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <p>Total de Ventas: {salesData.length}</p>
                  <p>Monto Total: ${salesData.reduce((sum, sale) => sum + parseFloat(sale.monto_total), 0).toFixed(2)}</p>
                  <p>Saldo Pendiente: ${salesData.reduce((sum, sale) => sum + parseFloat(sale.saldo_monto), 0).toFixed(2)}</p>
                </div>
              </CardBody>
            </Card>

            {/* Card del Gráfico */}
            <Card className="p-4">
              <CardHeader className="pb-2">
                <h4 className="text-lg font-semibold">Gráfico de Ventas</h4>
              </CardHeader>
              <CardBody>
                <div className="h-[300px]">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Tabla de Ventas */}
          <Card className="p-4">
            <CardHeader className="pb-2">
              <h4 className="text-lg font-semibold">Detalle de Ventas</h4>
            </CardHeader>
            <CardBody>
              <Table 
                aria-label="Tabla de Ventas"
                className="min-w-full"
                classNames={{
                  wrapper: "shadow-none"
                }}
              >
                <TableHeader>
                  <TableColumn>Revendedor ID</TableColumn>
                  <TableColumn>Repartidor ID</TableColumn>
                  <TableColumn>Productos</TableColumn>
                  <TableColumn>Monto Total</TableColumn>
                  <TableColumn>Medio de Pago</TableColumn>
                  <TableColumn>Forma de Pago</TableColumn>
                  <TableColumn>Saldo Monto</TableColumn>
                  <TableColumn>Acciones</TableColumn>
                </TableHeader>
                <TableBody>
                  {salesData.map((sale, index) => (
                    <TableRow key={index}>
                      <TableCell>{sale.revendedor_id}</TableCell>
                      <TableCell>{sale.repartidor_id}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {sale.productos.map(product => (
                            <div key={product.producto_id} className="text-sm">
                              {product.cantidad} x ${product.precio_unitario} = ${product.subtotal}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>${sale.monto_total}</TableCell>
                      <TableCell className="capitalize">{sale.medio_pago}</TableCell>
                      <TableCell className="capitalize">{sale.forma_pago}</TableCell>
                      <TableCell>${sale.saldo_monto}</TableCell>
                      <TableCell>
                        <Button size="sm" color="danger">Eliminar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
};

export default Balance;
