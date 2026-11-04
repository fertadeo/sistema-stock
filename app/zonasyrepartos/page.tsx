"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { authFetch } from '@/lib/api/fetchWithAuth';
import { buildRepartidorPalette, MARKER_ICONS, nombresCoinciden } from '@/lib/map/repartidorMarkers';
import { REPARTIDOR_PIN_COLORS } from '@/lib/map/markerPinIcon';
import RepartidorColorPicker from '@/components/RepartidorColorPicker';
import { parseCoordenada } from '@/lib/map/clienteCoords';
import { repartidorRapidoService } from '@/lib/services/repartidorRapidoService';
import {
  clienteCoincideFiltros,
  clienteIncluidoEnRuta,
  filtrarClientes,
  FiltrosCliente,
} from '@/lib/map/clienteFiltros';
import diasRepartoData from '@/components/soderia-data/diareparto.json';
import {
  zonaRadioService,
  ZonaRadio,
} from '@/lib/services/zonaRadioService';
import {
  COLORES_ZONA,
  RADIO_DEFAULT_METROS,
  TipoZona,
  PuntoMapa,
  contarClientesEnZona,
} from '@/lib/map/zonaRadio';
import NuevoClienteModal from '@/components/nuevoClienteModal';
import ZonasLista from '@/components/ZonasLista';
import ZonaComposer, { ZonaMapHint } from '@/components/ZonaComposer';
import zonasJson from '@/components/soderia-data/zonas.json';
import { descargarHojaRutaExcel } from '@/lib/export/excelHojaRuta';
import { repartidorRutaService } from '@/lib/services/repartidorRutaService';
import DelegarZonaModal from '@/components/DelegarZonaModal';

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  zona: string | number | null;
  repartidor: string | null;
  dia_reparto: string | null;
  latitud: number | null;
  longitud: number | null;
  /** false = desactivado / inhabilitado */
  estado: boolean;
}

function clienteEstaActivo(rawEstado: unknown): boolean {
  return rawEstado !== false && rawEstado !== 0 && rawEstado !== '0' && rawEstado !== 'false';
}

type ClienteConCoords = Cliente & { latitud: number; longitud: number };

interface Repartidor {
  id: number;
  nombre: string;
  zona_reparto?: string;
  activo?: boolean;
  color_pin?: string | null;
}

// Coordenadas de la empresa
const EMPRESA_COORDENADAS: [number, number] = [-33.141709, -64.3634274];

// Agrega esta interfaz para el estado de edición
interface EditingState {
  isEditing: boolean;
  clienteId: number | null;
}

// Spinner simple
const Spinner = () => (
  <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white px-4 py-2 rounded shadow-lg border border-gray-200">
    <svg className="w-5 h-5 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
    <span className="font-medium text-blue-600">Calculando ruta...</span>
  </div>
);

// Modal de confirmación simple
const ConfirmModal = ({ open, onConfirm, onCancel }: { open: boolean, onConfirm: () => void, onCancel: () => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 mx-4 w-full max-w-sm flex flex-col items-center">
        <p className="mb-4 text-lg font-semibold text-gray-800">¿Quieres salir de la navegación de ruta?</p>
        <div className="flex gap-4">
          <button
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
            onClick={onConfirm}
          >
            Sí
          </button>
          <button
            className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onCancel}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false
});

