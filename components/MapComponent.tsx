'use client'

import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  zona: string;
  repartidor: string;
  dia_reparto: string;
  latitud: number;
  longitud: number;
}

interface MapComponentProps {
  clientes: Cliente[];
  mostrarRuta: boolean;
  rutaOptimizada: Cliente[];
  clientesOmitidos: number[];
  onToggleOmitirCliente: (clienteId: number) => void;
  onGenerarRuta: (clientesPersonalizados?: Cliente[]) => Promise<void>;
  onLimpiarRuta: () => void;
}

// Coordenadas de la empresa
const EMPRESA_COORDENADAS: [number, number] = [-33.141709, -64.3634274];

// Íconos personalizados para cada repartidor
const iconAxel = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconGustavo = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconDavid = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const center: [number, number] = [-33.1235, -64.3493]; // Río Cuarto

// Fix para los íconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapComponent: React.FC<MapComponentProps> = ({
  clientes,
  mostrarRuta,
  rutaOptimizada,
  clientesOmitidos,
  onToggleOmitirCliente,
  onGenerarRuta,
  onLimpiarRuta
}) => {
  // Referencia al mapa
  const mapRef = useRef<any>(null);

  // Estado para edición de ubicación
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
  const [tempPosition, setTempPosition] = useState<[number, number] | null>(null);

  // Estado para la ruta detallada (siguiendo calles)
  const [rutaDetallada, setRutaDetallada] = useState<[number, number][]>([]);

  // Función para obtener la ruta real desde OSRM
  async function obtenerRutaDetallada(puntos: [number, number][]) {
    const coords = puntos.map(p => `${p[1]},${p[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes.length > 0) {
      // Devuelve un array de [lat, lng]
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    }
    return [];
  }

  // Actualizar la ruta detallada cuando cambia la ruta optimizada
  useEffect(() => {
    if (mostrarRuta && rutaOptimizada.length > 1) {
      const puntos = [
        EMPRESA_COORDENADAS,
        ...rutaOptimizada.map(c => [c.latitud, c.longitud] as [number, number]),
        EMPRESA_COORDENADAS
      ];
      obtenerRutaDetallada(puntos).then(setRutaDetallada);
    } else {
      setRutaDetallada([]);
    }
  }, [mostrarRuta, rutaOptimizada]);

  // Componente para eventos del mapa
  const MapEvents = () => {
    useMapEvents({
      click: () => {
        setEditingClienteId(null);
        setTempPosition(null);
      }
    });
    return null;
  };

  return (
    <MapContainer
      ref={mapRef}
      center={EMPRESA_COORDENADAS}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
    >
      <MapEvents />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Polyline de la ruta recomendada siguiendo calles */}
      {mostrarRuta && rutaDetallada.length > 1 && (
        <Polyline positions={rutaDetallada} color="#FF0000" weight={3} opacity={0.7} />
      )}
      {/* Marcador de la empresa */}
      <Marker 
        position={EMPRESA_COORDENADAS}
        icon={new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })}
      >
        <Popup>
          <div>
            <h2 className="font-bold">Soderia</h2>
            <p>Punto de partida</p>
          </div>
        </Popup>
      </Marker>
      {/* Marcadores de clientes */}
      {clientes.map((cliente) => {
        const estaOmitido = clientesOmitidos.includes(cliente.id);
        // Determinar el ícono a usar
        let icono = iconAxel; // default
        if (cliente.repartidor === 'Gustavo Careaga') {
          icono = iconGustavo;
        } else if (cliente.repartidor && cliente.repartidor.toLowerCase().includes('david')) {
          icono = iconDavid;
        }
        // Si el cliente está en edición, el marcador es draggable
        const isEditing = editingClienteId === cliente.id;
        return (
          <Marker 
            key={cliente.id} 
            position={isEditing && tempPosition ? tempPosition : [cliente.latitud, cliente.longitud]}
            icon={icono}
            draggable={isEditing}
            eventHandlers={
              isEditing
                ? {
                    dragend: (e: any) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      setTempPosition([position.lat, position.lng]);
                      // Aquí puedes llamar a una función para actualizar la ubicación en el backend
                    }
                  }
                : undefined
            }
          >
            <Popup>
              <div>
                <h2 className="font-bold">{cliente.nombre}</h2>
                <p><span className="font-semibold">Dirección:</span> {cliente.direccion}</p>
                <p><span className="font-semibold">Teléfono:</span> {cliente.telefono}</p>
                <p><span className="font-semibold">Zona:</span> {cliente.zona}</p>
                <p><span className="font-semibold">Repartidor:</span> {cliente.repartidor}</p>
                <p><span className="font-semibold">Día de reparto:</span> {cliente.dia_reparto}</p>
                {mostrarRuta && (
                  <>
                    <p>
                      <span className="font-semibold">Orden en ruta:</span>{" "}
                      {rutaOptimizada.findIndex((c) => c.id === cliente.id) + 1}
                    </p>
                    <button
                      className={`px-3 py-1 mt-2 text-white rounded ${
                        estaOmitido ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                      }`}
                      onClick={() => onToggleOmitirCliente(cliente.id)}
                    >
                      {estaOmitido ? "Incluir en ruta" : "Omitir de ruta"}
                    </button>
                  </>
                )}
                <button
                  className="px-3 py-1 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                  onClick={() => {
                    setEditingClienteId(cliente.id);
                    setTempPosition([cliente.latitud, cliente.longitud]);
                  }}
                >
                  Editar ubicación
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapComponent; 