'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { authFetch } from '@/lib/api/fetchWithAuth';
import { EMPRESA_COORDENADAS } from './GoogleMapsProvider';
import { getMarkerIcon, MARKER_ICONS, MarkerIconConfig, RepartidorPaletteItem } from '@/lib/map/repartidorMarkers';
import { tieneCoordenadasValidas } from '@/lib/map/clienteCoords';
import {
  clienteCoincideFiltros,
  FiltrosCliente,
  hayFiltrosActivos,
} from '@/lib/map/clienteFiltros';

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  zona: string | number | null;
  repartidor: string | null;
  dia_reparto: string | null;
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
  filtrosMapa?: FiltrosCliente;
  clientesIncluidos?: number[];
  rutaDetallada: [number, number][];
  onActualizarCoordenadas: (clienteId: number, lat: number, lon: number) => void;
  clientesAtendidos?: number[];
  repartidorPalette?: RepartidorPaletteItem[];
}

const mapContainerStyle = { width: '100%', height: '100%' };

const INFO_WINDOW_STYLES = `
  .gm-style-iw-c {
    padding: 0 !important;
  }
  .gm-style-iw-d {
    overflow: visible !important;
    max-height: none !important;
  }
  .gm-style-iw-ch {
    max-height: none !important;
  }
  .gm-style-iw-chr {
    height: 36px !important;
  }
  .map-info-window-body {
    padding: 4px 12px 12px;
    min-width: 220px;
    max-width: 280px;
    font-size: 0.8125rem;
    line-height: 1.35;
    color: #1f2937;
  }
  .map-info-window-row {
    margin: 0 0 4px;
  }
  .map-info-window-row:last-child {
    margin-bottom: 0;
  }
  .map-info-window-label {
    font-weight: 600;
    color: #374151;
  }
`;

function infoWindowOptions(titulo: string): google.maps.InfoWindowOptions {
  return {
    maxWidth: 300,
    headerContent: titulo,
  };
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <p className="map-info-window-row">
      <span className="map-info-window-label">{label}:</span> {value}
    </p>
  );
}

function toGoogleMarkerIcon(icon: MarkerIconConfig): google.maps.Icon {
  return {
    url: icon.url,
    scaledSize: new google.maps.Size(icon.scaledSize.width, icon.scaledSize.height),
    anchor: new google.maps.Point(icon.anchor.x, icon.anchor.y),
  };
}

