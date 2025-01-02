'use client';
import Link from 'next/link';
import '../../../styles/globals.css'; // Asegúrate de que los estilos globales estén importados
import { Card, CardBody } from '@nextui-org/react';

export default function RepartidoresPage() {
  return (
    <div className="flex flex-col items-center pt-8 min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="mb-8 text-3xl font-bold">Repartidores Don Javier</h1>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">

          {/* Repartidores Don Javier */}
          <div className="m-4 w-64 h-60">
            <Link href="/ventas/repartidores-donjavier/control-carga">
              <Card className="p-6 transition-shadow duration-300 hover:shadow-lg">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <h2 className="m-4 text-xl font-bold"> Control de Cargas</h2>
                  </div>
                  <CardBody className="text-gray-600">
                    Gestiona las cargas y descargas de los repartidores
                  </CardBody>
                </div>
              </Card>
            </Link>
          </div>


          {/* Revendedores */}
          <div className="m-4 w-64 h-60">
            <Link href="/ventas/repartidores-donjavier/generar-orden">
              <Card className="p-6 transition-shadow duration-300 hover:shadow-lg">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"  stroke="currentColor" className="size-10">
  <path  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
</svg>




                    </div>
                    <h2 className="m-4 text-xl font-bold">Generar Nueva Venta</h2>
                  </div>
                  <CardBody className="text-gray-600">
                    Gestiona las ventas segun la carga de los repartidores
                  </CardBody>
                </div>
              </Card>
            </Link>
          </div>





        </div>
      </div>
    </div>
  );
}
