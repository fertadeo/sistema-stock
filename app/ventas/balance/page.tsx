"use client"

import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Tabs, Tab } from "@heroui/react"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from "chart.js"
import { useState } from "react"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend)

const salesData = {
  labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
  datasets: [
    {
      label: "Ventas",
      data: [12000, 19000, 3000, 5000, 2000, 3000],
      backgroundColor: "rgba(53, 162, 235, 0.5)",
    },
  ],
}

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Ventas Mensuales",
    },
  },
}

const accounts = [
  {
    name: "Revendedores - Ventas en Efectivo",
    description: "Ingresos diarios",
    balance: "8,459.45",
    icon: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-6 h-6 text-blue-500" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
        />
      </svg>
    ),
  },
  {
    name: "Repartidores - Ventas en Efectivo",
    description: "Ingresos diarios",
    balance: "2,850.00",
    icon: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth="1.5" 
        className="w-6 h-6 text-green-500"
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" 
        />
      </svg>
    ),
  },
  {
    name: "Ventas en local",
    description: "Ingresos diarios",
    balance: "15,230.80",
    icon: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-6 h-6 text-yellow-500" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
        />
      </svg>
    ),
  },
]

interface Venta {
  id: string;
  cliente: string;
  fecha: string;
  monto: number;
  tipo: 'efectivo' | 'tarjeta' | 'pendiente';
  categoria: 'repartidor' | 'revendedor' | 'local';
}

const ventas: Venta[] = [
  { 
    id: "VTA-001", 
    cliente: "Juan Pérez", 
    fecha: "2024-02-20", 
    monto: 1500.00, 
    tipo: 'efectivo',
    categoria: 'repartidor' 
  },
  { 
    id: "VTA-002", 
    cliente: "María García", 
    fecha: "2024-02-20", 
    monto: 2300.50, 
    tipo: 'tarjeta',
    categoria: 'revendedor' 
  },
  { 
    id: "VTA-003", 
    cliente: "Carlos López", 
    fecha: "2024-02-19", 
    monto: 3450.75, 
    tipo: 'pendiente',
    categoria: 'local' 
  },
  // ... más ventas
];

export default function SalesDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'repartidor' | 'revendedor' | 'local'>('todos');

  // Filtrar ventas por categoría
  const ventasFiltradas = ventas.filter(venta => 
    selectedCategory === 'todos' ? true : venta.categoria === selectedCategory
  );

  const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance.replace(",", "")), 0);

  return (
    <div className="grid grid-cols-1 gap-6 h-[calc(100vh-10rem)] md:grid-cols-2">
      <Card className="p-4 h-auto">
        <CardHeader className="pb-2 h-32">
          <div className="flex flex-col space-y-1">
            <h2 className="text-lg font-semibold">Balance Total</h2>
            <p className="text-2xl font-bold">${totalBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
        </CardHeader>
        <CardBody className="py-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Tus Cuentas</h3>
            <div className="space-y-2">
              {accounts.map((account) => (
                <div key={account.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-full">{account.icon}</div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.description}</p>
                    </div>
                  </div>
                  <p className="font-semibold">${account.balance}</p>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button className="flex justify-center items-center p-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">
            <span className="mr-1">+</span> Agregar
          </button>
          <button className="flex justify-center items-center p-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">
            <span className="mr-1">↗</span> Enviar
          </button>
          <button className="flex justify-center items-center p-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">
            <span className="mr-1">↑</span> Cargar
          </button>
          <button className="flex justify-center items-center p-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">
            <span className="mr-1">⋯</span> Más
          </button>
        </div>
      </Card>

      <Card className="p-4 h-auto">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Últimas Ventas</h2>
            <Tabs 
              aria-label="Categorías de ventas" 
              selectedKey={selectedCategory}
              onSelectionChange={setSelectedCategory as any}
              color="primary"
              variant="underlined"
              classNames={{
                tabList: "gap-6",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-primary"
              }}
            >
              <Tab key="todos" title={
                <div className="flex items-center space-x-2">
                  <span>Todas</span>
                </div>
              }/>
              <Tab key="repartidor" title={
                <div className="flex items-center space-x-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    className="w-4 h-4 text-green-500"
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" 
                    />
                  </svg>
                  <span>Repartidores</span>
                </div>
              }/>
              <Tab key="revendedor" title={
                <div className="flex items-center space-x-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="w-4 h-4 text-blue-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                  <span>Revendedores</span>
                </div>
              }/>
              <Tab key="local" title={
                <div className="flex items-center space-x-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="w-4 h-4 text-yellow-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                    />
                  </svg>
                  <span>Local</span>
                </div>
              }/>
            </Tabs>
          </div>
        </CardHeader>
        <CardBody className="py-2">
          <Table 
            aria-label="Tabla de ventas recientes"
            className="min-w-full"
            removeWrapper
          >
            <TableHeader>
              <TableColumn>VENTA #</TableColumn>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>MONTO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {ventasFiltradas.map((venta) => (
                <TableRow key={venta.id} className="border-b">
                  <TableCell className="py-2">
                    <div className="flex gap-2 items-center">
                      <span className={`w-2 h-2 rounded-full ${
                        venta.tipo === 'efectivo' 
                          ? 'bg-green-500' 
                          : venta.tipo === 'tarjeta' 
                          ? 'bg-blue-500' 
                          : 'bg-yellow-500'
                      }`} />
                      {venta.id}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">{venta.cliente}</TableCell>
                  <TableCell className="py-2">{new Date(venta.fecha).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell className="py-2">${venta.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex gap-2">
                      <Tooltip content="Ver PDF">
                        <button className="p-1 text-blue-500 hover:text-blue-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </Tooltip>
                      <Tooltip content="Eliminar" color="danger">
                        <button className="p-1 text-red-500 hover:text-red-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  )
}

