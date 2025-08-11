"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  CreditCardIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

interface Fiado {
  id: number;
  clienteId: number;
  monto: number;
  fecha: string;
  observaciones: string;
  pagado: boolean;
  fechaPago?: string;
  montoPagado?: number;
}

interface FiadoItemProps {
  fiado: Fiado;
  cliente: Cliente;
  onPago: (monto: number) => void;
}

const FiadoItem: React.FC<FiadoItemProps> = ({ fiado, cliente, onPago }) => {
  const [mostrarPago, setMostrarPago] = useState(false);
  const [montoPago, setMontoPago] = useState(fiado.monto);

  const handlePago = () => {
    onPago(montoPago);
    setMostrarPago(false);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{cliente.nombre}</h3>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>{new Date(fiado.fecha).toLocaleDateString('es-ES')}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{fiado.observaciones}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${fiado.pagado ? 'text-green-600' : 'text-red-600'}`}>
            ${fiado.monto.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            {fiado.pagado ? 'Pagado' : 'Pendiente'}
          </p>
        </div>
      </div>

      {!fiado.pagado && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {!mostrarPago ? (
            <button
              onClick={() => setMostrarPago(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Registrar Pago
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor='monto' className="block text-sm font-medium text-gray-700 mb-1">
                  Monto a pagar
                </label>
                <input
                  type="number"
                  value={montoPago}
                  onChange={(e) => setMontoPago(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min="0"
                  max={fiado.monto}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePago}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Confirmar Pago
                </button>
                <button
                  onClick={() => setMostrarPago(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FiadoManager: React.FC<{ cliente: Cliente; fiadosExistentes: Fiado[] }> = ({ 
  cliente, 
  fiadosExistentes 
}) => {
  const [nuevoFiado, setNuevoFiado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fiados, setFiados] = useState<Fiado[]>(fiadosExistentes);

  const totalPendiente = fiados
    .filter(f => !f.pagado)
    .reduce((sum, f) => sum + f.monto, 0);

  const handleAgregarFiado = () => {
    if (!nuevoFiado || Number(nuevoFiado) <= 0) return;

    const nuevoFiadoObj: Fiado = {
      id: Date.now(),
      clienteId: cliente.id,
      monto: Number(nuevoFiado),
      fecha: new Date().toISOString(),
      observaciones,
      pagado: false
    };

    setFiados(prev => [nuevoFiadoObj, ...prev]);
    setNuevoFiado('');
    setObservaciones('');
  };

  const handlePagoFiado = (fiadoId: number, monto: number) => {
    setFiados(prev => prev.map(f => 
      f.id === fiadoId 
        ? { 
            ...f, 
            pagado: true, 
            fechaPago: new Date().toISOString(),
            montoPagado: monto
          }
        : f
    ));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Resumen de fiados */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Fiados de {cliente.nombre}</h2>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Pendiente:</span>
          <span className="text-xl font-bold text-red-600">
            ${totalPendiente.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Lista de fiados */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Historial de Fiados</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {fiados.map(fiado => (
            <div key={fiado.id} className="p-4">
              <FiadoItem 
                fiado={fiado}
                cliente={cliente}
                onPago={(monto) => handlePagoFiado(fiado.id, monto)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Agregar nuevo fiado */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-3 text-gray-800">Nuevo Fiado</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor='monto' className="block text-sm font-medium text-gray-700 mb-1">
              Monto
            </label>
            <input 
              type="number"
              placeholder="Ingresa el monto"
              value={nuevoFiado}
              onChange={(e) => setNuevoFiado(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor='observaciones' className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea 
              placeholder="Descripción del fiado..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>
          <button 
            onClick={handleAgregarFiado}
            disabled={!nuevoFiado || Number(nuevoFiado) <= 0}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Agregar Fiado
          </button>
        </div>
      </div>
    </div>
  );
};

const FiadosPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [fiados, setFiados] = useState<Fiado[]>([]);

  useEffect(() => {
    // Simular carga de clientes
    setClientes([
      { id: 1, nombre: "María González", direccion: "Av. San Martín 1234", telefono: "11-1234-5678", email: "maria@email.com" },
      { id: 2, nombre: "Carlos Rodríguez", direccion: "Belgrano 567", telefono: "11-8765-4321", email: "carlos@email.com" },
      { id: 3, nombre: "Ana Martínez", direccion: "Rivadavia 890", telefono: "11-5555-9999", email: "ana@email.com" }
    ]);

    // Simular carga de fiados
    setFiados([
      {
        id: 1,
        clienteId: 1,
        monto: 5000,
        fecha: '2024-01-15T10:00:00Z',
        observaciones: 'Soda y agua',
        pagado: false
      },
      {
        id: 2,
        clienteId: 1,
        monto: 3000,
        fecha: '2024-01-10T14:30:00Z',
        observaciones: 'Limonada',
        pagado: true,
        fechaPago: '2024-01-12T09:00:00Z',
        montoPagado: 3000
      },
      {
        id: 3,
        clienteId: 2,
        monto: 8000,
        fecha: '2024-01-14T16:00:00Z',
        observaciones: 'Varios productos',
        pagado: false
      }
    ]);
  }, []);

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fiadosDelCliente = clienteSeleccionado 
    ? fiados.filter(f => f.clienteId === clienteSeleccionado.id)
    : [];

  if (clienteSeleccionado) {
    return (
      <FiadoManager 
        cliente={clienteSeleccionado}
        fiadosExistentes={fiadosDelCliente}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Gestión de Fiados</h1>
        <p className="text-gray-600">Selecciona un cliente para gestionar sus fiados</p>
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

      {/* Lista de clientes con resumen de fiados */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Clientes con Fiados</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {clientesFiltrados.map(cliente => {
            const fiadosCliente = fiados.filter(f => f.clienteId === cliente.id);
            const totalPendiente = fiadosCliente
              .filter(f => !f.pagado)
              .reduce((sum, f) => sum + f.monto, 0);

            return (
              <button
                key={cliente.id}
                className="p-4 active:bg-gray-50 cursor-pointer"
                onClick={() => setClienteSeleccionado(cliente)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <CreditCardIcon className="w-5 h-5 text-orange-600" />
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
                    <p className="text-sm font-semibold text-red-600">
                      ${totalPendiente.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fiadosCliente.filter(f => !f.pagado).length} fiados pendientes
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

export default FiadosPage;
