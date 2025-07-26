'use client'
import SimpleTable from '@/components/simpleTable';
import { Card, CardBody } from "@heroui/react";
import MovimientosFeed from '@/components/MovimientosFeed';

// Componente MetricCard
const MetricCard = ({ title, amount, percentage, isPositive, icon }: {
  title: string;
  amount: string;
  percentage: string;
  isPositive: boolean;
  icon: React.ReactNode;
}) => {
  return (
    <Card className="w-full">
      <CardBody className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="mt-1 text-2xl font-semibold">${amount}</h3>
            <div className="flex items-center mt-2">
              {isPositive ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.306-4.306a11.95 11.95 0 0 1 5.814 5.518l2.74 1.22m0 0 5.94 2.281m-5.94-2.28 2.28-5.941" />
                </svg>
              )}
              <span className={`ml-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {percentage}%
              </span>
              <span className="ml-2 text-sm text-gray-500">vs último mes</span>
            </div>
          </div>
          <div className="p-3 bg-gray-100 rounded-full">
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default function Home() {
  // const data = {
  //   labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
  //   datasets: [
  //     {
  //       label: 'Pedidos Realizados',

  //       data: [25, 19, 40, 11, 6, 5, 10],
  //       backgroundColor: '#12C0C8',
  //       borderColor: 'rgba(75, 192, 192, 1)',
  //       borderWidth: 1,
  //     },
  //     {
  //       label: 'Clientes Agregados',
  //       data: [65, 59, 80, 81, 56, 55, 40],
  //       backgroundColor: '#F19C0F',
  //       borderColor: 'rgba(75, 192, 192, 1)',
  //       borderWidth: 1,
  //     },
  //   ],
  // };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="flex relative flex-col min-h-full" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Métricas Cards */}
      {/* <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Balance Total"
          amount="15,700.00"
          percentage="2.35"
          isPositive={true}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <MetricCard
          title="Ingresos"
          amount="8,500.00"
          percentage="8.45"
          isPositive={true}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
        />

        <MetricCard
          title="Gastos"
          amount="6,222.00"
          percentage="2.45"
          isPositive={false}
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          }
        />

        <MetricCard
          title="Ahorros Totales"
          amount="32,913.00"
          percentage="1.35"
          isPositive={true}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
        />
      </div> */}

      {/* Título responsivo */}
      <div className="px-4 py-2 w-full">
        {/* <Menucards /> */}
      </div>
      
      {/* Añadimos un margen adicional debajo de Menucards */}
      <div className="mt-4" />

      {/* Grid de dos columnas para tabla y gráficos */}
      <div className="flex flex-col gap-12 px-4 w-full md:flex-row md:space-x-8">
        {/* Columna izquierda con SimpleTable */}
        <div className="p-6 w-full bg-white rounded-lg shadow md:w-1/2">
          <h3 className="mb-4 text-lg font-medium text-center">Últimas ventas</h3>
          <SimpleTable />
        </div>

        {/* Columna derecha con MovimientosFeed */}
        <div className="p-2 w-full bg-white rounded-lg shadow md:w-full">
          <MovimientosFeed />
        </div>
      </div>

      {/* Añadimos un margen adicional debajo del grid de dos columnas */}
      <div className="mt-4" />

      {/* Seguimiento de Presupuestos - Columna completa */}
      <div className="p-6 px-4 py-6 mt-6 w-full bg-white rounded-lg shadow">
        <h2 className="mb-4 text-lg font-medium text-center">Próximo módulo a implementar</h2>
        <div className="p-4 text-blue-700 bg-blue-100 rounded border-l-4 border-blue-500">
          <div className="flex">
            <div className="py-1">
              <svg className="mr-4 w-6 h-6 text-blue-500 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">Próximo a implementar</p>
              <p className="text-sm">Este módulo estará disponible en futuras actualizaciones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
