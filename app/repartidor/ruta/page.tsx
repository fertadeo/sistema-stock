"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  BellAlertIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  BoltIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  repartidorRapidoService,
  ClienteBasico,
} from '@/lib/services/repartidorRapidoService';
import {
  repartidorRutaService,
  activarPushNotifications,
  asegurarSuscripcionPushSilenciosa,
  type RutaParada,
} from '@/lib/services/repartidorRutaService';
import { obtenerDiagnosticoServiceWorker } from '@/lib/pwa/serviceWorker';

function puntuarCliente(c: ClienteBasico, termo: string): number {
  const t = termo.toLowerCase().trim();
  if (!t) return 0;
  const nom = (c.nombre || '').toLowerCase();
  const tel = (c.telefono || '').replace(/\s/g, '');
  const dir = (c.direccion || '').toLowerCase();
  if (nom.startsWith(t)) return 10;
  if (nom.includes(t)) return 5;
  if (tel.includes(t.replace(/\s/g, ''))) return 4;
  if (dir.includes(t)) return 3;
  return 0;
}

function formatearDireccion(cliente: RutaParada['cliente']) {
  if (!cliente) return '';
  const partes = [cliente.direccion];
  if (cliente.piso) partes.push(`Piso ${cliente.piso}`);
  if (cliente.departamento) partes.push(`Dto ${cliente.departamento}`);
  return partes.filter(Boolean).join(' · ');
}

