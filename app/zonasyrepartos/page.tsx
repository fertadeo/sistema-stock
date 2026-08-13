"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { authFetch } from '@/lib/api/fetchWithAuth';
import { buildRepartidorPalette, MARKER_ICONS } from '@/lib/map/repartidorMarkers';
import { normalizarClienteConCoords } from '@/lib/map/clienteCoords';
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
import ZonasLista from '@/components/ZonasLista';
import ZonaComposer, { ZonaMapHint } from '@/components/ZonaComposer';
import zonasJson from '@/components/soderia-data/zonas.json';

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

interface Repartidor {
  id: number;
  nombre: string;
  zona_reparto?: string;
  activo?: boolean;
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
  const [rutaOptimizada, setRutaOptimizada] = useState<Cliente[]>([]);
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
  const [seguirRecorrido, setSeguirRecorrido] = useState(false);
  const [vistaMovil, setVistaMovil] = useState<'filtros' | 'mapa'>('mapa');
  const [esDesktop, setEsDesktop] = useState(false);
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

  // Función para obtener los clientes
  const fetchClientes = async () => {
    try {
      setIsLoading(true);
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los clientes');
      }

      const data = await response.json();
      console.log('Clientes obtenidos:', data);
      
      const clientesConCoordenadas = data
        .map((cliente: Cliente) => normalizarClienteConCoords(cliente))
        .filter((cliente: Cliente | null): cliente is Cliente => cliente !== null);
      
      setClientes(clientesConCoordenadas);
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
      clientes.filter(
        (cliente) =>
          !clientesOmitidos.includes(cliente.id) &&
          clienteIncluidoEnRuta(cliente, filtrosMapa, clientesIncluidos)
      ),
    [clientes, clientesOmitidos, filtrosMapa, clientesIncluidos]
  );

  // Cargar clientes y repartidores al montar el componente
  useEffect(() => {
    void fetchClientes();
    void fetchRepartidores();
    void fetchZonasRadio();
    void fetchBarriosCatalogo();
  }, [fetchZonasRadio, fetchBarriosCatalogo]);

