"use client"

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';

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
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] flex flex-col items-center">
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

const PageZonasyRepartos = () => {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);
  const [useMapEvents, setUseMapEvents] = useState<any>(null);
  const [Polyline, setPolyline] = useState<any>(null);

  useEffect(() => {
    // Importar Leaflet solo en el cliente
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      // Fix para los íconos de Leaflet en React
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });

    // Importar react-leaflet solo en el cliente
    import('react-leaflet').then((reactLeaflet) => {
      setMapContainer(reactLeaflet.MapContainer);
      setTileLayer(reactLeaflet.TileLayer);
      setMarker(reactLeaflet.Marker);
      setPopup(reactLeaflet.Popup);
      setUseMapEvents(reactLeaflet.useMapEvents);
      setPolyline(reactLeaflet.Polyline);
    });

    setIsClient(true);
  }, []);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
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

  const mapRef = useRef<any>(null);

  // Función para obtener los clientes
  const fetchClientes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los clientes');
      }

      const data = await response.json();
      console.log('Clientes obtenidos:', data);
      
      // Filtrar solo los clientes que tienen coordenadas
      const clientesConCoordenadas = data.filter((cliente: Cliente) => 
        cliente.latitud && cliente.longitud
      );
      
      setClientes(clientesConCoordenadas);
      setClientesFiltrados(clientesConCoordenadas);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  // Modificar la función aplicarFiltros para que no filtre, solo marque
  const aplicarFiltros = () => {
    let resultado = [...clientes];
    setClientesFiltrados(resultado);
  };

  // Aplicar filtros cuando cambien los valores
  useEffect(() => {
    aplicarFiltros();
  }, [filtroDia, filtroRepartidor, filtroZona, busqueda]);

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClientes();
  }, []);

  // Obtener valores únicos para los selectores
  const diasUnicos = ['todos', ...Array.from(new Set(clientes.map(c => c.dia_reparto)))];
  const repartidoresUnicos = ['todos', ...Array.from(new Set(clientes.map(c => {
    if (c.repartidor && c.repartidor.toLowerCase().includes('david')) return 'David Schenatti';
    return c.repartidor;
  })))] ;
  const zonasUnicas = ['todos', ...Array.from(new Set(clientes.map(c => c.zona)))];

  // Agrega esta función para actualizar las coordenadas
  const actualizarCoordenadas = async (clienteId: number, lat: number, lon: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitud: lat, longitud: lon }),
      });

      if (!response.ok) throw new Error('Error al actualizar coordenadas');

      // Actualizar el estado local
      setClientes(prev => prev.map(cliente => 
        cliente.id === clienteId 
          ? { ...cliente, latitud: lat, longitud: lon }
          : cliente
      ));
      setClientesFiltrados(prev => prev.map(cliente => 
        cliente.id === clienteId 
          ? { ...cliente, latitud: lat, longitud: lon }
          : cliente
      ));

      // Mostrar mensaje de éxito
      alert('Ubicación actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar coordenadas:', error);
      alert('Error al actualizar la ubicación');
    }
  };

  // Agrega esta función para obtener la dirección desde coordenadas
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
      console.error('Error al obtener la dirección:', error);
      return 'No se pudo obtener la dirección';
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
      if (cliente) {
        const coincideConFiltros = (
          (filtroDia === 'todos' || cliente.dia_reparto.toLowerCase().includes(filtroDia.toLowerCase())) &&
          (filtroRepartidor === 'todos' || cliente.repartidor === filtroRepartidor) &&
          (filtroZona === 'todos' || cliente.zona === filtroZona)
        );
        
        if (!coincideConFiltros) {
          setClientesIncluidos(prev => 
            prev.includes(clienteId) ? prev : [...prev, clienteId]
          );
        }
      }
      
      return nuevosOmitidos;
    });
  };

  // Efecto para regenerar la ruta cuando cambian los clientes omitidos
  useEffect(() => {
    if (mostrarRuta) {
      const clientesParaRuta = clientes.filter(c =>
        !clientesOmitidos.includes(c.id) &&
        (
          clientesIncluidos.includes(c.id) ||
          (
            (filtroDia === 'todos' || c.dia_reparto.toLowerCase().includes(filtroDia.toLowerCase())) &&
            (filtroRepartidor === 'todos' || c.repartidor === filtroRepartidor) &&
            (filtroZona === 'todos' || c.zona === filtroZona)
          )
        )
      );
      generarRutaEnMapa(clientesParaRuta);
    }
  }, [
    clientesOmitidos,
    mostrarRuta,
    filtroDia,
    filtroRepartidor,
    filtroZona,
    clientesIncluidos,
    clientes // si los clientes pueden cambiar dinámicamente
  ]);

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

  // Función para obtener la ruta detallada entre dos puntos usando OSRM
  const obtenerRutaDetallada = async (origen: [number, number], destino: [number, number]) => {
    try {
      console.log('Solicitando ruta de:', origen, 'a:', destino);
      
      const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;
      console.log('URL de la solicitud:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Respuesta de OSRM:', data);
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const ruta = {
          coordenadas: data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]),
          distancia: data.routes[0].distance,
          duracion: data.routes[0].duration
        };
        console.log('Ruta procesada:', ruta);
        return ruta;
      } else {
        console.error('Error en la respuesta de OSRM:', data);
        return null;
      }
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
    const clientesParaRuta = clientesPersonalizados ||
      clientes.filter(c =>
        !clientesOmitidos.includes(c.id) &&
        (
          // Incluidos manualmente (aunque estén en gris)
          clientesIncluidos.includes(c.id)
          // O cumplen todos los filtros
          || (
            (filtroDia === 'todos' || c.dia_reparto.toLowerCase().includes(filtroDia.toLowerCase())) &&
            (filtroRepartidor === 'todos' || c.repartidor === filtroRepartidor) &&
            (filtroZona === 'todos' || c.zona === filtroZona)
          )
        )
      );
    
    if (clientesParaRuta.length === 0) return;
    
    setCargandoRuta(true);
    const ruta = optimizarRuta(clientesParaRuta);
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

    if (mapRef.current) {
      mapRef.current.closePopup();
    }

    setCargandoRuta(false);
  };

  // Modificar la función para descargar la hoja de ruta
  const descargarHojaRuta = () => {
    if (!rutaLista || !rutaOptimizada.length) {
      alert('Primero debes generar la ruta en el mapa.');
      return;
    }
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
    if (typeof window !== "undefined") {
      const blob = new Blob([contenido], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hoja_ruta_${filtroDia}_${filtroRepartidor}_${new Date().toLocaleDateString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
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
        if (mostrarRuta) {
          setShowConfirmSalirRuta(true);
        }
        // Limpiar el estado de edición y cerrar el popup
        setEditingState({ isEditing: false, clienteId: null });
        setSelectedPosition(null);
        if (mapRef.current) {
          mapRef.current.closePopup();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mostrarRuta]);

  // Agregar este componente dentro del MapContainer
  const MapEvents = () => {
    useMapEvents({
      click: () => {
        setEditingState({ isEditing: false, clienteId: null });
        setSelectedPosition(null);
      }
    });
    return null;
  };

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
  };

  if (!isClient || !L || !MapContainer) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-blue-500 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-stretch min-h-[95vh] w-full bg-gray-100 rounded-xl p-4">
        {/* Panel izquierdo */}
        <div className="flex flex-col gap-6 p-8 w-full max-w-md bg-white rounded-l-xl shadow-lg">
          <h1 className="mb-2 text-2xl font-bold">Zonas y Repartos</h1>
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
              {diasUnicos.map((dia) => (
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
              {repartidoresUnicos.map((repartidor) => (
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

            <div className="flex gap-2">
              <button
                className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
                onClick={() => generarRutaEnMapa()}
              >
                Generar Ruta en el Mapa
              </button>
              <button
                className={`px-4 py-2 mt-4 text-white rounded ${rutaLista ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
                onClick={descargarHojaRuta}
                disabled={!rutaLista}
              >
                Descargar Hoja de Ruta
              </button>
              {mostrarRuta && (
                <button
                  className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-600"
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
              </ul>
            </div>
          </div>

          {mostrarRuta && (
            <div className="p-4 mt-4 bg-gray-50 rounded-lg">
              <h3 className="mb-2 font-semibold">Información de la Ruta</h3>
              <p><span className="font-semibold">Distancia total:</span> {(distanciaTotal / 1000).toFixed(2)} km</p>
              <p><span className="font-semibold">Tiempo estimado:</span> {Math.round(tiempoEstimado / 60)} minutos</p>
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className="overflow-hidden flex-1 h-full bg-white rounded-r-xl shadow-lg">
          <MapContainer
            ref={mapRef}
            center={center}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
          >
            <MapEvents />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Línea de la ruta detallada */}
            {mostrarRuta && rutaDetallada.length > 0 && (
              <Polyline
                positions={rutaDetallada}
                color="#FF0000"
                weight={3}
                opacity={0.7}
              />
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
              const coincideConFiltros = (
                (filtroDia === 'todos' || cliente.dia_reparto.toLowerCase().includes(filtroDia.toLowerCase())) &&
                (filtroRepartidor === 'todos' || cliente.repartidor === filtroRepartidor) &&
                (filtroZona === 'todos' || cliente.zona === filtroZona)
              );
              
              const estaIncluido = clientesIncluidos.includes(cliente.id);
              const estaOmitido = clientesOmitidos.includes(cliente.id);
              
              // Determinar el ícono a usar
              let icono = iconAxel; // default
              if (cliente.repartidor === 'Gustavo Careaga') {
                icono = iconGustavo;
              } else if (cliente.repartidor && cliente.repartidor.toLowerCase().includes('david')) {
                icono = iconDavid;
              }
              
              // Si no coincide con filtros y no está incluido, usar ícono gris
              if (!coincideConFiltros && !estaIncluido) {
                icono = new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                });
              }
              
              return (
                <Marker 
                  key={cliente.id} 
                  position={[cliente.latitud, cliente.longitud]}
                  icon={icono}
                  eventHandlers={{
                    click: (e: any) => {
                      if (!cargandoRuta) {
                        // Cerrar cualquier popup abierto
                        if (mapRef.current) {
                          mapRef.current.closePopup();
                        }
                        setEditingState({ isEditing: true, clienteId: cliente.id });
                        setSelectedPosition([cliente.latitud, cliente.longitud]);
                        // Abrir el popup del marcador actual
                        e.target.openPopup();
                      }
                    }
                  }}
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
                              (!coincideConFiltros && !estaIncluido) ? "bg-green-500 hover:bg-green-600"
                              : estaOmitido ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                            }`}
                            onClick={() => {
                              if (!coincideConFiltros && !estaIncluido) {
                                // Incluir directamente, sin alternar omitido
                                setClientesIncluidos(prev => [...prev, cliente.id]);
                                setClientesOmitidos(prev => prev.filter(id => id !== cliente.id));
                              } else if (estaIncluido && !coincideConFiltros && !estaOmitido) {
                                // Si está incluido manualmente y no omitido, al omitirlo lo quitamos de incluidos y lo agregamos a omitidos
                                setClientesIncluidos(prev => prev.filter(id => id !== cliente.id));
                                setClientesOmitidos(prev => [...prev, cliente.id]);
                              } else {
                                setClienteAfectado(cliente.id);
                                toggleOmitirCliente(cliente.id);
                              }
                            }}
                          >
                            {(!coincideConFiltros && !estaIncluido) ? "Incluir en ruta"
                              : estaOmitido ? "Incluir en ruta"
                              : "Omitir de ruta"}
                          </button>
                        </>
                      )}
                      <button 
                        className={`px-3 py-1 mt-2 text-white rounded ${
                          cargandoRuta || mostrarRuta
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        onClick={() => {
                          if (!(cargandoRuta || mostrarRuta)) {
                            setEditingState({ isEditing: true, clienteId: cliente.id });
                            setSelectedPosition([cliente.latitud, cliente.longitud]);
                          }
                        }}
                        disabled={cargandoRuta || mostrarRuta}
                      >
                        Editar ubicación
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            
            {/* Marcador de edición */}
            {editingState.isEditing && selectedPosition && (
              <Marker
                position={selectedPosition}
                draggable={!cargandoRuta && !mostrarRuta}
                eventHandlers={{
                  dragend: async (e: any) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    setTempPosition([position.lat, position.lng]);
                    // Obtener la dirección al soltar el marcador
                    const direccion = await obtenerDireccion(position.lat, position.lng);
                    setTempDireccion(direccion);
                    setShowConfirmDialog(true);
                    marker.openPopup();
                  }
                }}
              >
                <Popup>
                  <div>
                    {(!cargandoRuta && !mostrarRuta) && (
                      <div>
                        <p className="font-semibold">¿Quieres modificar la ubicación de este cliente?</p>
                        <p className="mt-2 text-sm text-gray-600">
                          Nueva ubicación: {tempDireccion}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button 
                            className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                            onClick={() => {
                              if (editingState.clienteId && tempPosition) {
                                actualizarCoordenadas(editingState.clienteId, tempPosition[0], tempPosition[1]);
                                setSelectedPosition(tempPosition);
                                setShowConfirmDialog(false);
                                setTempPosition(null);
                                setTempDireccion('');
                              }
                            }}
                          >
                            Sí, actualizar
                          </button>
                          <button 
                            className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                            onClick={() => {
                              setShowConfirmDialog(false);
                              setTempPosition(null);
                              setTempDireccion('');
                            }}
                          >
                            No, cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
      {/* Footer fijo con datos de la ruta */}
      <footer
        className="flex fixed bottom-0 left-0 gap-8 justify-center items-center px-6 py-3 w-full text-base bg-white border-t border-gray-200 shadow-lg"
        style={{ minHeight: '48px', zIndex: 999 }}
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

// Exportar el componente como dinámico con ssr deshabilitado
export default dynamic(() => Promise.resolve(PageZonasyRepartos), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full border-4 border-blue-500 animate-spin border-t-transparent"></div>
        <p className="mt-4 text-lg text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});