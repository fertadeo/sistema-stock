"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCartIcon, 
  CreditCardIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  PlusIcon,
  UserPlusIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface ResumenCardProps {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
  color: 'green' | 'orange' | 'blue' | 'purple' | 'red';
}

const ResumenCard: React.FC<ResumenCardProps> = ({ titulo, valor, icono, color }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{titulo}</p>
          <p className="text-xl font-bold">{valor}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
          {icono}
        </div>
      </div>
    </div>
  );
};

interface ClienteCardProps {
  cliente: {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    proximaEntrega?: string;
  };
  onPress: () => void;
}

const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, onPress }) => {
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se active el onClick del card
    
    // Formatear el número de teléfono (remover espacios, guiones, etc.)
    const telefonoLimpio = cliente.telefono.replace(/\D/g, '');
    
    // Mensaje predefinido
    const mensaje = `Hola ${cliente.nombre}! 👋 Soy el repartidor de Soderia Don Javier. Te aviso que estaré llegando a tu dirección (${cliente.direccion}) en los próximos minutos. ¿Estás disponible para recibir tu pedido? 🚚`;
    
    // Crear URL de WhatsApp
    const urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp en nueva pestaña
    window.open(urlWhatsApp, '_blank');
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 w-full max-w-sm mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 truncate">{cliente.nombre}</h3>
            {cliente.proximaEntrega && (
              <div className="flex items-center text-xs text-orange-600 ml-2 flex-shrink-0">
                <ClockIcon className="w-3 h-3 mr-1" />
                <span>{cliente.proximaEntrega}</span>
              </div>
            )}
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{cliente.direccion}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{cliente.telefono}</p>
        </div>
        
        {/* Botón de WhatsApp */}
        <button
          onClick={handleWhatsAppClick}
          className="ml-3 p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors flex-shrink-0"
          title="Enviar mensaje por WhatsApp"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Botón principal del card */}
      <button 
        className="w-full mt-3 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        onClick={onPress}
      >
        Ver Detalles
      </button>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, color }) => {
  const colorClasses = {
    green: 'bg-green-600 hover:bg-green-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };

  return (
    <button
      onClick={onPress}
      className={`${colorClasses[color]} text-white py-4 px-4 rounded-lg font-semibold flex flex-col items-center space-y-2 transition-colors`}
    >
      <div className="w-6 h-6">
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );
};

const RepartidorDashboard: React.FC = () => {
  const router = useRouter();
  const [resumen, setResumen] = useState({
    ventasRealizadas: 12,
    montoTotal: 45600,
    fiadosPendientes: 3,
    envasesPrestados: 8
  });

  const [proximasEntregas] = useState([
    {
      id: 1,
      nombre: "María González",
      direccion: "Av. San Martín 1234",
      telefono: "3541222719",
      proximaEntrega: "14:30"
    },
    {
      id: 2,
      nombre: "Carlos Rodríguez",
      direccion: "Belgrano 567",
      telefono: "3541222719",
      proximaEntrega: "15:00"
    },
    {
      id: 3,
      nombre: "Ana Martínez",
      direccion: "Rivadavia 890",
      telefono: "3541222719"
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Acciones rápidas - Primero en móvil, después en desktop */}
      <section className="bg-white rounded-lg p-6 shadow-sm order-1 lg:order-2">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionButton 
            icon={<PlusIcon className="w-6 h-6" />}
            label="Nueva Venta"
            onPress={() => router.push('/repartidor/ventas')}
            color="green"
          />
          <ActionButton 
            icon={<UserPlusIcon className="w-6 h-6" />}
            label="Nuevo Cliente"
            onPress={() => router.push('/repartidor/clientes/nuevo')}
            color="blue"
          />
        </div>
      </section>

      {/* Tarjetas de resumen - Después en móvil, primero en desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 order-2 lg:order-1">
        <ResumenCard 
          titulo="Ventas Hoy"
          valor={`$${resumen.ventasRealizadas.toLocaleString()}`}
          icono={<ShoppingCartIcon className="w-6 h-6" />}
          color="green"
        />
        <ResumenCard 
          titulo="Fiados Pendientes"
          valor={resumen.fiadosPendientes.toString()}
          icono={<CreditCardIcon className="w-6 h-6" />}
          color="orange"
        />
        <ResumenCard 
          titulo="Envases Prestados"
          valor={resumen.envasesPrestados.toString()}
          icono={<CubeIcon className="w-6 h-6" />}
          color="blue"
        />
        <ResumenCard 
          titulo="Monto Total"
          valor={`$${resumen.montoTotal.toLocaleString()}`}
          icono={<CurrencyDollarIcon className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Layout de dos columnas para desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 order-3">
        {/* Próximas entregas */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Próximas Entregas</h2>
          <div className="space-y-3">
            {proximasEntregas.map(cliente => (
              <ClienteCard 
                key={cliente.id}
                cliente={cliente}
                onPress={() => router.push(`/repartidor/clientes/${cliente.id}`)}
              />
            ))}
          </div>
        </section>

        {/* Espacio vacío en desktop para mantener el layout de dos columnas */}
        <div className="hidden lg:block"></div>
      </div>

      {/* Alertas del día */}
      <section className="bg-white rounded-lg p-6 shadow-sm order-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Alertas del Día</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
            <span className="text-sm text-orange-800">3 fiados vencidos requieren atención</span>
          </div>
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-sm text-blue-800">5 envases pendientes de devolución</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RepartidorDashboard;
