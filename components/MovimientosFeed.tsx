import React, { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { UserPlusIcon, ShoppingCartIcon, MinusCircleIcon } from '@heroicons/react/24/solid';
import NuevoClienteModal from "./nuevoClienteModal";
import VentaLocalModal from "./ventaLocalModal";
import GastoEgresoModal from "./gastoEgresoModal";

interface DetallesMovimiento {
  productos?: string[];
  venta_id?: string;
  productos_detalle?: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  venta_cerrada_id?: number;
  repartidor_id?: number;
  monto_efectivo?: number;
  monto_transferencia?: number;
  balance_fiado?: number;
  comision_porcentaje?: number;
  ganancia_repartidor?: number;
  ganancia_fabrica?: number;
  concepto?: string;
  categoria?: string;
  proveedor?: string;
  items?: Array<{
    descripcion: string;
    cantidad: number;
    precio: number;
  }>;
}

interface Usuario {
  id: number;
  email: string;
  nivel_usuario: number;
}

interface Movimiento {
  id: number;
  tipo: "VENTA_LOCAL" | "CIERRE_VENTA" | "GASTO" | "NUEVO_CLIENTE";
  descripcion: string;
  usuario_id: number;
  fecha: string;
  activo: boolean;
  monto: string;
  detalles: DetallesMovimiento;
  usuario: Usuario;
  animating?: boolean;
}

interface ApiResponse {
  success: boolean;
  movimientos: Movimiento[];
  paginacion: {
    total: number;
    pagina: number;
    porPagina: number;
    totalPaginas: number;
  };
}

const getColor = (tipo: Movimiento["tipo"]) => {
  switch (tipo) {
    case "NUEVO_CLIENTE":
      return "border-blue-200 bg-blue-50 text-blue-500";
    case "VENTA_LOCAL":
    case "CIERRE_VENTA":
      return "border-yellow-100 bg-yellow-50 text-yellow-500";
    case "GASTO":
      return "border-red-200 bg-red-50 text-red-400";
    default:
      return "border-gray-100 bg-gray-50 text-gray-500";
  }
};

const getIcon = (tipo: Movimiento["tipo"]) => {
  switch (tipo) {
    case "NUEVO_CLIENTE":
      return <UserPlusIcon className="w-5 h-5 text-blue-400" />;
    case "VENTA_LOCAL":
    case "CIERRE_VENTA":
      return <ShoppingCartIcon className="w-5 h-5 text-yellow-400" />;
    case "GASTO":
      return <MinusCircleIcon className="w-5 h-5 text-red-300" />;
    default:
      return null;
  }
};

const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'VENTA_LOCAL', label: 'Ventas' },
  { key: 'NUEVO_CLIENTE', label: 'Nuevos Clientes' },
  { key: 'GASTO', label: 'Gastos/Egresos' },
];

