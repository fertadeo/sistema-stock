'use client';

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/lib/api/fetchWithAuth';
import { Select, SelectItem, Card, CardBody, CardHeader } from '@heroui/react';
import Alert from '@/components/shared/alert';

type Repartidor = {
  id: number;
  nombre: string;
};

type EnvaseCliente = {
  producto_id: number;
  producto_nombre?: string;
  nombre_producto?: string;
  cantidad: number;
  capacidad?: number;
};

type Cliente = {
  id: number;
  nombre: string;
  repartidor: string;
  envases_prestados?: EnvaseCliente[];
};

type ResumenProducto = {
  nombre: string;
  cantidad: number;
  capacidad?: number;
};

type ResumenRepartidor = {
  repartidor: string;
  totalClientes: number;
  productos: ResumenProducto[];
  envases: ResumenProducto[];
  totalProductos: number;
  totalEnvases: number;
};

export default function ResumenRepartidores() {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<string>('');
  const [resumen, setResumen] = useState<ResumenRepartidor | null>(null);
  const [cargando, setCargando] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('success');

  useEffect(() => {
    cargarRepartidores();
  }, []);

  const cargarRepartidores = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repartidores`);
      if (!response.ok) throw new Error('Error al cargar repartidores');
      const data = await response.json();
      setRepartidores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar repartidores:', error);
      setAlertMessage('Error al cargar la lista de repartidores');
      setAlertType('error');
      setAlertVisible(true);
    }
  };

  const calcularResumen = async (nombreRepartidor: string) => {
    if (!nombreRepartidor) {
      setResumen(null);
      return;
    }

    setCargando(true);
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`);
      if (!response.ok) throw new Error('Error al cargar clientes');
      
      const todosClientes: Cliente[] = await response.json();
      const clientesRepartidor = todosClientes.filter(
        (c) => c.repartidor === nombreRepartidor
      );

      const productosMap = new Map<string, ResumenProducto>();
      const envasesMap = new Map<string, ResumenProducto>();

      for (const cliente of clientesRepartidor) {
        if (!cliente.envases_prestados) continue;

        for (const envase of cliente.envases_prestados) {
          const cantidad = Number(envase.cantidad) || 0;
          if (cantidad <= 0) continue;

          const nombreProducto = envase.producto_nombre || envase.nombre_producto || 'Producto desconocido';
          const capacidad = envase.capacidad;

          // Determinar si es envase o producto según capacidad o nombre
          const esEnvase = capacidad !== undefined || 
            /bidón|bidon|botellón|botellon|sifón|sifon|damajuana|barril/i.test(nombreProducto);

          const targetMap = esEnvase ? envasesMap : productosMap;
          const key = `${nombreProducto}_${capacidad || 0}`;

          if (targetMap.has(key)) {
            const existing = targetMap.get(key)!;
            existing.cantidad += cantidad;
          } else {
            targetMap.set(key, {
              nombre: nombreProducto,
              cantidad,
              capacidad
            });
          }
        }
      }

      const productos = Array.from(productosMap.values()).sort((a, b) => b.cantidad - a.cantidad);
      const envases = Array.from(envasesMap.values()).sort((a, b) => b.cantidad - a.cantidad);

      setResumen({
        repartidor: nombreRepartidor,
        totalClientes: clientesRepartidor.length,
        productos,
        envases,
        totalProductos: productos.reduce((sum, p) => sum + p.cantidad, 0),
        totalEnvases: envases.reduce((sum, e) => sum + e.cantidad, 0)
      });
    } catch (error) {
      console.error('Error al calcular resumen:', error);
      setAlertMessage('Error al calcular el resumen');
      setAlertType('error');
      setAlertVisible(true);
    } finally {
      setCargando(false);
    }
  };

  const handleRepartidorChange = (value: string) => {
    setRepartidorSeleccionado(value);
    calcularResumen(value);
  };

  useEffect(() => {
    if (alertVisible) {
      const timer = setTimeout(() => {
        setAlertVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertVisible]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {alertVisible && (
        <div className="fixed right-4 md:right-8 bottom-4 md:bottom-8 z-50">
          <Alert
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Resumen por Repartidor</h1>
        <p className="text-gray-600">
          Seleccioná un repartidor para ver la cantidad total de productos y envases 
          que tienen en conjunto todos sus clientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Seleccionar Repartidor</h2>
        </CardHeader>
        <CardBody>
          <Select
            label="Repartidor"
            placeholder="Seleccioná un repartidor"
            selectedKeys={repartidorSeleccionado ? [repartidorSeleccionado] : []}
            onChange={(e) => handleRepartidorChange(e.target.value)}
            className="max-w-md"
          >
            {repartidores.map((rep) => (
              <SelectItem key={rep.nombre} value={rep.nombre}>
                {rep.nombre}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {cargando && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!cargando && resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">{resumen.repartidor}</h2>
                <p className="text-sm text-gray-600">{resumen.totalClientes} clientes</p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total de productos</p>
                  <p className="text-3xl font-bold text-blue-600">{resumen.totalProductos}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total de envases</p>
                  <p className="text-3xl font-bold text-green-600">{resumen.totalEnvases}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex flex-col gap-6">
            {resumen.productos.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Detalle de Productos</h3>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-col gap-2">
                    {resumen.productos.map((prod, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{prod.nombre}</span>
                          {prod.capacidad && (
                            <span className="text-xs text-gray-600">{prod.capacidad}L</span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {prod.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {resumen.envases.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Detalle de Envases</h3>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-col gap-2">
                    {resumen.envases.map((envase, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{envase.nombre}</span>
                          {envase.capacidad && (
                            <span className="text-xs text-gray-600">{envase.capacidad}L</span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {envase.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {resumen.productos.length === 0 && resumen.envases.length === 0 && (
              <Card>
                <CardBody>
                  <p className="text-center text-gray-600 py-4">
                    Este repartidor no tiene productos ni envases asignados a sus clientes.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {!cargando && !resumen && repartidorSeleccionado && (
        <Card>
          <CardBody>
            <p className="text-center text-gray-600 py-4">
              No se encontró información para este repartidor.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