const PageZonasyRepartos = () => {
  // Estados de negocio
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarRuta, setMostrarRuta] = useState(false);
  const [rutaOptimizada, setRutaOptimizada] = useState<ClienteConCoords[]>([]);
  const [clientesOmitidos, setClientesOmitidos] = useState<number[]>([]);
  
  // Estados para los filtros
  const [filtroDia, setFiltroDia] = useState<string>('todos');
  const [filtroRepartidor, setFiltroRepartidor] = useState<string>('todos');
  const [filtroZona, setFiltroZona] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Agrega estos estados en el componente PageZonasyRepartos
  const [editingState, setEditingState] = useState<EditingState>({ isEditing: false, clienteId: null });
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [tempPosition, setTempPosition] = useState<[number, number] | null>(null);
  const [tempDireccion, setTempDireccion] = useState<string>('');
  const [rutaDetallada, setRutaDetallada] = useState<[number, number][]>([]);
  const [distanciaTotal, setDistanciaTotal] = useState<number>(0);
  const [tiempoEstimado, setTiempoEstimado] = useState<number>(0);

  // Nuevo estado para saber si la ruta está lista
  const [rutaLista, setRutaLista] = useState(false);
  const [cargandoRuta, setCargandoRuta] = useState(false);

  // Nuevo estado para guardar el cliente afectado
  const [clienteAfectado, setClienteAfectado] = useState<number | null>(null);

  const [showConfirmSalirRuta, setShowConfirmSalirRuta] = useState(false);

  // Agregar nuevo estado para clientes incluidos manualmente
  const [clientesIncluidos, setClientesIncluidos] = useState<number[]>([]);
  const [clientesAtendidos, setClientesAtendidos] = useState<number[]>([]);
  const [altaClienteMapa, setAltaClienteMapa] = useState<{ lat: number; lng: number } | null>(null);
  const [seguirRecorrido, setSeguirRecorrido] = useState(false);
  const [vistaMovil, setVistaMovil] = useState<'filtros' | 'mapa'>('mapa');
  const [esDesktop, setEsDesktop] = useState(false);
  const [enviandoRuta, setEnviandoRuta] = useState(false);
  const [mostrarDelegarZona, setMostrarDelegarZona] = useState(false);
  const [editandoColorRepartidor, setEditandoColorRepartidor] = useState<string | null>(null);
  const [colorPinBorrador, setColorPinBorrador] = useState<string>(REPARTIDOR_PIN_COLORS[0]);
  const [guardandoColorPin, setGuardandoColorPin] = useState(false);
  const autoGuardarPoligonoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [repartidorUbicacion, setRepartidorUbicacion] = useState<{
    latitud: number;
    longitud: number;
    repartidor_nombre: string;
    en_linea: boolean;
    actualizado_at: string;
  } | null>(null);

  // Zonas geográficas (radio / barrio / polígono)
  const [zonasRadio, setZonasRadio] = useState<ZonaRadio[]>([]);
  const [barriosCatalogo, setBarriosCatalogo] = useState<Array<{ id: number; nombre: string }>>([]);
  const [zonaSeleccionadaId, setZonaSeleccionadaId] = useState<number | null>(null);
  const [modoCrearZona, setModoCrearZona] = useState(false);
  const [tipoCreacion, setTipoCreacion] = useState<TipoZona>('radio');
  const [guardandoZona, setGuardandoZona] = useState(false);
  const [cargandoLimites, setCargandoLimites] = useState(false);
  const [mensajeLimites, setMensajeLimites] = useState<string | null>(null);
  const [formZonaNombre, setFormZonaNombre] = useState('');
  const [formZonaRadio, setFormZonaRadio] = useState(RADIO_DEFAULT_METROS);
  const [formZonaRepartidor, setFormZonaRepartidor] = useState('');
  const [formZonaColor, setFormZonaColor] = useState<string>(COLORES_ZONA[0]);
  const [formZonaBarrio, setFormZonaBarrio] = useState('');
  const [borradorCentro, setBorradorCentro] = useState<{ lat: number; lng: number } | null>(null);
  const [borradorPoligono, setBorradorPoligono] = useState<PuntoMapa[]>([]);
  const [origenLimites, setOrigenLimites] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setEsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const fetchClientesAtendidos = useCallback(async () => {
    try {
      const repartidorParam =
        filtroRepartidor !== 'todos' ? filtroRepartidor : undefined;
      const ids = await repartidorRapidoService.obtenerClientesAtendidosHoy(repartidorParam);
      setClientesAtendidos(ids);
    } catch (error) {
      console.error('Error al cargar clientes atendidos:', error);
    }
  }, [filtroRepartidor]);

  const fetchUbicacionRepartidor = useCallback(async () => {
    if (filtroRepartidor === 'todos') {
      setRepartidorUbicacion(null);
      return;
    }

    try {
      const ubicacion = await repartidorRapidoService.obtenerUbicacionRepartidor(filtroRepartidor);
      setRepartidorUbicacion(ubicacion);
    } catch (error) {
      console.error('Error al cargar ubicación del repartidor:', error);
    }
  }, [filtroRepartidor]);

  const fetchRepartidores = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repartidores`);
      if (!response.ok) return;
      const data = await response.json();
      const lista = Array.isArray(data) ? data : [];
      setRepartidores(lista.filter((item: Repartidor) => item.nombre?.trim()));
    } catch (error) {
      console.error('Error al cargar repartidores:', error);
    }
  };

  const guardarColorRepartidor = async (nombre: string, color: string) => {
    const repartidor = repartidores.find((r) => nombresCoinciden(r.nombre, nombre));
    if (!repartidor) {
      alert('No se encontró el repartidor para actualizar el color.');
      return;
    }
    setGuardandoColorPin(true);
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/repartidores/${repartidor.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ color_pin: color }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || 'No se pudo guardar el color');
      }
      setRepartidores((prev) =>
        prev.map((r) =>
          r.id === repartidor.id ? { ...r, color_pin: color.toUpperCase() } : r
        )
      );
      setEditandoColorRepartidor(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar el color');
    } finally {
      setGuardandoColorPin(false);
    }
  };

  const fetchZonasRadio = useCallback(async () => {
    try {
      const zonas = await zonaRadioService.listar();
      setZonasRadio(zonas);
    } catch (error) {
      console.error('Error al cargar zonas de radio:', error);
    }
  }, []);

  const fetchBarriosCatalogo = useCallback(async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/zonas`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setBarriosCatalogo(
            data
              .filter((z: { id?: number; nombre?: string }) => z?.nombre)
              .map((z: { id: number; nombre: string }) => ({
                id: Number(z.id),
                nombre: String(z.nombre),
              }))
              .sort((a: { nombre: string }, b: { nombre: string }) =>
                a.nombre.localeCompare(b.nombre)
              )
          );
          return;
        }
      }
    } catch (error) {
      console.error('Error al cargar barrios:', error);
    }
    setBarriosCatalogo(
      (zonasJson as Array<{ nombre: string }>).map((z, idx) => ({
        id: idx + 1,
        nombre: z.nombre,
      }))
    );
  }, []);

  // Función para obtener los clientes (incluye sin coords para totales de envases)
  const fetchClientes = async () => {
    try {
      setIsLoading(true);
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los clientes');
      }

      const data = await response.json();
      const lista = Array.isArray(data) ? data : [];

      const normalizados: Cliente[] = lista.map((raw: Record<string, unknown>) => {
        const lat = parseCoordenada(raw.latitud);
        const lng = parseCoordenada(raw.longitud);
        const coordsValidas =
          lat != null && lng != null && !(lat === 0 && lng === 0)
            ? { latitud: lat, longitud: lng }
            : { latitud: null, longitud: null };

        return {
          id: Number(raw.id),
          nombre: String(raw.nombre ?? ''),
          direccion: String(raw.direccion ?? ''),
          telefono: String(raw.telefono ?? ''),
          zona: (raw.zona as string | number | null) ?? null,
          repartidor: typeof raw.repartidor === 'string' ? raw.repartidor : null,
          dia_reparto: typeof raw.dia_reparto === 'string' ? raw.dia_reparto : null,
          latitud: coordsValidas.latitud,
          longitud: coordsValidas.longitud,
          estado: clienteEstaActivo(raw.estado),
        };
      });

      setClientes(normalizados);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const filtrosMapa = useMemo<FiltrosCliente>(
    () => ({
      dia: filtroDia,
      repartidor: filtroRepartidor,
      zona: filtroZona,
      busqueda,
    }),
    [filtroDia, filtroRepartidor, filtroZona, busqueda]
  );

  const clientesFiltrados = useMemo(
    () => filtrarClientes(clientes, filtrosMapa),
    [clientes, filtrosMapa]
  );

  /** Solo clientes activos con coords para mapa/ruta/delegación. */
  const clientesParaMapa = useMemo(
    () =>
      clientes.filter(
        (c): c is ClienteConCoords =>
          c.estado !== false && c.latitud != null && c.longitud != null
      ),
    [clientes]
  );

  const clientesAtendidosFiltrados = useMemo(
    () => clientesFiltrados.filter((c) => clientesAtendidos.includes(c.id)).length,
    [clientesFiltrados, clientesAtendidos]
  );

  const activarSeguirRecorrido = () => {
    if (filtroRepartidor === 'todos') {
      alert('Seleccioná un repartidor para seguir su recorrido.');
      return;
    }
    setSeguirRecorrido(true);
    void fetchClientesAtendidos();
    void fetchUbicacionRepartidor();
  };

  const detenerSeguirRecorrido = () => {
    setSeguirRecorrido(false);
    setRepartidorUbicacion(null);
    if (!mostrarRuta) {
      setClientesAtendidos([]);
    }
  };

  const clientesParaRuta = useCallback(
    () =>
      clientesParaMapa.filter(
        (cliente) =>
          !clientesOmitidos.includes(cliente.id) &&
          clienteIncluidoEnRuta(cliente, filtrosMapa, clientesIncluidos)
      ),
    [clientesParaMapa, clientesOmitidos, filtrosMapa, clientesIncluidos]
  );

  // Cargar clientes y repartidores al montar el componente
  useEffect(() => {
    void fetchClientes();
    void fetchRepartidores();
    void fetchZonasRadio();
    void fetchBarriosCatalogo();
  }, [fetchZonasRadio, fetchBarriosCatalogo]);

  useEffect(() => {
    return () => {
      if (autoGuardarPoligonoTimer.current) {
        clearTimeout(autoGuardarPoligonoTimer.current);
      }
    };
  }, []);

  const repartidorPalette = useMemo(
    () =>
      buildRepartidorPalette(
        repartidores.map((r) => ({
          nombre: r.nombre,
          color_pin: r.color_pin,
        }))
      ),
    [repartidores]
  );

  const repartidoresOptions = useMemo(
    () => [
      'todos',
      ...repartidores
        .map((r) => (typeof r.nombre === 'string' ? r.nombre.trim() : ''))
        .filter((nombre): nombre is string => nombre.length > 0),
    ],
    [repartidores]
  );

  useEffect(() => {
    if (!mostrarRuta && !seguirRecorrido) {
      setClientesAtendidos([]);
      return;
    }

    void fetchClientesAtendidos();
    const interval = setInterval(fetchClientesAtendidos, 25000);
    return () => clearInterval(interval);
  }, [mostrarRuta, seguirRecorrido, fetchClientesAtendidos]);

  useEffect(() => {
    if (!seguirRecorrido) {
      setRepartidorUbicacion(null);
      return;
    }

    void fetchUbicacionRepartidor();
    const interval = setInterval(fetchUbicacionRepartidor, 30000);
    return () => clearInterval(interval);
  }, [seguirRecorrido, fetchUbicacionRepartidor]);

  const diasOptions = useMemo(() => {
    const diasEnClientes = clientes
      .map((c) => (typeof c.dia_reparto === 'string' ? c.dia_reparto.trim() : ''))
      .filter((dia): dia is string => dia.length > 0);
    const diasCanon = diasRepartoData.diasReparto;
    const extras = diasEnClientes.filter(
      (dia) => !diasCanon.some((canon) => canon.toLowerCase() === dia.toLowerCase())
    );
    return ['todos', ...diasCanon, ...Array.from(new Set(extras))];
  }, [clientes]);

  const zonasUnicas = useMemo(
    () => [
      'todos',
      ...Array.from(
        new Set(
          clientes
            .map((c) => (c.zona != null && c.zona !== '' ? String(c.zona).trim() : ''))
            .filter((zona): zona is string => zona.length > 0)
        )
      ),
    ],
    [clientes]
  );

  const eliminarClienteEnMapa = (clienteId: number) => {
    setClientes((prev) => prev.filter((cliente) => cliente.id !== clienteId));
    setClientesOmitidos((prev) => prev.filter((id) => id !== clienteId));
    setClientesIncluidos((prev) => prev.filter((id) => id !== clienteId));
  };

  const actualizarClienteEnMapa = (clienteId: number, datos: Partial<Cliente>) => {
    setClientes((prev) =>
      prev.map((cliente) =>
        cliente.id === clienteId ? { ...cliente, ...datos } : cliente
      )
    );
  };

  const zonaSeleccionada = useMemo(
    () => zonasRadio.find((z) => z.id === zonaSeleccionadaId) ?? null,
    [zonasRadio, zonaSeleccionadaId]
  );

  const tipoActivo: TipoZona = modoCrearZona
    ? tipoCreacion
    : (zonaSeleccionada?.tipo as TipoZona) || 'radio';

  const poligonoActivo = borradorPoligono;

  /** Geometría en vivo de la zona seleccionada (borrador + formulario, no solo lo último guardado). */
  const zonaGeometriaActiva = useMemo(() => {
    if (!zonaSeleccionada || modoCrearZona) return null;
    if (zonaSeleccionada.tipo === 'radio') {
      return {
        ...zonaSeleccionada,
        nombre: formZonaNombre.trim() || zonaSeleccionada.nombre,
        latitud: Number(zonaSeleccionada.latitud),
        longitud: Number(zonaSeleccionada.longitud),
        radio_metros: formZonaRadio,
        color: formZonaColor,
        repartidor: formZonaRepartidor.trim() || null,
      };
    }
    return {
      ...zonaSeleccionada,
      nombre: formZonaNombre.trim() || zonaSeleccionada.nombre,
      color: formZonaColor,
      repartidor: formZonaRepartidor.trim() || null,
      poligono: poligonoActivo.length >= 3 ? poligonoActivo : zonaSeleccionada.poligono,
    };
  }, [
    zonaSeleccionada,
    modoCrearZona,
    formZonaNombre,
    formZonaRadio,
    formZonaColor,
    formZonaRepartidor,
    poligonoActivo,
  ]);

  /** Zonas dibujadas; la seleccionada refleja el formulario en vivo. */
  const zonasParaMapa = useMemo(() => {
    if (!zonaGeometriaActiva) return zonasRadio;
    return zonasRadio.map((z) =>
      z.id === zonaGeometriaActiva.id ? zonaGeometriaActiva : z
    );
  }, [zonasRadio, zonaGeometriaActiva]);

  const borradorZona = useMemo(() => {
    if (!modoCrearZona) return null;
    if (tipoCreacion === 'radio') {
      if (!borradorCentro) return { tipo: 'radio' as const, color: formZonaColor };
      return {
        tipo: 'radio' as const,
        latitud: borradorCentro.lat,
        longitud: borradorCentro.lng,
        radio_metros: formZonaRadio,
        color: formZonaColor,
      };
    }
    return {
      tipo: tipoCreacion,
      poligono: borradorPoligono,
      color: formZonaColor,
      latitud: borradorCentro?.lat,
      longitud: borradorCentro?.lng,
    };
  }, [
    modoCrearZona,
    tipoCreacion,
    borradorCentro,
    formZonaRadio,
    formZonaColor,
    borradorPoligono,
  ]);

  const clientesEnZonaActiva = useMemo(() => {
    if (modoCrearZona) {
      if (tipoCreacion === 'radio' && borradorCentro) {
        return contarClientesEnZona(clientesParaMapa, {
          tipo: 'radio',
          latitud: borradorCentro.lat,
          longitud: borradorCentro.lng,
          radio_metros: formZonaRadio,
        });
      }
      if (
        (tipoCreacion === 'barrio' || tipoCreacion === 'poligono') &&
        borradorPoligono.length >= 3
      ) {
        return contarClientesEnZona(clientesParaMapa, {
          tipo: tipoCreacion,
          latitud: borradorPoligono[0].lat,
          longitud: borradorPoligono[0].lng,
          poligono: borradorPoligono,
        });
      }
      return null;
    }
    if (zonaGeometriaActiva) {
      return contarClientesEnZona(clientesParaMapa, zonaGeometriaActiva);
    }
    return null;
  }, [
    modoCrearZona,
    tipoCreacion,
    borradorCentro,
    formZonaRadio,
    borradorPoligono,
    zonaGeometriaActiva,
    clientesParaMapa,
  ]);

  const contadoresPorZona = useMemo(() => {
    const map = new Map<number, number>();
    zonasRadio.forEach((zona) => {
      const geometria =
        zonaGeometriaActiva && zonaGeometriaActiva.id === zona.id
          ? zonaGeometriaActiva
          : zona;
      map.set(zona.id, contarClientesEnZona(clientesParaMapa, geometria));
    });
    return map;
  }, [zonasRadio, clientesParaMapa, zonaGeometriaActiva]);

  const puedeGuardarZona = useMemo(() => {
    if (!formZonaNombre.trim()) return false;
    if (tipoActivo === 'radio') {
      return Boolean(modoCrearZona ? borradorCentro : zonaSeleccionada);
    }
    return poligonoActivo.length >= 3;
  }, [
    formZonaNombre,
    tipoActivo,
    modoCrearZona,
    borradorCentro,
    zonaSeleccionada,
    poligonoActivo,
  ]);

  const resetFormZona = () => {
    setBorradorCentro(null);
    setBorradorPoligono([]);
    setMensajeLimites(null);
    setOrigenLimites(null);
    setFormZonaBarrio('');
    setCargandoLimites(false);
  };

  const iniciarCrearZona = () => {
    setModoCrearZona(true);
    setZonaSeleccionadaId(null);
    setTipoCreacion('radio');
    resetFormZona();
    setFormZonaNombre(`Zona ${zonasRadio.length + 1}`);
    setFormZonaRadio(RADIO_DEFAULT_METROS);
    setFormZonaRepartidor(filtroRepartidor !== 'todos' ? filtroRepartidor : '');
    setFormZonaColor(COLORES_ZONA[zonasRadio.length % COLORES_ZONA.length]);
    // Desktop: el editor queda en el panel izquierdo y el mapa libre.
    // Mobile: priorizamos el mapa con dock compacto.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setVistaMovil('mapa');
    } else {
      setVistaMovil('filtros');
    }
  };

  const cancelarCrearZona = () => {
    setModoCrearZona(false);
    resetFormZona();
  };

  const cerrarEditorZona = () => {
    if (modoCrearZona) {
      cancelarCrearZona();
      return;
    }
    setZonaSeleccionadaId(null);
    resetFormZona();
  };

  const seleccionarTipoCreacion = (tipo: TipoZona) => {
    setTipoCreacion(tipo);
    setBorradorCentro(null);
    setBorradorPoligono([]);
    setMensajeLimites(null);
    setOrigenLimites(null);
    if (tipo === 'barrio' && formZonaBarrio) {
      setFormZonaNombre(formZonaBarrio);
    } else if (!formZonaNombre.trim()) {
      setFormZonaNombre(`Zona ${zonasRadio.length + 1}`);
    }
  };

  const seleccionarZona = (zonaId: number | null) => {
    if (modoCrearZona) return;
    setZonaSeleccionadaId(zonaId);
    setMensajeLimites(null);
    if (zonaId != null) {
      setVistaMovil('mapa');
      const zona = zonasRadio.find((z) => z.id === zonaId);
      if (zona) {
        setFormZonaNombre(zona.nombre);
        setFormZonaRadio(Number(zona.radio_metros) || RADIO_DEFAULT_METROS);
        setFormZonaRepartidor(zona.repartidor ?? '');
        setFormZonaColor(zona.color || COLORES_ZONA[0]);
        setFormZonaBarrio(zona.barrio_nombre || '');
        setBorradorPoligono(zona.poligono || []);
        setOrigenLimites(zona.origen_limites);
        if (zona.origen_limites === 'osm') {
          setMensajeLimites('Límites desde OpenStreetMap.');
        } else if (zona.origen_limites === 'clientes') {
          setMensajeLimites('Límites estimados a partir de clientes del barrio.');
        } else if (zona.tipo === 'poligono') {
          setMensajeLimites('Trazado manual.');
        }
      }
    } else {
      setBorradorPoligono([]);
    }
  };

  const handleMapClickZona = (lat: number, lng: number) => {
    if (!modoCrearZona) return;
    if (tipoCreacion === 'radio') {
      setBorradorCentro({ lat, lng });
      return;
    }
    if (tipoCreacion === 'poligono') {
      setBorradorPoligono((prev) => [...prev, { lat, lng }]);
    }
  };

  const detectarLimitesBarrio = async () => {
    if (!formZonaBarrio.trim()) return;
    setCargandoLimites(true);
    setMensajeLimites(null);
    try {
      const result = await zonaRadioService.limitesBarrio(formZonaBarrio.trim());
      setBorradorPoligono(result.poligono);
      setBorradorCentro({ lat: result.centro.lat, lng: result.centro.lng });
      setOrigenLimites(result.fuente);
      setFormZonaNombre((prev) => prev.trim() || result.barrio);
      setMensajeLimites(result.mensaje);
      setVistaMovil('mapa');
      // Si estamos editando una zona existente, sincronizar también el estado guardado en memoria
      if (!modoCrearZona && zonaSeleccionadaId != null) {
        setZonasRadio((prev) =>
          prev.map((z) =>
            z.id === zonaSeleccionadaId
              ? {
                  ...z,
                  tipo: z.tipo === 'radio' ? 'barrio' : z.tipo,
                  poligono: result.poligono,
                  latitud: result.centro.lat,
                  longitud: result.centro.lng,
                  origen_limites: result.fuente,
                  barrio_nombre: result.barrio,
                }
              : z
          )
        );
      }
    } catch (error) {
      setBorradorPoligono([]);
      setMensajeLimites(
        error instanceof Error ? error.message : 'No se pudieron detectar los límites'
      );
    } finally {
      setCargandoLimites(false);
    }
  };

  const guardarZona = async () => {
    if (!formZonaNombre.trim()) {
      alert('Ingresá un nombre para la zona.');
      return;
    }
    if (!puedeGuardarZona) {
      alert(
        tipoActivo === 'radio'
          ? 'Hacé click en el mapa para ubicar el centro.'
          : 'La zona necesita al menos 3 puntos.'
      );
      return;
    }

    setGuardandoZona(true);
    try {
      if (modoCrearZona) {
        const payload =
          tipoCreacion === 'radio'
            ? {
                nombre: formZonaNombre.trim(),
                tipo: 'radio' as const,
                latitud: borradorCentro!.lat,
                longitud: borradorCentro!.lng,
                radio_metros: formZonaRadio,
                color: formZonaColor,
                repartidor: formZonaRepartidor.trim() || null,
              }
            : {
                nombre: formZonaNombre.trim(),
                tipo: tipoCreacion,
                poligono: borradorPoligono,
                barrio_nombre:
                  tipoCreacion === 'barrio' ? formZonaBarrio.trim() || formZonaNombre.trim() : null,
                origen_limites:
                  tipoCreacion === 'barrio' ? origenLimites || 'manual' : 'manual',
                color: formZonaColor,
                repartidor: formZonaRepartidor.trim() || null,
              };

        const creada = await zonaRadioService.crear(payload);
        setZonasRadio((prev) =>
          [...prev, creada].sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
        setModoCrearZona(false);
        setBorradorCentro(null);
        setBorradorPoligono(creada.poligono || []);
        setMensajeLimites(null);
        setOrigenLimites(creada.origen_limites);
        setFormZonaBarrio(creada.barrio_nombre || '');
        setFormZonaNombre(creada.nombre);
        setFormZonaRadio(Number(creada.radio_metros) || RADIO_DEFAULT_METROS);
        setFormZonaRepartidor(creada.repartidor ?? '');
        setFormZonaColor(creada.color || COLORES_ZONA[0]);
        setZonaSeleccionadaId(creada.id);
      } else if (zonaSeleccionada) {
        const payload =
          zonaSeleccionada.tipo === 'radio'
            ? {
                nombre: formZonaNombre.trim(),
                tipo: 'radio' as const,
                latitud: Number(zonaSeleccionada.latitud),
                longitud: Number(zonaSeleccionada.longitud),
                radio_metros: formZonaRadio,
                color: formZonaColor,
                repartidor: formZonaRepartidor.trim() || null,
              }
            : {
                nombre: formZonaNombre.trim(),
                tipo: zonaSeleccionada.tipo,
                poligono: poligonoActivo,
                barrio_nombre: zonaSeleccionada.barrio_nombre,
                origen_limites: zonaSeleccionada.origen_limites,
                color: formZonaColor,
                repartidor: formZonaRepartidor.trim() || null,
              };

        const actualizada = await zonaRadioService.actualizar(zonaSeleccionada.id, payload);
        setZonasRadio((prev) =>
          prev
            .map((z) => (z.id === actualizada.id ? actualizada : z))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
        setBorradorPoligono(actualizada.poligono || []);
        setFormZonaNombre(actualizada.nombre);
        setFormZonaRadio(Number(actualizada.radio_metros) || formZonaRadio);
        setFormZonaRepartidor(actualizada.repartidor ?? '');
        setFormZonaColor(actualizada.color || COLORES_ZONA[0]);
        setFormZonaBarrio(actualizada.barrio_nombre || '');
        setOrigenLimites(actualizada.origen_limites);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar la zona');
    } finally {
      setGuardandoZona(false);
    }
  };

  const moverCentroZonaSeleccionada = async (lat: number, lng: number) => {
    if (!zonaSeleccionada || modoCrearZona || zonaSeleccionada.tipo !== 'radio') return;
    setZonasRadio((prev) =>
      prev.map((z) =>
        z.id === zonaSeleccionada.id ? { ...z, latitud: lat, longitud: lng } : z
      )
    );
    try {
      const actualizada = await zonaRadioService.actualizar(zonaSeleccionada.id, {
        tipo: 'radio',
        latitud: lat,
        longitud: lng,
        radio_metros: Number(zonaSeleccionada.radio_metros) || formZonaRadio,
      });
      setZonasRadio((prev) =>
        prev.map((z) => (z.id === actualizada.id ? actualizada : z))
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al mover el centro');
      void fetchZonasRadio();
    }
  };

  const persistirPoligonoZona = useCallback(
    async (zonaId: number, puntos: PuntoMapa[], meta: { tipo: TipoZona; barrio_nombre: string | null; origen_limites: string | null; nombre: string; color: string; repartidor: string | null }) => {
      if (puntos.length < 3) return;
      try {
        const actualizada = await zonaRadioService.actualizar(zonaId, {
          nombre: meta.nombre,
          tipo: meta.tipo === 'radio' ? 'poligono' : meta.tipo,
          poligono: puntos,
          barrio_nombre: meta.barrio_nombre,
          origen_limites: meta.origen_limites || 'manual',
          color: meta.color,
          repartidor: meta.repartidor,
        });
        setZonasRadio((prev) =>
          prev.map((z) => (z.id === actualizada.id ? actualizada : z))
        );
        setBorradorPoligono(actualizada.poligono || puntos);
      } catch (error) {
        console.error('Error al auto-guardar polígono de zona:', error);
      }
    },
    []
  );

  const actualizarPoligonoZona = (puntos: PuntoMapa[]) => {
    if (modoCrearZona) {
      setBorradorPoligono(puntos);
      return;
    }
    if (!zonaSeleccionada) return;
    const zonaId = zonaSeleccionada.id;
    setZonasRadio((prev) =>
      prev.map((z) => (z.id === zonaId ? { ...z, poligono: puntos } : z))
    );
    setBorradorPoligono(puntos);

    // Persistir con debounce para que el modal y recargas vean la geometría real
    if (autoGuardarPoligonoTimer.current) {
      clearTimeout(autoGuardarPoligonoTimer.current);
    }
    autoGuardarPoligonoTimer.current = setTimeout(() => {
      void persistirPoligonoZona(zonaId, puntos, {
        tipo: zonaSeleccionada.tipo,
        barrio_nombre: zonaSeleccionada.barrio_nombre,
        origen_limites: zonaSeleccionada.origen_limites,
        nombre: formZonaNombre.trim() || zonaSeleccionada.nombre,
        color: formZonaColor,
        repartidor: formZonaRepartidor.trim() || null,
      });
    }, 900);
  };

  const eliminarZonaSeleccionada = async () => {
    if (!zonaSeleccionada) return;
    if (!window.confirm(`¿Eliminar la zona "${zonaSeleccionada.nombre}"?`)) return;
    setGuardandoZona(true);
    try {
      await zonaRadioService.eliminar(zonaSeleccionada.id);
      setZonasRadio((prev) => prev.filter((z) => z.id !== zonaSeleccionada.id));
      setZonaSeleccionadaId(null);
      resetFormZona();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar la zona');
    } finally {
      setGuardandoZona(false);
    }
  };

  // Función para calcular la distancia entre dos puntos usando la fórmula de Haversine
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Función para optimizar la ruta usando el algoritmo del vecino más cercano
  const optimizarRuta = (lista: ClienteConCoords[]) => {
    if (lista.length === 0) return [] as ClienteConCoords[];

    const ruta: ClienteConCoords[] = [];
    const noVisitados = [...lista].filter(cliente => !clientesOmitidos.includes(cliente.id));
    let puntoActual = { latitud: EMPRESA_COORDENADAS[0], longitud: EMPRESA_COORDENADAS[1] };

    while (noVisitados.length > 0) {
      let clienteMasCercano = noVisitados[0];
      let distanciaMinima = calcularDistancia(
        puntoActual.latitud,
        puntoActual.longitud,
        clienteMasCercano.latitud,
        clienteMasCercano.longitud
      );

      for (let i = 1; i < noVisitados.length; i++) {
        const distancia = calcularDistancia(
          puntoActual.latitud,
          puntoActual.longitud,
          noVisitados[i].latitud,
          noVisitados[i].longitud
        );

        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          clienteMasCercano = noVisitados[i];
        }
      }

      ruta.push(clienteMasCercano);
      puntoActual = clienteMasCercano;
      noVisitados.splice(noVisitados.indexOf(clienteMasCercano), 1);
    }

    return ruta;
  };

  // Función auxiliar para encontrar la mejor posición para reinsertar un cliente
  const encontrarPosicionMasCercana = (cliente: ClienteConCoords, rutaActual: ClienteConCoords[]): number => {
    if (rutaActual.length === 0) return 0;
    
    let mejorPosicion = 0;
    let menorDistancia = calcularDistancia(
      cliente.latitud,
      cliente.longitud,
      rutaActual[0].latitud,
      rutaActual[0].longitud
    );

    for (let i = 1; i < rutaActual.length; i++) {
      const distancia = calcularDistancia(
        cliente.latitud,
        cliente.longitud,
        rutaActual[i].latitud,
        rutaActual[i].longitud
      );

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        mejorPosicion = i;
      }
    }

    return mejorPosicion;
  };

  // Modificar el renderizado de los marcadores para mostrar el estilo correcto
  const toggleOmitirCliente = (clienteId: number) => {
    setClientesOmitidos(prev => {
      const nuevosOmitidos = prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId];
      
      // Si el cliente no coincide con los filtros actuales, agregarlo a incluidos
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente && !clienteCoincideFiltros(cliente, filtrosMapa)) {
        setClientesIncluidos(prev =>
          prev.includes(clienteId) ? prev : [...prev, clienteId]
        );
      }
      
      return nuevosOmitidos;
    });
  };

  // Efecto para regenerar la ruta cuando cambian los clientes omitidos
  // Regenerar ruta al cambiar filtros u omitidos (sin recalcular al activar la ruta por primera vez)
  useEffect(() => {
    if (!mostrarRuta) return;
    void generarRutaEnMapa(clientesParaRuta());
  }, [clientesOmitidos, filtrosMapa, clientesIncluidos, clientes]);

  // Función para obtener las coordenadas de la ruta
  const obtenerCoordenadasRuta = () => {
    if (!mostrarRuta || rutaOptimizada.length === 0) return [];
    
    // Incluir la empresa como punto inicial
    const coordenadas = [EMPRESA_COORDENADAS];
    
    // Agregar las coordenadas de los clientes en orden
    rutaOptimizada.forEach(cliente => {
      coordenadas.push([cliente.latitud, cliente.longitud]);
    });
    
    return coordenadas;
  };

  // Función para obtener la ruta detallada entre dos puntos usando Google Directions API
  const obtenerRutaDetallada = async (origen: [number, number], destino: [number, number]) => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rutas/directions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen: { lat: origen[0], lng: origen[1] },
          destino: { lat: destino[0], lng: destino[1] },
        }),
      });

      if (!response.ok) {
        console.error('Error en directions API:', response.status);
        return null;
      }

      const data = await response.json();
      return {
        coordenadas: data.coordenadas as [number, number][],
        distancia: data.distancia,
        duracion: data.duracion,
      };
    } catch (error) {
      console.error('Error al obtener la ruta detallada:', error);
      return null;
    }
  };

  // Función para obtener la ruta completa optimizada
  const obtenerRutaCompleta = async (lista: ClienteConCoords[]) => {
    if (lista.length === 0) return { coordenadas: [], distancia: 0, tiempo: 0 };

    let coordenadasCompletas: [number, number][] = [];
    let distanciaTotal = 0;
    let tiempoTotal = 0;
    let puntoActual = EMPRESA_COORDENADAS;

    for (const cliente of lista) {
      const ruta = await obtenerRutaDetallada(
        puntoActual,
        [cliente.latitud, cliente.longitud]
      );

      if (ruta) {
        coordenadasCompletas = [...coordenadasCompletas, ...ruta.coordenadas];
        distanciaTotal += ruta.distancia;
        tiempoTotal += ruta.duracion;
        puntoActual = [cliente.latitud, cliente.longitud];
      }
    }

    // Agregar ruta de vuelta a la empresa
    const rutaFinal = await obtenerRutaDetallada(
      puntoActual,
      EMPRESA_COORDENADAS
    );

    if (rutaFinal) {
      coordenadasCompletas = [...coordenadasCompletas, ...rutaFinal.coordenadas];
      distanciaTotal += rutaFinal.distancia;
      tiempoTotal += rutaFinal.duracion;
    }

    setRutaDetallada(coordenadasCompletas);
    return { coordenadas: coordenadasCompletas, distancia: distanciaTotal, tiempo: tiempoTotal };
  };

  // Nuevo método para solo generar la ruta en el mapa
  const generarRutaEnMapa = async (clientesPersonalizados?: ClienteConCoords[]) => {
    const seleccionados = clientesPersonalizados ?? clientesParaRuta();

    if (seleccionados.length === 0) {
      alert('No hay clientes que coincidan con los filtros seleccionados.');
      return;
    }
    
    setCargandoRuta(true);
    const ruta = optimizarRuta(seleccionados);
    setRutaOptimizada(ruta);
    setMostrarRuta(true);
    const resultadoRuta = await obtenerRutaCompleta(ruta);
    const distancia = resultadoRuta.distancia;
    const tiempo = resultadoRuta.tiempo;
    if (distancia === 0 || tiempo === 0) {
      setRutaLista(false);
      setCargandoRuta(false);
      return;
    }
    setDistanciaTotal(distancia);
    setTiempoEstimado(tiempo);
    setRutaLista(true);

    if (clienteAfectado !== null) {
      const sigueEnRuta = rutaOptimizada.some(c => c.id === clienteAfectado);
      if (!sigueEnRuta) {
        setEditingState({ isEditing: false, clienteId: null });
      }
      setClienteAfectado(null);
    }

    setCargandoRuta(false);
    fetchClientesAtendidos();
    setVistaMovil('mapa');
  };

  const descargarHojaRuta = () => {
    if (!rutaLista || !rutaOptimizada.length) {
      alert('Primero debes generar la ruta en el mapa.');
      return;
    }

    try {
      const ahora = new Date();
      descargarHojaRutaExcel(rutaOptimizada, {
        anio: ahora.getFullYear(),
        mes: ahora.getMonth() + 1,
        repartidor: filtroRepartidor,
        diaReparto: filtroDia,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo generar el Excel');
    }
  };

  const enviarRutaAlRepartidor = async () => {
    if (!rutaLista || !rutaOptimizada.length) {
      alert('Primero debes generar la ruta en el mapa.');
      return;
    }
    if (filtroRepartidor === 'todos') {
      alert('Seleccioná un repartidor concreto para enviarle la ruta.');
      return;
    }

    const repartidor = repartidores.find(
      (r) => r.nombre.trim() === filtroRepartidor.trim()
    );
    if (!repartidor) {
      alert('No se encontró la ficha del repartidor seleccionado.');
      return;
    }

    const confirmar = window.confirm(
      `¿Enviar ${rutaOptimizada.length} paradas a ${repartidor.nombre}? Se reemplaza su ruta de hoy.`
    );
    if (!confirmar) return;

    setEnviandoRuta(true);
    try {
      const resultado = await repartidorRutaService.delegarRuta({
        repartidor_id: repartidor.id,
        reemplazar: true,
        paradas: rutaOptimizada.map((cliente, index) => ({
          cliente_id: cliente.id,
          orden: index + 1,
        })),
      });
      alert(
        `Ruta enviada a ${resultado.repartidor.nombre}: ${resultado.cantidad} paradas` +
          (resultado.push_enviado > 0 ? ' (notificación enviada).' : '.')
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo enviar la ruta');
    } finally {
      setEnviandoRuta(false);
    }
  };

  useEffect(() => {
    if (
      editingState.isEditing &&
      editingState.clienteId !== null &&
      clientesOmitidos.includes(editingState.clienteId)
    ) {
      setEditingState({ isEditing: false, clienteId: null });
    }
  }, [clientesOmitidos]);

  // Modificar el useEffect existente de ESC para incluir la limpieza del estado de edición
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modoCrearZona) {
          cancelarCrearZona();
          return;
        }
        if (zonaSeleccionadaId != null) {
          setZonaSeleccionadaId(null);
          resetFormZona();
          return;
        }
        if (mostrarRuta) {
          setShowConfirmSalirRuta(true);
        }
        // Limpiar el estado de edición y cerrar el popup
        setEditingState({ isEditing: false, clienteId: null });
        setSelectedPosition(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mostrarRuta, modoCrearZona, zonaSeleccionadaId]);

  // Función para limpiar todo el estado de la ruta
  const limpiarRuta = () => {
    setMostrarRuta(false);
    setRutaOptimizada([]);
    setClientesOmitidos([]);
    setRutaDetallada([]);
    setDistanciaTotal(0);
    setTiempoEstimado(0);
    setRutaLista(false);
    setCargandoRuta(false);
    setClientesAtendidos([]);
  };

  const editandoZona = modoCrearZona || zonaSeleccionadaId != null;

  const composerSharedProps = {
    modoCrear: modoCrearZona,
    tipoCreacion,
    tipoActivo,
    formNombre: formZonaNombre,
    formRadio: formZonaRadio,
    formRepartidor: formZonaRepartidor,
    formColor: formZonaColor,
    formBarrio: formZonaBarrio,
    puntosPoligono: poligonoActivo.length,
    clientesEnZona: clientesEnZonaActiva,
    guardando: guardandoZona,
    cargandoLimites,
    mensajeLimites,
    puedeGuardar: puedeGuardarZona,
    barrios: barriosCatalogo,
    repartidores,
    onDelegarZona: !modoCrearZona && zonaSeleccionadaId != null
      ? () => setMostrarDelegarZona(true)
      : undefined,
    onCancelar: cerrarEditorZona,
    onSeleccionarTipo: seleccionarTipoCreacion,
    onNombreChange: setFormZonaNombre,
    onRadioChange: setFormZonaRadio,
    onRepartidorChange: setFormZonaRepartidor,
    onColorChange: setFormZonaColor,
    onBarrioChange: (nombre: string) => {
      setFormZonaBarrio(nombre);
      if (nombre) setFormZonaNombre(nombre);
      setBorradorPoligono([]);
      setMensajeLimites(null);
      setOrigenLimites(null);
    },
    onDetectarBarrio: () => void detectarLimitesBarrio(),
    onDeshacerPunto: () => {
      setBorradorPoligono((prev) => {
        const next = prev.slice(0, -1);
        if (!modoCrearZona && zonaSeleccionadaId != null) {
          setZonasRadio((zonas) =>
            zonas.map((z) =>
              z.id === zonaSeleccionadaId ? { ...z, poligono: next } : z
            )
          );
        }
        return next;
      });
    },
    onLimpiarPoligono: () => {
      setBorradorPoligono([]);
      if (!modoCrearZona && zonaSeleccionadaId != null) {
        setZonasRadio((zonas) =>
          zonas.map((z) =>
            z.id === zonaSeleccionadaId ? { ...z, poligono: [] } : z
          )
        );
      }
    },
    onGuardar: () => void guardarZona(),
    onEliminar:
      !modoCrearZona && zonaSeleccionadaId != null
        ? () => void eliminarZonaSeleccionada()
        : undefined,
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-stretch w-full bg-gray-100 rounded-xl p-2 sm:p-4 pb-24 lg:pb-4 min-h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-8rem)] lg:min-h-0 lg:overflow-hidden">
        {/* Tabs solo mobile: filtros vs mapa a pantalla usable */}
        <div className="lg:hidden mb-2 flex gap-2 rounded-xl bg-white p-1 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => setVistaMovil('filtros')}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              vistaMovil === 'filtros'
                ? 'bg-teal-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Filtros
          </button>
          <button
            type="button"
            onClick={() => setVistaMovil('mapa')}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              vistaMovil === 'mapa'
                ? 'bg-teal-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mapa
          </button>
        </div>

        {/* Panel izquierdo */}
        <div
          className={`flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 w-full lg:max-w-md bg-white rounded-xl lg:rounded-r-none shadow-lg shrink-0 lg:overflow-y-auto lg:h-full ${
            vistaMovil === 'mapa' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <h1 className="mb-2 text-xl sm:text-2xl font-bold">Zonas y Repartos</h1>
          <div className="flex flex-col gap-4">
            <label className="font-semibold" htmlFor="buscarCliente">Buscar cliente</label>
            <input 
              id="buscarCliente" 
              type="text" 
              placeholder="Nombre o dirección" 
              className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              disabled={cargandoRuta}
            />
            
            <label className="font-semibold" htmlFor="dia">Día de reparto</label>
            <select 
              id="dia" 
              className="px-3 py-2 rounded-md border"
              value={filtroDia}
              onChange={(e) => setFiltroDia(e.target.value)}
              disabled={cargandoRuta}
            >
              {diasOptions.map((dia) => (
                <option key={dia} value={dia}>
                  {dia === 'todos' ? 'Todos los días' : dia}
                </option>
              ))}
            </select>

            <label className="font-semibold" htmlFor="repartidor">Repartidor</label>
            <select 
              id="repartidor" 
              className="px-3 py-2 rounded-md border"
              value={filtroRepartidor}
              onChange={(e) => setFiltroRepartidor(e.target.value)}
              disabled={cargandoRuta}
            >
              {repartidoresOptions.map((repartidor) => (
                <option key={repartidor} value={repartidor}>
                  {repartidor === 'todos' ? 'Todos los repartidores' : repartidor}
                </option>
              ))}
            </select>

            <label className="font-semibold" htmlFor="zona">Zona</label>
            <select 
              id="zona" 
              className="px-3 py-2 rounded-md border"
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
              disabled={cargandoRuta}
            >
              {zonasUnicas.map((zona) => (
                <option key={zona} value={zona}>
                  {zona === 'todos' ? 'Todas las zonas' : zona}
                </option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <button
                type="button"
                className="lg:hidden px-4 py-2 mt-2 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded w-full"
                onClick={() => setVistaMovil('mapa')}
              >
                Ver mapa
              </button>
              <button
                className={`px-4 py-2 mt-2 sm:mt-4 text-sm sm:text-base text-white rounded w-full sm:w-auto ${
                  seguirRecorrido
                    ? 'bg-teal-700 hover:bg-teal-800 ring-2 ring-teal-300'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
                onClick={() => (seguirRecorrido ? detenerSeguirRecorrido() : activarSeguirRecorrido())}
                disabled={cargandoRuta}
              >
                {seguirRecorrido ? 'Detener seguimiento' : 'Seguir recorrido'}
              </button>
              <button
                className="px-4 py-2 mt-2 sm:mt-4 text-sm sm:text-base text-white bg-blue-500 rounded hover:bg-blue-600 w-full sm:w-auto"
                onClick={() => generarRutaEnMapa()}
              >
                Generar Ruta en el Mapa
              </button>
              <button
                className={`px-4 py-2 mt-2 sm:mt-4 text-sm sm:text-base text-white rounded w-full sm:w-auto ${rutaLista ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
                onClick={descargarHojaRuta}
                disabled={!rutaLista}
              >
                Descargar Excel Hoja de Ruta
              </button>
              <button
                className={`px-4 py-2 mt-2 sm:mt-4 text-sm sm:text-base text-white rounded w-full sm:w-auto ${
                  rutaLista && filtroRepartidor !== 'todos' && !enviandoRuta
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={() => void enviarRutaAlRepartidor()}
                disabled={!rutaLista || filtroRepartidor === 'todos' || enviandoRuta}
              >
                {enviandoRuta ? 'Enviando...' : 'Enviar al repartidor'}
              </button>
              {mostrarRuta && (
                <button
                  className="px-4 py-2 mt-2 sm:mt-4 text-sm sm:text-base text-white bg-red-500 rounded hover:bg-red-600 w-full sm:w-auto"
                  onClick={() => {
                    setMostrarRuta(false);
                    setRutaOptimizada([]);
                    setClientesOmitidos([]);
                    setRutaDetallada([]);
                    setDistanciaTotal(0);
                    setTiempoEstimado(0);
                    setRutaLista(false);
                  }}
                >
                  Limpiar Ruta
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <h2 className="font-semibold">Total de clientes: {clientesFiltrados.length}</h2>
            {seguirRecorrido && (
              <div className="p-3 text-sm rounded-lg border border-teal-200 bg-teal-50">
                <p className="font-semibold text-teal-900">Seguimiento activo — {filtroRepartidor}</p>
                <p className="text-teal-800">
                  Atendidos hoy: {clientesAtendidosFiltrados} / {clientesFiltrados.length}
                </p>
                <p className="text-teal-700">
                  {repartidorUbicacion?.en_linea
                    ? `Ubicación en vivo (${new Date(repartidorUbicacion.actualizado_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })})`
                    : 'Sin señal GPS reciente del repartidor (últimas 2 h)'}
                </p>
              </div>
            )}
            <div className="space-y-3">
              {editandoZona && (
                <ZonaComposer
                  layout="sidebar"
                  {...composerSharedProps}
                  onIrAlMapa={() => setVistaMovil('mapa')}
                />
              )}
              <ZonasLista
                zonas={zonasRadio}
                contadores={contadoresPorZona}
                zonaSeleccionadaId={zonaSeleccionadaId}
                modoCrear={modoCrearZona}
                disabled={cargandoRuta || guardandoZona}
                onIniciarCrear={iniciarCrearZona}
                onSeleccionarZona={seleccionarZona}
              />
              {zonaSeleccionada && !modoCrearZona && (
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  onClick={() => setMostrarDelegarZona(true)}
                >
                  Delegar zona
                </button>
              )}
            </div>

            <div className="p-3 mt-4 bg-gray-50 rounded-lg">
              <h3 className="mb-2 text-sm font-semibold">Leyenda de repartidores:</h3>
              <p className="mb-2 text-xs text-gray-500">Tocá el pin para cambiar el color.</p>
              <ul className="space-y-2 text-sm">
                {repartidorPalette.map((item) => {
                  const editando = editandoColorRepartidor === item.nombre;
                  return (
                    <li key={item.nombre} className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          title={`Cambiar color de ${item.nombre}`}
                          aria-label={`Cambiar color de ${item.nombre}`}
                          disabled={guardandoColorPin}
                          onClick={() => {
                            setEditandoColorRepartidor((prev) => {
                              if (prev === item.nombre) return null;
                              setColorPinBorrador(item.color || REPARTIDOR_PIN_COLORS[0]);
                              return item.nombre;
                            });
                          }}
                          className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.icon.url}
                            alt=""
                            className="w-4 h-auto drop-shadow-sm"
                            aria-hidden
                          />
                        </button>
                        <span className="flex-1">{item.nombre}</span>
                        <span
                          className="h-3 w-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: item.color }}
                          aria-hidden
                        />
                      </div>
                      {editando && (
                        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-2">
                          <RepartidorColorPicker
                            id={`color-pin-${item.nombre}`}
                            label=""
                            value={colorPinBorrador}
                            disabled={guardandoColorPin}
                            onChange={setColorPinBorrador}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={guardandoColorPin}
                              onClick={() => setEditandoColorRepartidor(null)}
                              className="flex-1 rounded-lg bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={guardandoColorPin}
                              onClick={() => {
                                void guardarColorRepartidor(item.nombre, colorPinBorrador);
                              }}
                              className="flex-1 rounded-lg bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {guardandoColorPin ? 'Guardando…' : 'Guardar color'}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
                {repartidorPalette.length === 0 && (
                  <li className="text-gray-500">No hay repartidores registrados.</li>
                )}
                <li className="flex gap-2 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={MARKER_ICONS.gris.url}
                    alt=""
                    className="w-4 h-auto drop-shadow-sm"
                    aria-hidden
                  />
                  <span>Pendiente de atención hoy</span>
                </li>
                <li className="flex gap-2 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={MARKER_ICONS.repartidorActivo.url}
                    alt=""
                    className="w-4 h-auto drop-shadow-sm"
                    aria-hidden
                  />
                  <span>Repartidor en vivo</span>
                </li>
                <li className="flex gap-2 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={MARKER_ICONS.gris.url}
                    alt=""
                    className="w-4 h-auto drop-shadow-sm"
                    aria-hidden
                  />
                  <span>Clientes fuera del filtro</span>
                </li>
                <li className="flex gap-2 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={MARKER_ICONS.gris.url}
                    alt=""
                    className="w-4 h-auto drop-shadow-sm"
                    aria-hidden
                  />
                  <span>Clientes sin repartidor asignado</span>
                </li>
                <li className="flex gap-2 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={MARKER_ICONS.empresa.url}
                    alt=""
                    className="w-4 h-auto drop-shadow-sm"
                    aria-hidden
                  />
                  <span>Sodería (punto de partida)</span>
                </li>
              </ul>
            </div>
          </div>

          {mostrarRuta && (
            <div className="p-4 mt-4 bg-gray-50 rounded-lg">
              <h3 className="mb-2 font-semibold">Información de la Ruta</h3>
              <p><span className="font-semibold">Distancia total:</span> {(distanciaTotal / 1000).toFixed(2)} km</p>
              <p><span className="font-semibold">Tiempo estimado:</span> {Math.round(tiempoEstimado / 60)} minutos</p>
              <p><span className="font-semibold">Atendidos hoy:</span> {clientesAtendidos.filter(id => rutaOptimizada.some(c => c.id === id)).length} / {rutaOptimizada.length}</p>
            </div>
          )}
        </div>

        {/* Mapa: llena la columna; sin bloquear en blanco debajo */}
        <div
          className={`overflow-hidden relative flex-1 bg-white rounded-xl lg:rounded-l-none shadow-lg lg:h-full lg:min-h-0 ${
            vistaMovil === 'filtros' ? 'hidden lg:block' : 'block'
          } h-[calc(100dvh-11rem)]`}
        >
          <div className="absolute inset-0">
            <MapComponent
              clientes={clientesParaMapa}
              mostrarRuta={mostrarRuta}
              rutaOptimizada={rutaOptimizada}
              clientesOmitidos={clientesOmitidos}
              onToggleOmitirCliente={toggleOmitirCliente}
              onGenerarRuta={generarRutaEnMapa}
              onLimpiarRuta={limpiarRuta}
              filtrosMapa={filtrosMapa}
              clientesIncluidos={clientesIncluidos}
              rutaDetallada={rutaDetallada}
              onClienteActualizado={actualizarClienteEnMapa}
              onClienteEliminado={eliminarClienteEnMapa}
              clientesAtendidos={clientesAtendidos}
              repartidorPalette={repartidorPalette}
              repartidores={repartidores}
              seguirRecorrido={seguirRecorrido}
              repartidorUbicacion={repartidorUbicacion}
              mapaVisible={vistaMovil === 'mapa' || esDesktop}
              zonasRadio={zonasParaMapa}
              zonaSeleccionadaId={zonaSeleccionadaId}
              onSeleccionarZona={seleccionarZona}
              modoDibujoZona={modoCrearZona ? tipoCreacion : null}
              borradorZona={borradorZona}
              onMapClickZona={handleMapClickZona}
              onMoverCentroZona={(lat, lng) => void moverCentroZonaSeleccionada(lat, lng)}
              onActualizarPoligonoZona={actualizarPoligonoZona}
              ocultarBannerDibujo
              onCrearClienteEnPunto={(lat, lng) => setAltaClienteMapa({ lat, lng })}
              onIniciarCrearZona={iniciarCrearZona}
              mostrarBotonZona={!editandoZona}
              botonZonaDeshabilitado={cargandoRuta || guardandoZona}
              puntoNuevoCliente={
                altaClienteMapa
                  ? { lat: altaClienteMapa.lat, lng: altaClienteMapa.lng }
                  : null
              }
            />
          </div>

          {editandoZona && (
            <>
              <div className="hidden lg:block">
                <ZonaMapHint tipo={tipoActivo} />
              </div>
              <div className="lg:hidden">
                <ZonaComposer layout="dock" {...composerSharedProps} />
              </div>
            </>
          )}

        </div>
      </div>
      {/* Footer fijo con datos de la ruta — se oculta al editar zona en mobile */}
      <footer
        className={`flex flex-col sm:flex-row fixed bottom-0 left-0 md:left-60 gap-1 sm:gap-8 justify-center items-center px-3 sm:px-6 py-2 sm:py-3 w-full md:w-[calc(100%-15rem)] text-xs sm:text-base bg-white border-t border-gray-200 shadow-lg safe-bottom z-[999] ${
          editandoZona && !esDesktop ? 'hidden' : ''
        }`}
      >
        <span className="font-semibold text-gray-700">
          Objetivos/Clientes: {mostrarRuta && rutaOptimizada.length ? rutaOptimizada.length : 0}
        </span>
        <span className="font-semibold text-gray-700">
          Tiempo estimado: {mostrarRuta && tiempoEstimado > 0 ? Math.round(tiempoEstimado / 60) + ' min' : '--'}
        </span>
        <span className="font-semibold text-gray-700">
          Distancia total: {mostrarRuta && distanciaTotal > 0 ? (distanciaTotal / 1000).toFixed(2) + ' km' : '--'}
        </span>
      </footer>
      <NuevoClienteModal
        isOpen={altaClienteMapa != null}
        onClose={() => setAltaClienteMapa(null)}
        onClienteAgregado={() => {
          void fetchClientes();
        }}
        ubicacionInicial={
          altaClienteMapa
            ? { latitud: altaClienteMapa.lat, longitud: altaClienteMapa.lng }
            : null
        }
      />
      {cargandoRuta && <Spinner />}
      <ConfirmModal
        open={showConfirmSalirRuta}
        onConfirm={() => { setShowConfirmSalirRuta(false); limpiarRuta(); }}
        onCancel={() => setShowConfirmSalirRuta(false)}
      />
      {zonaGeometriaActiva && (
        <DelegarZonaModal
          open={mostrarDelegarZona}
          onClose={() => setMostrarDelegarZona(false)}
          zona={zonaGeometriaActiva}
          clientes={clientesParaMapa.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            direccion: c.direccion,
            telefono: c.telefono,
            repartidor: c.repartidor,
            latitud: c.latitud,
            longitud: c.longitud,
          }))}
          repartidores={repartidores}
          onDelegado={() => {
            void fetchClientes();
            void fetchZonasRadio();
          }}
        />
      )}
    </>
  );
};

export default PageZonasyRepartos;