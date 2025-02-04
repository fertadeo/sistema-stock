'use client';
import Link from 'next/link';
import '../../styles/globals.css'; // Asegúrate de que los estilos globales estén importados
import { Card, CardBody } from "@heroui/react";

export default function VentasPage() {
  return (
    <div className="flex flex-col items-center pt-8 min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="mb-8 text-3xl font-bold">Sistema de Ventas</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* Repartidores Don Javier */}
          <div className="mt-4 w-64 h-60">
            <Link href="/ventas/repartidores-donjavier">
              <Card className="p-6 transition-shadow duration-300 hover:shadow-lg">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <h2 className="m-4 text-xl font-bold">Repartidores Don Javier</h2>
                  </div>
                  <CardBody className="text-gray-600">
                    Gestiona las ventas de los repartidores
                  </CardBody>
                </div>
              </Card>
            </Link>
          </div>


          {/* Revendedores */}
          <div className="mt-4 w-64 h-60">
            <Link href="/ventas/revendedores">
              <Card className="p-6 transition-shadow duration-300 hover:shadow-lg">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"  stroke="currentColor" className="size-10">
                      <path  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>



                    </div>
                    <h2 className="m-4 text-xl font-bold">Revendedores</h2>
                  </div>
                  <CardBody className="text-gray-600">
                    Gestiona las compras realizadas por los revendedores
                  </CardBody>
                </div>
              </Card>
            </Link>
          </div>




          {/* Balance e historial */}
          <div className="mt-4 w-64 h-60">
            <Link href="/ventas/balance">
              <Card className="p-6 transition-shadow duration-300 hover:shadow-lg">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"  stroke="currentColor" className="size-10">
                        <path  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                      </svg>

                    </div>
                    <h2 className="m-4 text-xl font-bold">Balance e historial</h2>
                  </div>
                  <CardBody className="text-gray-600">
                    Gestiona las ventas de los repartidores
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
