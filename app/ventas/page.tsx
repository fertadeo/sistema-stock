'use client';
import Link from 'next/link';
import '../../styles/globals.css'; // Asegúrate de que los estilos globales estén importados
import { Card, CardBody } from "@heroui/react";

export default function VentasPage() {
  return (
    <div className="flex flex-col items-center pt-8 min-h-screen bg-gray-100">
      <div className="text-center">
       
        
        {/* Sección Repartidor Don Javier */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-800">Repartidor Don Javier</h2>
          <div className="grid grid-cols-1 gap-6 mx-auto max-w-4xl md:grid-cols-2">
            <Link href="/ventas/repartidores-donjavier/control-carga">
              <Card className="flex flex-col justify-between p-6 max-w-xs h-64 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 mb-4 bg-blue-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Control de Carga</h3>
                  <CardBody className="text-gray-600">
                    Gestiona las cargas y descargas de los repartidores
                  </CardBody>
                </div>
              </Card>
            </Link>

            <Link href="/ventas/repartidores-donjavier/ventas">
              <Card className="flex flex-col justify-between p-6 max-w-xs h-64 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 mb-4 bg-green-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Control de Caja</h3>
                  <CardBody className="text-gray-600">
                    Gestiona el control de caja y ventas <br /> <br />
        
                  </CardBody>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Sección Revendedores */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold text-gray-800">Revendedores</h2>
          <div className="grid grid-cols-1 gap-6 mx-auto max-w-4xl md:grid-cols-2">
            <Link href="/ventas/revendedores">
              <Card className="flex flex-col justify-between p-6 max-w-xs h-64 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 mb-4 bg-purple-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-purple-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Cargar Venta</h3>
                  <CardBody className="text-gray-600">
                    Registra nuevas ventas de revendedores
                  </CardBody>
                </div>
              </Card>
            </Link>

            <Link href="/ventas/revendedores/historial">
              <Card className="flex flex-col justify-between p-6 max-w-xs h-64 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 mb-4 bg-orange-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-orange-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Historial de Ventas</h3>
                  <CardBody className="text-gray-600">
                    Consulta el historial de ventas de revendedores
                  </CardBody>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Sección Ventas en Local */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-800">Ventas en Local</h2>
          <div className="grid grid-cols-1 gap-6 mx-auto max-w-4xl md:grid-cols-2">
            <Link href="/ventas/ventas-local">
              <Card className="flex flex-col justify-between p-6 max-w-xs h-64 transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 mb-4 bg-yellow-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-yellow-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v1.5M3 7.5h18m-18 0v10.5A2.25 2.25 0 0 0 5.25 20.25h13.5A2.25 2.25 0 0 0 21 18V7.5m-18 0h18" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Ventas en Local</h3>
                  <CardBody className="text-gray-600">
                    Consulta y gestiona las ventas realizadas en el local
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