  const repartidorPalette = useMemo(
    () => buildRepartidorPalette(repartidores.map((r) => r.nombre)),
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

  /** Zonas dibujadas; la seleccionada refleja el formulario en vivo. */
  const zonasParaMapa = useMemo(() => {
    if (!zonaSeleccionada || modoCrearZona) return zonasRadio;
    return zonasRadio.map((z) => {
      if (z.id !== zonaSeleccionada.id) return z;
      if (z.tipo === 'radio') {
        return {
          ...z,
          nombre: formZonaNombre || z.nombre,
          radio_metros: formZonaRadio,
          color: formZonaColor,
          repartidor: formZonaRepartidor.trim() || null,
        };
      }
      return {
        ...z,
        nombre: formZonaNombre || z.nombre,
        color: formZonaColor,
        repartidor: formZonaRepartidor.trim() || null,
        poligono: poligonoActivo.length >= 3 ? poligonoActivo : z.poligono,
      };
    });
  }, [
    zonasRadio,
    zonaSeleccionada,
    modoCrearZona,
    formZonaNombre,
    formZonaRadio,
    formZonaColor,
    formZonaRepartidor,
    poligonoActivo,
  ]);

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
        return contarClientesEnZona(clientes, {
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
        return contarClientesEnZona(clientes, {
          tipo: tipoCreacion,
          latitud: borradorPoligono[0].lat,
          longitud: borradorPoligono[0].lng,
          poligono: borradorPoligono,
        });
      }
      return null;
    }
    if (zonaSeleccionada) {
      if (zonaSeleccionada.tipo === 'radio') {
        return contarClientesEnZona(clientes, {
          tipo: 'radio',
          latitud: Number(zonaSeleccionada.latitud),
          longitud: Number(zonaSeleccionada.longitud),
          radio_metros: formZonaRadio,
        });
      }
      return contarClientesEnZona(clientes, {
        ...zonaSeleccionada,
        poligono: poligonoActivo.length >= 3 ? poligonoActivo : zonaSeleccionada.poligono,
      });
    }
    return null;
  }, [
    modoCrearZona,
    tipoCreacion,
    borradorCentro,
    formZonaRadio,
    borradorPoligono,
    zonaSeleccionada,
    clientes,
    poligonoActivo,
  ]);

  const contadoresPorZona = useMemo(() => {
    const map = new Map<number, number>();
    zonasRadio.forEach((zona) => {
      map.set(zona.id, contarClientesEnZona(clientes, zona));
    });
    return map;
  }, [zonasRadio, clientes]);

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

  const actualizarPoligonoZona = (puntos: PuntoMapa[]) => {
    if (modoCrearZona) {
      setBorradorPoligono(puntos);
      return;
    }
    if (!zonaSeleccionada) return;
    setZonasRadio((prev) =>
      prev.map((z) =>
        z.id === zonaSeleccionada.id ? { ...z, poligono: puntos } : z
      )
    );
    setBorradorPoligono(puntos);
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
  const optimizarRuta = (clientes: Cliente[]) => {
    if (clientes.length === 0) return [];

    const ruta: Cliente[] = [];
    const noVisitados = [...clientes].filter(cliente => !clientesOmitidos.includes(cliente.id));
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
  const encontrarPosicionMasCercana = (cliente: Cliente, rutaActual: Cliente[]): number => {
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
  const obtenerRutaCompleta = async (clientes: Cliente[]) => {
    if (clientes.length === 0) return { coordenadas: [], distancia: 0, tiempo: 0 };

    let coordenadasCompletas: [number, number][] = [];
    let distanciaTotal = 0;
    let tiempoTotal = 0;
    let puntoActual = EMPRESA_COORDENADAS;

    for (const cliente of clientes) {
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
  const generarRutaEnMapa = async (clientesPersonalizados?: Cliente[]) => {
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

  // Modificar la función para descargar la hoja de ruta
  const descargarHojaRuta = () => {
    if (!rutaLista || !rutaOptimizada.length) {
      alert('Primero debes generar la ruta en el mapa.');
      return;
    }

    if (typeof window === 'undefined') return;

    const distancia = distanciaTotal;
    const tiempo = tiempoEstimado;
    const ruta = rutaOptimizada;
    const contenido = `
      HOJA DE RUTA - ${filtroDia !== 'todos' ? filtroDia : 'Todos los días'}
      Repartidor: ${filtroRepartidor !== 'todos' ? filtroRepartidor : 'Todos'}
      Fecha: ${new Date().toLocaleDateString()}

      DISTANCIA TOTAL: ${(distancia / 1000).toFixed(2)} km
      TIEMPO ESTIMADO: ${Math.round(tiempo / 60)} minutos

      RUTA OPTIMIZADA:
      ${ruta.map((cliente, index) => `
        ${index + 1}. ${cliente.nombre}
           Dirección: ${cliente.direccion}
           Teléfono: ${cliente.telefono}
           Zona: ${cliente.zona}
      `).join('\n')}
    `;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoja_ruta_${filtroDia}_${filtroRepartidor}_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
                Descargar Hoja de Ruta
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

          <div className="mt-8">
            <h2 className="mb-2 font-semibold">Total de clientes: {clientesFiltrados.length}</h2>
            {seguirRecorrido && (
              <div className="p-3 mb-4 text-sm rounded-lg border border-teal-200 bg-teal-50">
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
            <div className="mt-4 space-y-3">
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
            </div>

            <div className="p-3 mt-4 bg-gray-50 rounded-lg">
              <h3 className="mb-2 text-sm font-semibold">Leyenda de repartidores:</h3>
              <ul className="space-y-2 text-sm">
                {repartidorPalette.map((item) => (
                  <li key={item.nombre} className="flex gap-2 items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.icon.url}
                      alt=""
                      className="w-4 h-auto drop-shadow-sm"
                      aria-hidden
                    />
                    <span>{item.nombre}</span>
                  </li>
                ))}
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
              clientes={clientes}
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

          {!editandoZona && (
            <button
              type="button"
              onClick={iniciarCrearZona}
              disabled={cargandoRuta || guardandoZona}
              className="absolute bottom-5 right-4 z-30 rounded-full bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-xl ring-2 ring-white/80 hover:bg-teal-700 disabled:opacity-50"
            >
              + Zona
            </button>
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
      {cargandoRuta && <Spinner />}
      <ConfirmModal
        open={showConfirmSalirRuta}
        onConfirm={() => { setShowConfirmSalirRuta(false); limpiarRuta(); }}
        onCancel={() => setShowConfirmSalirRuta(false)}
      />
    </>
  );
};

export default PageZonasyRepartos;