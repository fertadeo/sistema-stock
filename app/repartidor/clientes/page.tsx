"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  CubeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  zona: string;
  repartidor: string;
  dia_reparto: string;
  ultima_compra?: string;
  total_compras?: number;
  fiados_pendientes?: number;
  envases_prestados?: number;
}

interface ClienteDetalleProps {
  cliente: Cliente;
  onBack: () => void;
}

const ClienteDetalle: React.FC<ClienteDetalleProps> = ({ cliente, onBack }) => {
  const router = useRouter();

  const accionesRapidas = [
    {
      titulo: "Nueva Venta",
      icono: <ShoppingCartIcon className="w-6 h-6" />,
      color: "green",
      accion: () => router.push(`/repartidor/ventas?cliente=${cliente.id}`)
    },
    {
      titulo: "Gestionar Fiados",
      icono: <CreditCardIcon className="w-6 h-6" />,
      color: "orange",
      accion: () => router.push(`/repartidor/fiados?cliente=${cliente.id}`)
    },
    {
      titulo: "Gestionar Envases",
      icono: <CubeIcon className="w-6 h-6" />,
      color: "blue",
      accion: () => router.push(`/repartidor/envases?cliente=${cliente.id}`)
    }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header con botón de regreso */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowRightIcon className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Detalle del Cliente</h1>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{cliente.nombre}</h2>
      </div>

      {/* Información del cliente */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Información de Contacto</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <MapPinIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Dirección</p>
              <p className="font-medium text-gray-800">{cliente.direccion}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="font-medium text-gray-800">{cliente.telefono}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-800">{cliente.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información de reparto */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Información de Reparto</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Zona</p>
            <p className="font-medium text-gray-800">{cliente.zona}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Repartidor</p>
            <p className="font-medium text-gray-800">{cliente.repartidor}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Día de Reparto</p>
            <p className="font-medium text-gray-800">{cliente.dia_reparto}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Última Compra</p>
            <p className="font-medium text-gray-800">
              {cliente.ultima_compra 
                ? new Date(cliente.ultima_compra).toLocaleDateString('es-ES')
                : 'Sin compras'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de actividad */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Resumen de Actividad</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{cliente.total_compras || 0}</p>
            <p className="text-xs text-gray-600">Compras Totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{cliente.fiados_pendientes || 0}</p>
            <p className="text-xs text-gray-600">Fiados Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{cliente.envases_prestados || 0}</p>
            <p className="text-xs text-gray-600">Envases Prestados</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Acciones Rápidas</h3>
        <div className="space-y-3">
          {accionesRapidas.map((accion, index) => (
            <button
              key={index}
              onClick={accion.accion}
              className={`w-full p-4 rounded-lg flex items-center justify-between transition-colors ${
                accion.color === 'green' ? 'bg-green-50 hover:bg-green-100 text-green-700' :
                accion.color === 'orange' ? 'bg-orange-50 hover:bg-orange-100 text-orange-700' :
                'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                {accion.icono}
                <span className="font-medium">{accion.titulo}</span>
              </div>
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ClientesPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [filtroZona, setFiltroZona] = useState('');

  useEffect(() => {
    // Simular carga de clientes
    setClientes([
      {
        id: 1,
        nombre: "María González",
        direccion: "Av. San Martín 1234",
        telefono: "11-1234-5678",
        email: "maria@email.com",
        zona: "Centro",
        repartidor: "Juan Pérez",
        dia_reparto: "Lunes",
        ultima_compra: "2024-01-15T10:00:00Z",
        total_compras: 15,
        fiados_pendientes: 2,
        envases_prestados: 3
      },
      {
        id: 2,
        nombre: "Carlos Rodríguez",
        direccion: "Belgrano 567",
        telefono: "11-8765-4321",
        email: "carlos@email.com",
        zona: "Norte",
        repartidor: "Ana López",
        dia_reparto: "Miércoles",
        ultima_compra: "2024-01-14T16:00:00Z",
        total_compras: 8,
        fiados_pendientes: 1,
        envases_prestados: 5
      },
      {
        id: 3,
        nombre: "Ana Martínez",
        direccion: "Rivadavia 890",
        telefono: "11-5555-9999",
        email: "ana@email.com",
        zona: "Sur",
        repartidor: "Pedro García",
        dia_reparto: "Viernes",
        total_compras: 3,
        fiados_pendientes: 0,
        envases_prestados: 1
      }
    ]);
  }, []);

  const clientesFiltrados = clientes.filter(cliente => {
    const coincideBusqueda = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            cliente.telefono.includes(searchTerm);
    
    const coincideZona = !filtroZona || cliente.zona === filtroZona;
    
    return coincideBusqueda && coincideZona;
  });

  const zonas = Array.from(new Set(clientes.map(c => c.zona)));

  if (clienteSeleccionado) {
    return (
      <ClienteDetalle 
        cliente={clienteSeleccionado}
        onBack={() => setClienteSeleccionado(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Clientes</h1>
        <p className="text-gray-600">Gestiona la información de tus clientes</p>
      </div>

      {/* Buscador y filtros */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre, dirección o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="">Todas las zonas</option>
              {zonas.map(zona => (
                <option key={zona} value={zona}>{zona}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">
            Clientes ({clientesFiltrados.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {clientesFiltrados.map(cliente => (
            <button
              key={cliente.id}
              className="p-6 active:bg-gray-50 cursor-pointer hover:bg-gray-50 transition-colors w-full text-left"
              onClick={() => setClienteSeleccionado(cliente)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-lg">{cliente.nombre}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{cliente.direccion}</span>
                  </div>
                  <div className="flex items-center mt-2 space-x-4">
                    <p className="text-sm text-gray-500">{cliente.telefono}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {cliente.zona}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                    {(cliente.fiados_pendientes ?? 0) > 0 && (
                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded">
                        {cliente.fiados_pendientes ?? 0} fiados
                      </span>
                    )}
                    {(cliente.envases_prestados ?? 0) > 0 && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {cliente.envases_prestados ?? 0} envases
                      </span>
                    )}
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {clientesFiltrados.length === 0 && (searchTerm || filtroZona) && (
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}

      {/* Botón para agregar nuevo cliente */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <button
          onClick={() => router.push('/repartidor/clientes/nuevo')}
          className="w-full bg-teal-600 text-white py-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Agregar Nuevo Cliente</span>
        </button>
      </div>
    </div>
  );
};

export default ClientesPage;
