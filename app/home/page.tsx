import BarChart from '@/components/chart';
import PresupuestosTable from '@/components/presupuestosTable';

import SimpleTable from '@/components/simpleTable';

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
          <h3 className="mb-4 text-lg font-medium text-center">Ultimas ventas</h3>
          <SimpleTable />
        </div>

        {/* Columna derecha con BarChart */}
        <div className="p-6 w-full bg-white rounded-lg shadow md:w-1/2">
          <h3 className="mb-4 text-lg font-medium text-center">Estadísticas de ventas</h3>
          <div className="p-4 text-blue-700 bg-blue-100 rounded border-l-4 border-blue-500">
            <div className="flex">
              <div className="py-1">
                <svg className="mr-4 w-6 h-6 text-blue-500 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold">Próximo a implementar</p>
                <p className="text-sm">Las estadísticas de ventas estarán disponibles próximamente.</p>
              </div>
            </div>
          </div>
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