const MapComponent: React.FC<MapComponentProps> = ({
  clientes,
  mostrarRuta,
  rutaOptimizada,
  clientesOmitidos,
  onToggleOmitirCliente,
  filtrosMapa,
  clientesIncluidos = [],
  rutaDetallada,
  onActualizarCoordenadas,
  clientesAtendidos = [],
  repartidorPalette = [],
}) => {
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    cliente: Cliente;
    lat: number;
    lng: number;
    direccion: string;
  } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-map-info-window', 'true');
    style.textContent = INFO_WINDOW_STYLES;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const clientesConCoords = useMemo(
    () =>
      clientes
        .map((cliente) => {
          const coords = tieneCoordenadasValidas(cliente.latitud, cliente.longitud);
          if (!coords) return null;
          return { ...cliente, latitud: coords.latitud, longitud: coords.longitud };
        })
        .filter((cliente): cliente is Cliente => cliente !== null),
    [clientes]
  );

  const clientesParaVista = useMemo(() => {
    if (!filtrosMapa || !hayFiltrosActivos(filtrosMapa)) {
      return clientesConCoords;
    }
    return clientesConCoords.filter(
      (cliente) =>
        clientesIncluidos.includes(cliente.id) || clienteCoincideFiltros(cliente, filtrosMapa)
    );
  }, [clientesConCoords, filtrosMapa, clientesIncluidos]);

  useEffect(() => {
    if (!map || clientesParaVista.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(EMPRESA_COORDENADAS);
    clientesParaVista.forEach((cliente) => {
      bounds.extend({ lat: cliente.latitud, lng: cliente.longitud });
    });
    map.fitBounds(bounds, 48);
  }, [map, clientesParaVista]);

  const obtenerDireccion = async (lat: number, lon: number) => {
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/geocode/reverse?lat=${lat}&lon=${lon}`
      );
      if (!response.ok) throw new Error('Error en reverse geocoding');
      const data = await response.json();
      return data.formatted_address || data.display_name;
    } catch {
      return 'No se pudo obtener la dirección';
    }
  };

  const handleDragEnd = async (cliente: Cliente, lat: number, lng: number) => {
    setDragPosition({ lat, lng });
    const direccion = await obtenerDireccion(lat, lng);
    setPendingConfirm({ cliente, lat, lng, direccion });
  };

  const confirmarCambio = async () => {
    if (!pendingConfirm) return;
    const { cliente, lat, lng, direccion } = pendingConfirm;
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${cliente.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitud: lat.toString(),
            longitud: lng.toString(),
            direccion,
          }),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar');
      onActualizarCoordenadas(cliente.id, lat, lng);
      setPendingConfirm(null);
      setEditingClienteId(null);
      setDragPosition(null);
      setSelectedCliente(null);
    } catch {
      alert('Error al actualizar las coordenadas. Por favor, intente nuevamente.');
    }
  };

  const cancelarCambio = useCallback(() => {
    setPendingConfirm(null);
    setDragPosition(null);
    setEditingClienteId(null);
  }, []);

  const rutaPath = rutaDetallada.map(([lat, lng]) => ({ lat, lng }));

  const selectedEnRuta = selectedCliente
    ? mostrarRuta &&
      rutaOptimizada.some((c) => c.id === selectedCliente.id) &&
      !clientesOmitidos.includes(selectedCliente.id)
    : false;
  const selectedAtendido = selectedCliente
    ? clientesAtendidos.includes(selectedCliente.id)
    : false;

  return (
    <div className="relative w-full h-full min-h-[45vh] lg:min-h-[70vh]">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={EMPRESA_COORDENADAS}
        zoom={13}
        onLoad={setMap}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
        onClick={() => {
          if (!pendingConfirm) {
            setSelectedCliente(null);
            setEditingClienteId(null);
          }
        }}
      >
        {mostrarRuta && rutaPath.length > 1 && (
          <Polyline
            path={rutaPath}
            options={{
              strokeColor: '#FF0000',
              strokeWeight: 3,
              strokeOpacity: 0.7,
            }}
          />
        )}

        <Marker
          position={EMPRESA_COORDENADAS}
          icon={toGoogleMarkerIcon(MARKER_ICONS.empresa)}
          title="Sodería - Punto de partida"
        />

        {clientesConCoords.map((cliente) => {
          const isEditing = editingClienteId === cliente.id;
          const position =
            isEditing && dragPosition
              ? dragPosition
              : { lat: cliente.latitud, lng: cliente.longitud };
          const enRuta =
            mostrarRuta &&
            rutaOptimizada.some((c) => c.id === cliente.id) &&
            !clientesOmitidos.includes(cliente.id);
          const atendido = clientesAtendidos.includes(cliente.id);
          const incluidoManualmente = clientesIncluidos.includes(cliente.id);
          const markerIcon = getMarkerIcon(cliente, {
            filtros: filtrosMapa,
            mostrarRuta,
            enRuta,
            atendido,
            palette: repartidorPalette,
            incluidoManualmente,
          });

          return (
            <Marker
              key={cliente.id}
              position={position}
              icon={toGoogleMarkerIcon(markerIcon)}
              draggable={isEditing}
              onClick={() => setSelectedCliente(cliente)}
              onDragEnd={(e) => {
                if (e.latLng) {
                  handleDragEnd(cliente, e.latLng.lat(), e.latLng.lng());
                }
              }}
            />
          );
        })}

        {selectedCliente && !pendingConfirm && (
          <InfoWindow
            position={{
              lat: selectedCliente.latitud,
              lng: selectedCliente.longitud,
            }}
            options={infoWindowOptions(selectedCliente.nombre)}
            onCloseClick={() => setSelectedCliente(null)}
          >
            <div className="map-info-window-body">
              <InfoRow label="Dirección" value={selectedCliente.direccion} />
              <InfoRow label="Teléfono" value={selectedCliente.telefono} />
              <InfoRow label="Zona" value={selectedCliente.zona} />
              <InfoRow label="Repartidor" value={selectedCliente.repartidor} />
              <InfoRow label="Día de reparto" value={selectedCliente.dia_reparto} />
              {mostrarRuta && selectedEnRuta && (
                <p className={`map-info-window-row font-semibold ${selectedAtendido ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedAtendido ? '✓ Cliente atendido hoy' : 'Pendiente de visita'}
                </p>
              )}
              {mostrarRuta && (
                <>
                  <p className="map-info-window-row">
                    <span className="map-info-window-label">Orden en ruta:</span>{' '}
                    {rutaOptimizada.findIndex((c) => c.id === selectedCliente.id) + 1}
                  </p>
                  <button
                    type="button"
                    className={`px-3 py-1.5 mt-2 text-xs text-white rounded ${
                      clientesOmitidos.includes(selectedCliente.id)
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                    onClick={() => onToggleOmitirCliente(selectedCliente.id)}
                  >
                    {clientesOmitidos.includes(selectedCliente.id)
                      ? 'Incluir en ruta'
                      : 'Omitir de ruta'}
                  </button>
                </>
              )}
              <button
                type="button"
                className="px-3 py-1.5 mt-2 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
                onClick={() => {
                  setEditingClienteId(selectedCliente.id);
                  setDragPosition({
                    lat: selectedCliente.latitud,
                    lng: selectedCliente.longitud,
                  });
                }}
              >
                Editar ubicación
              </button>
            </div>
          </InfoWindow>
        )}

        {pendingConfirm && (
          <InfoWindow
            position={{ lat: pendingConfirm.lat, lng: pendingConfirm.lng }}
            options={infoWindowOptions('Confirmar ubicación')}
            onCloseClick={cancelarCambio}
          >
            <div className="map-info-window-body">
              <p className="map-info-window-row font-semibold">
                ¿Cambiar ubicación de {pendingConfirm.cliente.nombre}?
              </p>
              <InfoRow label="Dirección" value={pendingConfirm.direccion} />
              <p className="map-info-window-row">
                <span className="map-info-window-label">Lat:</span> {pendingConfirm.lat.toFixed(6)}
              </p>
              <p className="map-info-window-row">
                <span className="map-info-window-label">Lng:</span> {pendingConfirm.lng.toFixed(6)}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                  onClick={confirmarCambio}
                >
                  Sí
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                  onClick={cancelarCambio}
                >
                  No
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="absolute bottom-2 left-2 z-10 p-2 text-xs bg-white rounded shadow opacity-90">
        Datos del mapa © Google
      </div>
    </div>
  );
};

export default MapComponent;