const MovimientosFeed: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [tab, setTab] = useState<string>('todos');
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false);
  const [modalVentaLocal, setModalVentaLocal] = useState(false);
  const [modalGastoEgreso, setModalGastoEgreso] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movimientos`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setMovimientos(data.movimientos);
      } else {
        setError('Error al cargar los movimientos');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoMovimiento = (event: MessageEvent) => {
    console.log('Evento SSE recibido:', event.data);
    try {
      const nuevoMovimiento: Movimiento = JSON.parse(event.data);
      
      setMovimientos(prevMovimientos => {
        const nuevosMovimientos = [{
          ...nuevoMovimiento,
          animating: true
        }, ...prevMovimientos];
        
        setTimeout(() => {
          setMovimientos(current => 
            current.map(m => 
              m.id === nuevoMovimiento.id ? { ...m, animating: false } : m
            )
          );
        }, 1000);
        
        return nuevosMovimientos.slice(0, 50);
      });
    } catch (err) {
      console.error('Error al procesar nuevo movimiento:', err);
    }
  };

  useEffect(() => {
    fetchMovimientos();

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/movimientos/stream`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('nuevo_movimiento', handleNuevoMovimiento);
    eventSource.addEventListener('open', () => {
      setIsConnected(true);
    });
    eventSource.addEventListener('error', (event) => {
      console.error('Error en SSE:', event);
      setIsConnected(false);
      if (eventSource.readyState === EventSource.CLOSED) {
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          const newEventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/movimientos/stream`);
          eventSourceRef.current = newEventSource;
          newEventSource.addEventListener('nuevo_movimiento', handleNuevoMovimiento);
          newEventSource.addEventListener('open', () => {
            setIsConnected(true);
          });
        }, 5000);
      }
    });

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const movimientosFiltrados = tab === 'todos'
    ? movimientos
    : movimientos.filter(m => m.tipo === tab);

  if (loading) {
    return (
      <div className="p-4 w-full bg-white rounded-xl shadow h-[500px] flex flex-col">
        <div className="flex flex-1 justify-center items-center">
          <div className="text-gray-500">Cargando movimientos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 w-full bg-white rounded-xl shadow h-[500px] flex flex-col">
        <div className="flex flex-1 justify-center items-center">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full bg-white rounded-xl shadow h-[500px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors
                ${tab === t.key ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500">
            {isConnected ? 'Conectado en tiempo real' : 'Reconectando...'}
          </span>
        </div>
      </div>
      <h3 className="mb-4 text-lg font-semibold">Movimientos recientes</h3>
      <div className="flex overflow-y-auto flex-col flex-1 gap-2 max-h-96">
        {movimientosFiltrados.map((mov) => (
          <div
            key={mov.id}
            className={`flex justify-between items-center px-3 py-2 rounded-lg shadow-sm transition-all duration-700 hover:bg-opacity-90 border-l-4 ${getColor(mov.tipo)} ${mov.animating ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}
            style={{ willChange: 'opacity, transform' }}
          >
            <div className="flex gap-2 items-center">
              {getIcon(mov.tipo)}
              <div>
                <div className="font-medium text-gray-800">{mov.descripcion}</div>
                <div className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-lg font-bold`}>
                {(() => {
                  let montoNum =
                    typeof mov.monto === 'string'
                      ? Number(mov.monto)
                      : typeof mov.monto === 'number'
                      ? mov.monto
                      : null;
                  if (montoNum === null || isNaN(montoNum)) return '-';
                  const absMonto = Math.abs(Math.trunc(montoNum));
                  const montoFormateado = absMonto.toLocaleString('es-AR');
                  return montoNum < 0 ? `-$${montoFormateado}` : `$${montoFormateado}`;
                })()}
              </span>
            </div>
          </div>
        ))}
        {movimientosFiltrados.length === 0 && (
          <div className="py-8 text-center text-gray-400 h-[300px]">No hay movimientos en esta categoría.</div>
        )}
      </div>
      <div className="pt-4 mt-auto bg-white">
        <div className="flex gap-2">
          <Button className="flex gap-1 items-center text-blue-600 bg-blue-100 border border-blue-200 hover:bg-blue-200" size="sm" onClick={() => setModalNuevoCliente(true)}>
            <UserPlusIcon className="w-4 h-4 text-blue-400" /> Nuevo Cliente
          </Button>
          <Button className="flex gap-1 items-center text-yellow-600 bg-yellow-50 border border-yellow-100 hover:bg-yellow-100" size="sm" onClick={() => setModalVentaLocal(true)}>
            <ShoppingCartIcon className="w-4 h-4 text-yellow-400" /> Venta en local
          </Button>
          <Button className="flex gap-1 items-center text-red-500 bg-red-50 border border-red-100 hover:bg-red-100" size="sm" onClick={() => setModalGastoEgreso(true)}>
            <MinusCircleIcon className="w-4 h-4 text-red-300" /> Nuevo Gasto/Egreso
          </Button>
        </div>
      </div>
      <NuevoClienteModal isOpen={modalNuevoCliente} onClose={() => setModalNuevoCliente(false)} onClienteAgregado={() => setModalNuevoCliente(false)} />
      <VentaLocalModal isOpen={modalVentaLocal} onClose={() => setModalVentaLocal(false)} />
      <GastoEgresoModal isOpen={modalGastoEgreso} onClose={() => setModalGastoEgreso(false)} />
    </div>
  );
};

export default MovimientosFeed; 