function horaActualHHMM(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

export default function RepartidorRutaPage() {
  const router = useRouter();
  const [paradas, setParadas] = useState<RutaParada[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<ClienteBasico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [pushEstado, setPushEstado] = useState<'pendiente' | 'activo' | 'denegado'>('pendiente');
  const [pushServidor, setPushServidor] = useState(false);
  const [pushSuscrito, setPushSuscrito] = useState(false);
  const [registrandoPush, setRegistrandoPush] = useState(false);
  const [progresoPush, setProgresoPush] = useState('');
  const [diagnosticoSw, setDiagnosticoSw] = useState('');
  const [probandoPush, setProbandoPush] = useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteBasico | null>(null);
  const [comentario, setComentario] = useState('');
  const [horaAlerta, setHoraAlerta] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [editando, setEditando] = useState<RutaParada | null>(null);
  const [comentarioEdit, setComentarioEdit] = useState('');
  const [horaAlertaEdit, setHoraAlertaEdit] = useState('');

  const idsEnRuta = useMemo(() => new Set(paradas.map((p) => p.cliente_id)), [paradas]);

  const cargarParadas = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await repartidorRutaService.listarParadas();
      setParadas(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo cargar la ruta';
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarParadas();
  }, [cargarParadas]);

  useEffect(() => {
    const cargarEstadoPush = async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;

      if (Notification.permission === 'granted') {
        setPushEstado('activo');
      } else if (Notification.permission === 'denied') {
        setPushEstado('denegado');
      }

      try {
        const estado = await repartidorRutaService.obtenerEstadoPush();
        setPushServidor(estado.vapid_configurado);
        setPushSuscrito(estado.suscripcion_activa);

        if (estado.vapid_configurado && !estado.suscripcion_activa && Notification.permission === 'granted') {
          const registro = await asegurarSuscripcionPushSilenciosa();
          setPushSuscrito(registro.suscrito);
          if (registro.suscrito) {
            setMensaje('Celular registrado para recibir alertas push.');
          }
        }
      } catch {
        setPushServidor(false);
        setPushSuscrito(false);
      }
    };

    void cargarEstadoPush();
    void obtenerDiagnosticoServiceWorker().then((d) => {
      const partes = [
        `SW registrado: ${d.registraciones > 0 ? 'sí' : 'no'}`,
        d.estadoWorker ? `estado: ${d.estadoWorker}` : null,
        `controla página: ${d.controlaPagina ? 'sí' : 'no'}`,
      ].filter(Boolean);
      setDiagnosticoSw(partes.join(' · '));
    });
  }, []);

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultados([]);
      return;
    }

    let cancelado = false;
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const termo = busqueda.trim();
        let clientes = await repartidorRapidoService.buscarClientes(termo);
        if (clientes.length === 0) {
          const todos = await repartidorRapidoService.obtenerTodosClientes();
          clientes = todos.filter((c) => puntuarCliente(c, termo) > 0);
        }
        const ordenados = clientes
          .map((c) => ({ c, p: puntuarCliente(c, termo) }))
          .sort((a, b) => b.p - a.p)
          .map((x) => x.c)
          .filter((c) => !idsEnRuta.has(c.id));

        if (!cancelado) setResultados(ordenados.slice(0, 12));
      } catch {
        if (!cancelado) setResultados([]);
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busqueda, idsEnRuta]);

  const abrirFormularioCliente = (cliente: ClienteBasico) => {
    setClienteSeleccionado(cliente);
    setComentario('');
    setHoraAlerta('');
    setBusqueda('');
    setResultados([]);
  };

  const cerrarFormulario = () => {
    setClienteSeleccionado(null);
    setComentario('');
    setHoraAlerta('');
  };

  const agregarParada = async () => {
    if (!clienteSeleccionado) return;
    setGuardando(true);
    setError('');
    try {
      await repartidorRutaService.crearParada({
        cliente_id: clienteSeleccionado.id,
        comentario: comentario.trim() || undefined,
        hora_alerta: horaAlerta || undefined,
      });
      setMensaje(`${clienteSeleccionado.nombre} agregado a la ruta`);
      cerrarFormulario();
      await cargarParadas();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar a la ruta');
    } finally {
      setGuardando(false);
    }
  };

  const activarAlertas = async () => {
    setRegistrandoPush(true);
    setError('');
    setMensaje('');
    setProgresoPush('Iniciando registro...');
    const safety = window.setTimeout(() => {
      setRegistrandoPush(false);
      setProgresoPush('');
      setError(
        'El registro tardó demasiado. Usá WiFi, cerrá la app por completo, abrila desde el ícono y volvé a intentar.'
      );
    }, 120_000);
    try {
      const resultado = await activarPushNotifications({
        onProgreso: setProgresoPush,
      });
      if (resultado.ok && resultado.suscrito) {
        setPushEstado('activo');
        setPushSuscrito(true);
        setMensaje(resultado.razon || 'Celular registrado para alertas push');
        try {
          const estado = await repartidorRutaService.obtenerEstadoPush();
          setPushServidor(estado.vapid_configurado);
          setPushSuscrito(estado.suscripcion_activa);
        } catch {
          // estado ya actualizado localmente
        }
      } else if (resultado.ok && !resultado.suscrito) {
        setPushEstado('activo');
        setPushSuscrito(false);
        setMensaje(resultado.razon || 'Permiso OK, falta completar el registro push');
      } else {
        setPushSuscrito(false);
        setError(resultado.razon || 'No se pudieron activar las alertas');
      }
    } catch (err: unknown) {
      setPushSuscrito(false);
      setError(err instanceof Error ? err.message : 'Error inesperado al registrar alertas');
    } finally {
      window.clearTimeout(safety);
      setRegistrandoPush(false);
      setProgresoPush('');
      void obtenerDiagnosticoServiceWorker().then((d) => {
        const partes = [
          `SW registrado: ${d.registraciones > 0 ? 'sí' : 'no'}`,
          d.estadoWorker ? `estado: ${d.estadoWorker}` : null,
          `controla página: ${d.controlaPagina ? 'sí' : 'no'}`,
        ].filter(Boolean);
        setDiagnosticoSw(partes.join(' · '));
      });
    }
  };

  const probarPush = async () => {
    setProbandoPush(true);
    setError('');
    try {
      await repartidorRutaService.enviarPushPrueba();
      setMensaje('Notificación de prueba enviada. Debería aparecer en unos segundos.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la prueba');
    } finally {
      setProbandoPush(false);
    }
  };

  const eliminarParada = async (parada: RutaParada) => {
    if (!confirm(`¿Quitar a ${parada.cliente?.nombre || 'este cliente'} de la ruta?`)) return;
    try {
      await repartidorRutaService.eliminarParada(parada.id);
      await cargarParadas();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  const marcarVisitado = async (parada: RutaParada) => {
    try {
      await repartidorRutaService.actualizarParada(parada.id, { visitado: !parada.visitado });
      await cargarParadas();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar');
    }
  };

  const abrirEdicion = (parada: RutaParada) => {
    setEditando(parada);
    setComentarioEdit(parada.comentario || '');
    setHoraAlertaEdit(parada.hora_alerta || '');
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    setGuardando(true);
    try {
      await repartidorRutaService.actualizarParada(editando.id, {
        comentario: comentarioEdit.trim() || null,
        hora_alerta: horaAlertaEdit || null,
      });
      setEditando(null);
      await cargarParadas();
      setMensaje('Parada actualizada');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const paradasPendientes = paradas.filter((p) => !p.visitado);
  const paradasVisitadas = paradas.filter((p) => p.visitado);

  return (
    <div className="py-4 space-y-5 max-w-3xl mx-auto">
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-start gap-3">
          <MapPinIcon className="w-8 h-8 text-teal-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Ruta del día</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fijá clientes que te avisaron por WhatsApp y programá una alerta antes de pasar.
            </p>
          </div>
        </div>

        {pushEstado !== 'activo' && (
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => void activarAlertas()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              <BellAlertIcon className="w-5 h-5" />
              Activar alertas en este celular
            </button>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Sin este paso el servidor no puede enviar alertas a este dispositivo.
            </p>
          </div>
        )}
        {pushEstado === 'activo' && (
          <div className="mt-3 space-y-2 text-sm text-teal-800">
            <p className="flex items-center gap-2">
              <BellAlertIcon className="w-5 h-5 shrink-0" />
              Permiso de notificaciones: activo
            </p>
            <p>
              Servidor push: {pushServidor ? 'configurado' : 'falta VAPID en el servidor'}
            </p>
            <p>
              Este celular suscrito: {pushSuscrito ? 'sí' : 'no — tocá Activar alertas abajo'}
            </p>
            {!pushSuscrito && pushServidor && (
              <>
                <button
                  type="button"
                  disabled={registrandoPush}
                  onClick={() => void activarAlertas()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {registrandoPush ? 'Registrando celular...' : 'Registrar este celular para alertas'}
                </button>
                {registrandoPush && progresoPush && (
                  <p className="text-xs text-teal-900 bg-white border border-teal-200 rounded-lg px-3 py-2">
                    {progresoPush}
                  </p>
                )}
                {diagnosticoSw && !registrandoPush && (
                  <p className="text-xs text-gray-600">{diagnosticoSw}</p>
                )}
              </>
            )}
            {pushServidor && pushSuscrito && (
              <button
                type="button"
                disabled={probandoPush}
                onClick={() => void probarPush()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-teal-300 bg-white px-4 py-2.5 text-sm font-medium text-teal-800 hover:bg-teal-100 disabled:opacity-50"
              >
                {probandoPush ? 'Enviando prueba...' : 'Probar notificación ahora'}
              </button>
            )}
            {!pushServidor && (
              <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Sin VAPID en el servidor, las alertas solo funcionan con la app abierta.
              </p>
            )}
          </div>
        )}
      </div>

      {mensaje && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente por nombre, teléfono o dirección..."
          className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      {buscando && <p className="text-sm text-gray-500">Buscando...</p>}

      {resultados.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {resultados.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              onClick={() => abrirFormularioCliente(cliente)}
              className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <p className="font-medium text-gray-900">{cliente.nombre}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cliente.direccion || 'Sin dirección'}</p>
              <p className="text-xs text-gray-400">{cliente.telefono}</p>
            </button>
          ))}
        </div>
      )}

      {clienteSeleccionado && (
        <div className="rounded-xl border border-teal-300 bg-white p-4 shadow-md space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase text-teal-600">Agregar a la ruta</p>
              <h3 className="text-lg font-semibold text-gray-900">{clienteSeleccionado.nombre}</h3>
              <p className="text-sm text-gray-500">{clienteSeleccionado.direccion}</p>
            </div>
            <button type="button" onClick={cerrarFormulario} className="p-1 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label htmlFor="ruta-comentario" className="block text-sm font-medium text-gray-700 mb-1">
              Comentario
            </label>
            <textarea
              id="ruta-comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={2}
              placeholder="Ej: Pasar antes de las 11:30, tiene visita médica"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="ruta-hora-alerta" className="block text-sm font-medium text-gray-700 mb-1">
              Hora de alerta (opcional)
            </label>
            <input
              id="ruta-hora-alerta"
              type="time"
              value={horaAlerta}
              onChange={(e) => setHoraAlerta(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              La app te avisará a esa hora para ir al domicilio.
            </p>
          </div>

          <button
            type="button"
            disabled={guardando}
            onClick={() => void agregarParada()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <PlusIcon className="w-5 h-5" />
            {guardando ? 'Guardando...' : 'Fijar en la ruta'}
          </button>
        </div>
      )}

      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-teal-600" />
          Pendientes ({paradasPendientes.length})
        </h3>

        {cargando ? (
          <p className="text-sm text-gray-500">Cargando ruta...</p>
        ) : paradasPendientes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No hay clientes fijados para hoy. Buscá un cliente arriba para agregarlo.
          </div>
        ) : (
          <div className="space-y-3">
            {paradasPendientes.map((parada) => (
              <ParadaCard
                key={parada.id}
                parada={parada}
                onEditar={() => abrirEdicion(parada)}
                onEliminar={() => void eliminarParada(parada)}
                onVisitado={() => void marcarVisitado(parada)}
                onIrRapido={() => router.push(`/repartidor/rapido?cliente=${parada.cliente_id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {paradasVisitadas.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            Visitados ({paradasVisitadas.length})
          </h3>
          <div className="space-y-3 opacity-75">
            {paradasVisitadas.map((parada) => (
              <ParadaCard
                key={parada.id}
                parada={parada}
                onEditar={() => abrirEdicion(parada)}
                onEliminar={() => void eliminarParada(parada)}
                onVisitado={() => void marcarVisitado(parada)}
                onIrRapido={() => router.push(`/repartidor/rapido?cliente=${parada.cliente_id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {editando && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Editar — {editando.cliente?.nombre}
            </h3>
            <div>
              <label htmlFor="ruta-comentario-edit" className="block text-sm font-medium text-gray-700 mb-1">
                Comentario
              </label>
              <textarea
                id="ruta-comentario-edit"
                value={comentarioEdit}
                onChange={(e) => setComentarioEdit(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ruta-hora-alerta-edit" className="block text-sm font-medium text-gray-700 mb-1">
                Hora de alerta
              </label>
              <input
                id="ruta-hora-alerta-edit"
                type="time"
                value={horaAlertaEdit}
                onChange={(e) => setHoraAlertaEdit(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => void guardarEdicion()}
                className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ParadaCardProps = {
  parada: RutaParada;
  onEditar: () => void;
  onEliminar: () => void;
  onVisitado: () => void;
  onIrRapido: () => void;
};

function ParadaCard({ parada, onEditar, onEliminar, onVisitado, onIrRapido }: ParadaCardProps) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        parada.visitado ? 'border-gray-200' : 'border-teal-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{parada.cliente?.nombre || 'Cliente'}</p>
          <p className="text-sm text-gray-600 mt-0.5">{formatearDireccion(parada.cliente)}</p>
          {parada.comentario && (
            <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded-lg px-3 py-2">
              {parada.comentario}
            </p>
          )}
          {parada.hora_alerta && (
            <p className="text-xs text-teal-700 mt-2 flex items-center gap-1">
              <BellAlertIcon className="w-4 h-4" />
              Alerta a las {parada.hora_alerta}
              {parada.alerta_enviada && ' · enviada'}
              {!parada.alerta_enviada && parada.hora_alerta && horaActualHHMM() >= parada.hora_alerta && ' · pendiente de envío'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onIrRapido}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          <BoltIcon className="w-4 h-4" />
          Ir a Rápido
        </button>
        <button
          type="button"
          onClick={onVisitado}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
        >
          <CheckCircleIcon className="w-4 h-4" />
          {parada.visitado ? 'Pendiente' : 'Visitado'}
        </button>
        <button
          type="button"
          onClick={onEditar}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
        >
          <PencilSquareIcon className="w-4 h-4" />
          Editar
        </button>
        <button
          type="button"
          onClick={onEliminar}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
        >
          <TrashIcon className="w-4 h-4" />
          Quitar
        </button>
      </div>
    </div>
  );
}
