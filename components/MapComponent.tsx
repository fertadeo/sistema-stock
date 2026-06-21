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

interface RepartidorOption {
  id: number;
  nombre: string;
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
  onClienteActualizado: (clienteId: number, datos: Partial<Cliente>) => void;
  clientesAtendidos?: number[];
  repartidorPalette?: RepartidorPaletteItem[];
  repartidores?: RepartidorOption[];
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
  .map-info-window-select {
    width: 100%;
    margin-top: 2px;
    font-size: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.375rem 0.5rem;
    background: #fff;
    color: #1f2937;
  }
  .map-info-window-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.5rem;
  }
  .map-info-window-btn {
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
    color: #fff;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
  }
  .map-info-window-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .map-info-window-btn-primary { background: #3b82f6; }
  .map-info-window-btn-primary:hover:not(:disabled) { background: #2563eb; }
  .map-info-window-btn-success { background: #22c55e; }
  .map-info-window-btn-success:hover:not(:disabled) { background: #16a34a; }
  .map-info-window-btn-danger { background: #ef4444; }
  .map-info-window-btn-danger:hover:not(:disabled) { background: #dc2626; }
  .map-info-window-btn-neutral { background: #6b7280; }
  .map-info-window-btn-neutral:hover:not(:disabled) { background: #4b5563; }
  .map-info-window-hint {
    margin: 6px 0 0;
    padding: 6px 8px;
    font-size: 0.6875rem;
    line-height: 1.3;
    color: #92400e;
    background: #fffbeb;
    border-radius: 0.375rem;
    border: 1px solid #fde68a;
  }
`;

function infoWindowOptions(titulo: string): google.maps.InfoWindowOptions {
  return {
    maxWidth: 320,
    headerContent: titulo,
  };
}

function mapApiClienteToLocal(data: Record<string, unknown>): Partial<Cliente> {
  const coords = tieneCoordenadasValidas(data.latitud, data.longitud);
  return {
    nombre: typeof data.nombre === 'string' ? data.nombre : undefined,
    direccion: typeof data.direccion === 'string' ? data.direccion : undefined,
    telefono: typeof data.telefono === 'string' ? data.telefono : undefined,
    zona: data.zona != null ? (data.zona as string | number) : null,
    repartidor: typeof data.repartidor === 'string' ? data.repartidor : null,
    dia_reparto: typeof data.dia_reparto === 'string' ? data.dia_reparto : null,
    latitud: coords?.latitud,
    longitud: coords?.longitud,
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
  onClienteActualizado,
  clientesAtendidos = [],
  repartidorPalette = [],
  repartidores = [],
}) => {
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [repartidorEditado, setRepartidorEditado] = useState('');
  const [guardandoRepartidor, setGuardandoRepartidor] = useState(false);
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);
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
    if (!selectedCliente) return;
    const actualizado = clientesConCoords.find((c) => c.id === selectedCliente.id);
    if (actualizado) {
      setSelectedCliente(actualizado);
    }
  }, [clientes, clientesConCoords, selectedCliente?.id]);

  useEffect(() => {
    if (selectedCliente) {
      setRepartidorEditado(selectedCliente.repartidor ?? '');
    }
  }, [selectedCliente?.id]);

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

  const actualizarClienteEnApi = async (
    clienteId: number,
    body: Record<string, unknown>
  ): Promise<Partial<Cliente>> => {
    const response = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${clienteId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar el cliente');
    }
    const data = await response.json();
    return mapApiClienteToLocal(data);
  };

  const guardarRepartidor = async () => {
    if (!selectedCliente) return;
    const repartidorActual = selectedCliente.repartidor ?? '';
    if (repartidorEditado === repartidorActual) return;

    setGuardandoRepartidor(true);
    try {
      const datos = await actualizarClienteEnApi(selectedCliente.id, {
        repartidor: repartidorEditado.trim() || null,
      });
      onClienteActualizado(selectedCliente.id, datos);
      setSelectedCliente((prev) => (prev ? { ...prev, ...datos } : null));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al actualizar el repartidor');
    } finally {
      setGuardandoRepartidor(false);
    }
  };

  const confirmarCambio = async () => {
    if (!pendingConfirm) return;
    const { cliente, lat, lng, direccion } = pendingConfirm;
    setGuardandoUbicacion(true);
    try {
      const datos = await actualizarClienteEnApi(cliente.id, {
        latitud: lat.toString(),
        longitud: lng.toString(),
        direccion,
      });
      onClienteActualizado(cliente.id, {
        ...datos,
        latitud: lat,
        longitud: lng,
        direccion,
      });
      setPendingConfirm(null);
      setEditingClienteId(null);
      setDragPosition(null);
      setSelectedCliente(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al actualizar las coordenadas');
    } finally {
      setGuardandoUbicacion(false);
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
  const editandoUbicacion = selectedCliente != null && editingClienteId === selectedCliente.id;
  const repartidorModificado =
    selectedCliente != null && repartidorEditado !== (selectedCliente.repartidor ?? '');

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
              <InfoRow label="Día de reparto" value={selectedCliente.dia_reparto} />

              <div className="map-info-window-row">
                <label className="map-info-window-label" htmlFor={`repartidor-${selectedCliente.id}`}>
                  Repartidor
                </label>
                <select
                  id={`repartidor-${selectedCliente.id}`}
                  className="map-info-window-select"
                  value={repartidorEditado}
                  onChange={(e) => setRepartidorEditado(e.target.value)}
                  disabled={guardandoRepartidor || guardandoUbicacion}
                >
                  <option value="">Sin repartidor</option>
                  {repartidores.map((rep) => (
                    <option key={rep.id} value={rep.nombre}>
                      {rep.nombre}
                    </option>
                  ))}
                </select>
                {repartidorModificado && (
                  <button
                    type="button"
                    className="map-info-window-btn map-info-window-btn-success mt-2"
                    onClick={guardarRepartidor}
                    disabled={guardandoRepartidor}
                  >
                    {guardandoRepartidor ? 'Guardando...' : 'Guardar repartidor'}
                  </button>
                )}
              </div>

              {editandoUbicacion && (
                <p className="map-info-window-hint">
                  Arrastrá el marcador en el mapa hasta la nueva ubicación. Al soltarlo podrás confirmar el cambio.
                </p>
              )}

              {mostrarRuta && selectedEnRuta && (
                <p className={`map-info-window-row font-semibold ${selectedAtendido ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedAtendido ? '✓ Cliente atendido hoy' : 'Pendiente de visita'}
                </p>
              )}

              <div className="map-info-window-actions">
                {mostrarRuta && (
                  <>
                    {selectedEnRuta && (
                      <p className="w-full map-info-window-row">
                        <span className="map-info-window-label">Orden en ruta:</span>{' '}
                        {rutaOptimizada.findIndex((c) => c.id === selectedCliente.id) + 1}
                      </p>
                    )}
                    {selectedEnRuta && (
                      <button
                        type="button"
                        className={`map-info-window-btn ${
                          clientesOmitidos.includes(selectedCliente.id)
                            ? 'map-info-window-btn-success'
                            : 'map-info-window-btn-danger'
                        }`}
                        onClick={() => onToggleOmitirCliente(selectedCliente.id)}
                      >
                        {clientesOmitidos.includes(selectedCliente.id)
                          ? 'Incluir en ruta'
                          : 'Omitir de ruta'}
                      </button>
                    )}
                  </>
                )}
                {editandoUbicacion ? (
                  <button
                    type="button"
                    className="map-info-window-btn map-info-window-btn-neutral"
                    onClick={cancelarCambio}
                    disabled={guardandoUbicacion}
                  >
                    Cancelar edición
                  </button>
                ) : (
                  <button
                    type="button"
                    className="map-info-window-btn map-info-window-btn-primary"
                    onClick={() => {
                      setEditingClienteId(selectedCliente.id);
                      setDragPosition({
                        lat: selectedCliente.latitud,
                        lng: selectedCliente.longitud,
                      });
                    }}
                    disabled={guardandoRepartidor}
                  >
                    Editar ubicación
                  </button>
                )}
              </div>
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
              <div className="map-info-window-actions">
                <button
                  type="button"
                  className="map-info-window-btn map-info-window-btn-success"
                  onClick={confirmarCambio}
                  disabled={guardandoUbicacion}
                >
                  {guardandoUbicacion ? 'Guardando...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  className="map-info-window-btn map-info-window-btn-danger"
                  onClick={cancelarCambio}
                  disabled={guardandoUbicacion}
                >
                  Cancelar
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
