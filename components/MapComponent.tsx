'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { authFetch } from '@/lib/api/fetchWithAuth';
import { EMPRESA_COORDENADAS } from './GoogleMapsProvider';
import { getMarkerIcon, MARKER_ICONS } from '@/lib/map/repartidorMarkers';

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
  clientesAtendidos?: number[];
}

const mapContainerStyle = { width: '100%', height: '100%' };

const MapComponent: React.FC<MapComponentProps> = ({
  clientes,
  mostrarRuta,
  rutaOptimizada,
  clientesOmitidos,
  onToggleOmitirCliente,
  repartidorSeleccionado,
  rutaDetallada,
  onActualizarCoordenadas,
  clientesAtendidos = [],
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
          icon={MARKER_ICONS.empresa}
          title="Sodería - Punto de partida"
        />

        {clientes.map((cliente) => {
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
          const iconUrl = getMarkerIcon(cliente, {
            repartidorSeleccionado,
            mostrarRuta,
            enRuta,
            atendido,
          });

          return (
            <Marker
              key={cliente.id}
              position={position}
              icon={iconUrl}
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
            onCloseClick={() => setSelectedCliente(null)}
          >
            <div className="max-w-xs text-sm">
              <h2 className="font-bold">{selectedCliente.nombre}</h2>
              <p><span className="font-semibold">Dirección:</span> {selectedCliente.direccion}</p>
              <p><span className="font-semibold">Teléfono:</span> {selectedCliente.telefono}</p>
              <p><span className="font-semibold">Zona:</span> {selectedCliente.zona}</p>
              <p><span className="font-semibold">Repartidor:</span> {selectedCliente.repartidor}</p>
              <p><span className="font-semibold">Día de reparto:</span> {selectedCliente.dia_reparto}</p>
              {mostrarRuta && selectedEnRuta && (
                <p className={`mt-1 font-semibold ${selectedAtendido ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedAtendido ? '✓ Cliente atendido hoy' : 'Pendiente de visita'}
                </p>
              )}
              {mostrarRuta && (
                <>
                  <p>
                    <span className="font-semibold">Orden en ruta:</span>{' '}
                    {rutaOptimizada.findIndex((c) => c.id === selectedCliente.id) + 1}
                  </p>
                  <button
                    type="button"
                    className={`px-3 py-1 mt-2 text-white rounded ${
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
                className="px-3 py-1 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600"
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
            onCloseClick={cancelarCambio}
          >
            <div className="max-w-xs text-sm">
              <p className="mb-2 font-bold">¿Cambiar ubicación de {pendingConfirm.cliente.nombre}?</p>
              <p><b>Dirección:</b> {pendingConfirm.direccion}</p>
              <p><b>Lat:</b> {pendingConfirm.lat.toFixed(6)}</p>
              <p><b>Lng:</b> {pendingConfirm.lng.toFixed(6)}</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                  onClick={confirmarCambio}
                >
                  Sí
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
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
