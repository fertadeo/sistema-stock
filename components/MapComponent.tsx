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
  repartidorSeleccionado?: string;
  rutaDetallada: [number, number][];
  onActualizarCoordenadas: (clienteId: number, lat: number, lon: number) => void;
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

const iconGris = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MapComponent: React.FC<MapComponentProps> = ({
  clientes,
  mostrarRuta,
  rutaOptimizada,
  clientesOmitidos,
  onToggleOmitirCliente,
  onGenerarRuta,
  onLimpiarRuta,
  repartidorSeleccionado,
  rutaDetallada: rutaDetalladaProp,
  onActualizarCoordenadas
}) => {
  const mapRef = useRef<any>(null);
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
  const [tempPosition, setTempPosition] = useState<[number, number] | null>(null);
  const [originalPosition, setOriginalPosition] = useState<[number, number] | null>(null);
  const [pendingCliente, setPendingCliente] = useState<Cliente | null>(null);
  const [pendingLatLng, setPendingLatLng] = useState<[number, number] | null>(null);
  const [pendingDireccion, setPendingDireccion] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Filtrar clientes y rutaOptimizada por repartidor si se pasa la prop
  const clientesFiltrados = repartidorSeleccionado
    ? clientes.filter(c => c.repartidor === repartidorSeleccionado || !c.repartidor || c.repartidor.trim() === "")
    : clientes;
  const rutaOptimizadaFiltrada = repartidorSeleccionado
    ? rutaOptimizada.filter(c => c.repartidor === repartidorSeleccionado || !c.repartidor || c.repartidor.trim() === "")
    : rutaOptimizada;

  // Función para obtener la ruta real desde OSRM
  const obtenerRutaDetallada = async (origen: [number, number], destino: [number, number]) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (response.status === 429) {
        alert('Has superado el límite de peticiones de rutas de OSRM. Intenta de nuevo en unos segundos o reduce la cantidad de clientes.');
        return null;
      }
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        return {
          coordenadas: data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
          distancia: data.routes[0].distance,
          duracion: data.routes[0].duration
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error al obtener la ruta detallada:', error);
      return null;
    }
  };

  // Actualizar la ruta detallada cuando cambia la ruta optimizada
  useEffect(() => {
    if (mostrarRuta && rutaOptimizadaFiltrada.length >= 1) {
      const puntos = [
        EMPRESA_COORDENADAS,
        ...rutaOptimizadaFiltrada.map(c => [c.latitud, c.longitud] as [number, number]),
        EMPRESA_COORDENADAS
      ];
      obtenerRutaDetallada(puntos[0], puntos[puntos.length - 1]).then((ruta) => {
        if (ruta) {
          // setRutaDetallada(ruta.coordenadas);
        }
      });
    } else {
      // setRutaDetallada([]);
    }
  }, [mostrarRuta, rutaOptimizadaFiltrada]);

  // Envolver onLimpiarRuta para limpiar también la rutaDetallada y cancelar fetch
  const handleLimpiarRuta = () => {
    onLimpiarRuta();
  };

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

  const obtenerRutaCompleta = async (clientes: Cliente[]) => {
    if (clientes.length === 0) return { coordenadas: [], distancia: 0, tiempo: 0 };

    // Construir el array de puntos: empresa, clientes..., empresa
    const puntos = [
      EMPRESA_COORDENADAS,
      ...clientes.map(c => [c.latitud, c.longitud]),
      EMPRESA_COORDENADAS
    ];

    // Construir la URL para OSRM con todos los puntos
    const coords = puntos.map(p => `${p[1]},${p[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      if (response.status === 429) {
        alert('Has superado el límite de peticiones de rutas de OSRM. Intenta de nuevo en unos segundos o reduce la cantidad de clientes.');
        return { coordenadas: [], distancia: 0, tiempo: 0 };
      }
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        return {
          coordenadas: data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
          distancia: data.routes[0].distance,
          tiempo: data.routes[0].duration
        };
      }
      return { coordenadas: [], distancia: 0, tiempo: 0 };
    } catch (error) {
      console.error('Error al obtener la ruta completa:', error);
      return { coordenadas: [], distancia: 0, tiempo: 0 };
    }
  };

  // Reverse geocoding para obtener la dirección
  const obtenerDireccion = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SoderiaApp/1.0'
          }
        }
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      return 'No se pudo obtener la dirección';
    }
  };

  // Event listeners para los botones del popup
  useEffect(() => {
    const handleConfirmar = async (e: Event) => {
      const customEvent = e as CustomEvent<{ clienteId: number; lat: number; lng: number }>;
      const { clienteId, lat, lng } = customEvent.detail;
      try {
        const response = await fetch(`/api/clientes/${clienteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitud: lat.toString(),
            longitud: lng.toString()
          })
        });

        if (!response.ok) {
          throw new Error('Error al actualizar las coordenadas');
        }

      onActualizarCoordenadas(clienteId, lat, lng);
      setShowConfirm(false);
      setPendingCliente(null);
      setPendingLatLng(null);
      setPendingDireccion("");
      } catch (error) {
        console.error('Error al actualizar las coordenadas:', error);
        alert('Error al actualizar las coordenadas. Por favor, intente nuevamente.');
      }
    };
    const handleCancelar = () => {
      if (originalPosition) {
        setTempPosition(originalPosition);
      }
      setShowConfirm(false);
      setPendingCliente(null);
      setPendingLatLng(null);
      setPendingDireccion("");
    };
    document.addEventListener('confirmarCambioUbicacion', handleConfirmar);
    document.addEventListener('cancelarCambioUbicacion', handleCancelar);
    return () => {
      document.removeEventListener('confirmarCambioUbicacion', handleConfirmar);
      document.removeEventListener('cancelarCambioUbicacion', handleCancelar);
    };
  }, [originalPosition, onActualizarCoordenadas]);

  // Mostrar el popup de confirmación cuando la dirección esté lista
  useEffect(() => {
    if (showConfirm && pendingCliente && pendingLatLng && pendingDireccion) {
      const [lat, lng] = pendingLatLng;
      const popup = L.popup()
        .setLatLng([lat, lng])
        .setContent(`
          <div class="p-2">
            <p class="mb-2 font-bold">¿Quieres cambiar la ubicación de:</p>
            <p><b>Nombre:</b> ${pendingCliente.nombre}</p>
            <p><b>Dirección:</b> ${pendingDireccion}</p>
            <p><b>Teléfono:</b> ${pendingCliente.telefono}</p>
            <p><b>Zona:</b> ${pendingCliente.zona}</p>
            <p><b>Repartidor:</b> ${pendingCliente.repartidor}</p>
            <p><b>Día de reparto:</b> ${pendingCliente.dia_reparto}</p>
            <p><b>Lat:</b> ${lat.toFixed(6)}</p>
            <p><b>Lng:</b> ${lng.toFixed(6)}</p>
            <div class="flex gap-2 mt-2">
              <button 
                class="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                onclick="document.dispatchEvent(new CustomEvent('confirmarCambioUbicacion', { detail: { clienteId: ${pendingCliente.id}, lat: ${lat}, lng: ${lng} } }))"
              >
                Sí
              </button>
              <button 
                class="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                onclick="document.dispatchEvent(new CustomEvent('cancelarCambioUbicacion'))"
              >
                No
              </button>
            </div>
          </div>
        `)
        .openOn(mapRef.current?.leafletElement || mapRef.current?._leaflet_map || mapRef.current);
    }
  }, [showConfirm, pendingCliente, pendingLatLng, pendingDireccion]);

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
      {mostrarRuta && rutaDetalladaProp.length > 1 && (
        <Polyline positions={rutaDetalladaProp} color="#FF0000" weight={3} opacity={0.7} />
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
        if (repartidorSeleccionado) {
          if (cliente.repartidor === repartidorSeleccionado) {
            if (cliente.repartidor === 'Axel Torres') {
              icono = iconAxel;
            } else if (cliente.repartidor === 'Gustavo Careaga') {
              icono = iconGustavo;
            } else if (cliente.repartidor && cliente.repartidor.toLowerCase().includes('david')) {
              icono = iconDavid;
            } else {
              icono = iconAxel; // fallback
            }
          } else {
            icono = iconGris;
          }
        } else {
          if (!cliente.repartidor || cliente.repartidor.trim() === "") {
            icono = iconGris;
          } else if (cliente.repartidor === 'Gustavo Careaga') {
            icono = iconGustavo;
          } else if (cliente.repartidor && cliente.repartidor.toLowerCase().includes('david')) {
            icono = iconDavid;
          } else if (cliente.repartidor === 'Axel Torres') {
            icono = iconAxel;
          } else {
            icono = iconAxel; // fallback
          }
        }
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
                    dragstart: () => {
                      setOriginalPosition([cliente.latitud, cliente.longitud]);
                    },
                    dragend: async (e: any) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      setTempPosition([position.lat, position.lng]);
                      setPendingCliente(cliente);
                      setPendingLatLng([position.lat, position.lng]);
                      setShowConfirm(false);
                      setPendingDireccion("");
                      // Obtener dirección y luego mostrar popup
                      const direccion = await obtenerDireccion(position.lat, position.lng);
                      setPendingDireccion(direccion);
                      setShowConfirm(true);
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
      <div className="p-3 mt-4 bg-gray-50 rounded-lg">
        <h3 className="mb-2 text-sm font-semibold">Leyenda de repartidores:</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2 items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Axel</span>
          </li>
          <li className="flex gap-2 items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Gustavo Careaga</span>
          </li>
          <li className="flex gap-2 items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>David Schenatti</span>
          </li>
          <li className="flex gap-2 items-center">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span>Clientes filtrados</span>
          </li>
          <li className="flex gap-2 items-center">
            <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
            <span>Clientes sin repartidor asignado</span>
          </li>
        </ul>
      </div>
    </MapContainer>
  );
};

export default MapComponent; 