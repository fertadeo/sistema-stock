"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  CubeIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

interface EnvasePrestado {
  id: number;
  clienteId: number;
  tipo: string;
  cantidad: number;
  fechaPrestamo: string;
  fechaDevolucion?: string;
  devuelto: boolean;
  observaciones?: string;
}

interface EnvaseItemProps {
  envase: EnvasePrestado;
  cliente: Cliente;
  onDevolucion: () => void;
}

const EnvaseItem: React.FC<EnvaseItemProps> = ({ envase, cliente, onDevolucion }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{cliente.nombre}</h3>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <CubeIcon className="w-4 h-4 mr-1" />
            <span>{envase.tipo} - {envase.cantidad} unidades</span>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>Prestado: {new Date(envase.fechaPrestamo).toLocaleDateString('es-ES')}</span>
          </div>
          {envase.observaciones && (
            <p className="text-sm text-gray-500 mt-1">{envase.observaciones}</p>
          )}
        </div>
        <div className="text-right">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            envase.devuelto 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {envase.devuelto ? 'Devuelto' : 'Prestado'}
          </div>
          {envase.devuelto && envase.fechaDevolucion && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(envase.fechaDevolucion).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
      </div>

      {!envase.devuelto && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={onDevolucion}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Registrar Devolución
          </button>
        </div>
      )}
    </div>
  );
};

const EnvaseManager: React.FC<{ cliente: Cliente; envasesPrestados: EnvasePrestado[] }> = ({ 
  cliente, 
  envasesPrestados 
}) => {
  const [tipoEnvase, setTipoEnvase] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');
  const [envases, setEnvases] = useState<EnvasePrestado[]>(envasesPrestados);

  const tiposEnvase = [
    "Botella 1L",
    "Botella 2L", 
    "Botella 500ml",
    "Garrafa 20L",
    "Garrafa 10L"
  ];

  const totalPrestado = envases
    .filter(e => !e.devuelto)
    .reduce((sum, e) => sum + e.cantidad, 0);

  const handlePrestarEnvase = () => {
    if (!tipoEnvase || cantidad <= 0) return;

    const nuevoEnvase: EnvasePrestado = {
      id: Date.now(),
      clienteId: cliente.id,
      tipo: tipoEnvase,
      cantidad,
      fechaPrestamo: new Date().toISOString(),
      devuelto: false,
      observaciones
    };

    setEnvases(prev => [nuevoEnvase, ...prev]);
    setTipoEnvase('');
    setCantidad(1);
    setObservaciones('');
  };

  const handleDevolucion = (envaseId: number) => {
    setEnvases(prev => prev.map(e => 
      e.id === envaseId 
        ? { 
            ...e, 
            devuelto: true, 
            fechaDevolucion: new Date().toISOString()
          }
        : e
    ));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Resumen de envases */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Envases de {cliente.nombre}</h2>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Prestado:</span>
          <span className="text-xl font-bold text-blue-600">
            {totalPrestado} unidades
          </span>
        </div>
      </div>

      {/* Lista de envases */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Historial de Envases</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {envases.map(envase => (
            <div key={envase.id} className="p-4">
              <EnvaseItem 
                envase={envase}
                cliente={cliente}
                onDevolucion={() => handleDevolucion(envase.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Prestar nuevo envase */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-3 text-gray-800">Prestar Envase</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor='tipoEnvase' className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Envase
            </label>
            <select
              value={tipoEnvase}
              onChange={(e) => setTipoEnvase(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="">Selecciona un tipo</option>
              {tiposEnvase.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor='cantidad' className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600"
              >
                -
              </button>
              <span className="w-16 text-center font-semibold">{cantidad}</span>
              <button
                onClick={() => setCantidad(cantidad + 1)}
                className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label htmlFor='observaciones' className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea 
              placeholder="Notas sobre el préstamo..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>
          <button 
            onClick={handlePrestarEnvase}
            disabled={!tipoEnvase || cantidad <= 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Prestar Envase
          </button>
        </div>
      </div>
    </div>
  );
};

const EnvasesPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [envases, setEnvases] = useState<EnvasePrestado[]>([]);

  useEffect(() => {
    // Simular carga de clientes
    setClientes([
      { id: 1, nombre: "María González", direccion: "Av. San Martín 1234", telefono: "11-1234-5678", email: "maria@email.com" },
      { id: 2, nombre: "Carlos Rodríguez", direccion: "Belgrano 567", telefono: "11-8765-4321", email: "carlos@email.com" },
      { id: 3, nombre: "Ana Martínez", direccion: "Rivadavia 890", telefono: "11-5555-9999", email: "ana@email.com" }
    ]);

    // Simular carga de envases
    setEnvases([
      {
        id: 1,
        clienteId: 1,
        tipo: "Botella 2L",
        cantidad: 3,
        fechaPrestamo: '2024-01-15T10:00:00Z',
        devuelto: false,
        observaciones: 'Para evento'
      },
      {
        id: 2,
        clienteId: 1,
        tipo: "Garrafa 20L",
        cantidad: 1,
        fechaPrestamo: '2024-01-10T14:30:00Z',
        fechaDevolucion: '2024-01-12T09:00:00Z',
        devuelto: true
      },
      {
        id: 3,
        clienteId: 2,
        tipo: "Botella 1L",
        cantidad: 5,
        fechaPrestamo: '2024-01-14T16:00:00Z',
        devuelto: false
      }
    ]);
  }, []);

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const envasesDelCliente = clienteSeleccionado 
    ? envases.filter(e => e.clienteId === clienteSeleccionado.id)
    : [];

  if (clienteSeleccionado) {
    return (
      <EnvaseManager 
        cliente={clienteSeleccionado}
        envasesPrestados={envasesDelCliente}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Gestión de Envases</h1>
        <p className="text-gray-600">Selecciona un cliente para gestionar sus envases</p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de clientes con resumen de envases */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Clientes con Envases</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {clientesFiltrados.map(cliente => {
            const envasesCliente = envases.filter(e => e.clienteId === cliente.id);
            const totalPrestado = envasesCliente
              .filter(e => !e.devuelto)
              .reduce((sum, e) => sum + e.cantidad, 0);

            return (
              <button
                key={cliente.id}
                className="p-4 active:bg-gray-50 cursor-pointer"
                onClick={() => setClienteSeleccionado(cliente)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CubeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{cliente.nombre}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span>{cliente.direccion}</span>
                    </div>
                    <p className="text-sm text-gray-500">{cliente.telefono}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      {totalPrestado} unidades
                    </p>
                    <p className="text-xs text-gray-500">
                      {envasesCliente.filter(e => !e.devuelto).length} préstamos activos
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {clientesFiltrados.length === 0 && searchTerm && (
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}
    </div>
  );
};

export default EnvasesPage;
