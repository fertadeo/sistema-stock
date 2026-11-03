'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { authFetch, createApiUrl } from '@/lib/api/fetchWithAuth';
import { clientesDentroDeZona, ZonaGeometria } from '@/lib/map/zonaRadio';
import { descargarHojaRutaExcel } from '@/lib/export/excelHojaRuta';

type ClienteZona = {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  repartidor: string | null;
  latitud: number;
  longitud: number;
  piso?: string | null;
  departamento?: string | null;
};

type RepartidorOption = {
  id: number;
  nombre: string;
  color_pin?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  zona: ZonaGeometria & { id: number; nombre: string };
  clientes: ClienteZona[];
  repartidores: RepartidorOption[];
  onDelegado: () => void;
};

const SIN_REPARTIDOR = 'Sin repartidor';

function nombreGrupo(repartidor: string | null | undefined): string {
  const nom = (repartidor || '').trim();
  return nom || SIN_REPARTIDOR;
}

export default function DelegarZonaModal({
  open,
  onClose,
  zona,
  clientes,
  repartidores,
  onDelegado,
}: Props) {
  const [tabActiva, setTabActiva] = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [destino, setDestino] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const clientesEnZona = useMemo(
    () => clientesDentroDeZona(clientes, zona),
    [clientes, zona]
  );

  const tabs = useMemo(() => {
    const contadores = new Map<string, number>();
    for (const c of clientesEnZona) {
      const g = nombreGrupo(c.repartidor);
      contadores.set(g, (contadores.get(g) || 0) + 1);
    }
    return Array.from(contadores.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => {
        if (a.nombre === SIN_REPARTIDOR) return 1;
        if (b.nombre === SIN_REPARTIDOR) return -1;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [clientesEnZona]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setExito('');
    setDestino('');
    setSeleccionados(new Set(clientesEnZona.map((c) => c.id)));
    const primera = tabs[0]?.nombre || '';
    setTabActiva((prev) =>
      prev && tabs.some((t) => t.nombre === prev) ? prev : primera
    );
    // Solo al abrir o cambiar zona/área de clientes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zona.id, clientesEnZona.length]);

  const clientesTab = useMemo(
    () => clientesEnZona.filter((c) => nombreGrupo(c.repartidor) === tabActiva),
    [clientesEnZona, tabActiva]
  );

  const seleccionadosLista = useMemo(
    () => clientesEnZona.filter((c) => seleccionados.has(c.id)),
    [clientesEnZona, seleccionados]
  );

  const seleccionadosEnTab = useMemo(
    () => clientesTab.filter((c) => seleccionados.has(c.id)).length,
    [clientesTab, seleccionados]
  );

  if (!open) return null;

  const toggleCliente = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const seleccionarTodosTab = () => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      for (const c of clientesTab) next.add(c.id);
      return next;
    });
  };

  const deseleccionarTodosTab = () => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      for (const c of clientesTab) next.delete(c.id);
      return next;
    });
  };

  const descargarExcel = () => {
    if (seleccionadosLista.length === 0) {
      setError('Seleccioná al menos un cliente para exportar');
      return;
    }
    try {
      const ahora = new Date();
      descargarHojaRutaExcel(seleccionadosLista, {
        anio: ahora.getFullYear(),
        mes: ahora.getMonth() + 1,
        repartidor: destino || 'seleccion',
        diaReparto: 'delegacion',
        nombreArchivo: `hoja_ruta_${(destino || 'seleccion').replace(/\s+/g, '_')}_zona_${zona.id}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el Excel');
    }
  };

  const confirmar = async () => {
    setError('');
    setExito('');
    if (!destino) {
      setError('Elegí el repartidor destino');
      return;
    }
    if (seleccionadosLista.length === 0) {
      setError('Seleccioná al menos un cliente');
      return;
    }

    const yaDelDestino = seleccionadosLista.filter(
      (c) => nombreGrupo(c.repartidor).toLowerCase() === destino.trim().toLowerCase()
    ).length;
    const aMigrar = seleccionadosLista.length - yaDelDestino;
    if (aMigrar <= 0) {
      setError('Los clientes seleccionados ya son del repartidor destino');
      return;
    }

    const ok = window.confirm(
      `¿Migrar ${aMigrar} cliente(s) a ${destino}?\n` +
        `Los fiados históricos siguen siendo del repartidor que los originó.`
    );
    if (!ok) return;

    setEnviando(true);
    try {
      const response = await authFetch(createApiUrl('/api/clientes/delegar-zona'), {
        method: 'POST',
        body: JSON.stringify({
          zona_id: zona.id,
          repartidor_destino: destino,
          cliente_ids: seleccionadosLista.map((c) => c.id),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'No se pudo migrar los clientes');
      }
      setExito(`Listo: ${json.data.cantidad} clientes pasaron a ${destino}.`);
      onDelegado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al migrar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Delegar zona</h2>
          <p className="text-sm text-gray-500">
            {zona.nombre} · {clientesEnZona.length} clientes en el área ·{' '}
            {seleccionadosLista.length} seleccionados
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto px-4 py-4">
          {clientesEnZona.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              No hay clientes con coordenadas dentro de esta zona.
            </p>
          ) : (
            <>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                  const activa = tab.nombre === tabActiva;
                  return (
                    <button
                      key={tab.nombre}
                      type="button"
                      onClick={() => setTabActiva(tab.nombre)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        activa
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab.nombre} ({tab.cantidad})
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-700">
                  {tabActiva}: {seleccionadosEnTab}/{clientesTab.length}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={seleccionarTodosTab}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={deseleccionarTodosTab}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <ul className="max-h-56 space-y-0 overflow-y-auto rounded-lg border border-gray-200 sm:max-h-64">
                {clientesTab.map((c) => {
                  const checked = seleccionados.has(c.id);
                  return (
                    <li key={c.id} className="border-b border-gray-100 last:border-0">
                      <div className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50">
                        <input
                          id={`delegar-cliente-${c.id}`}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCliente(c.id)}
                          className="mt-1"
                          aria-label={c.nombre || `Cliente ${c.id}`}
                        />
                        <label
                          htmlFor={`delegar-cliente-${c.id}`}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <span className="block font-medium text-gray-900">
                            {c.nombre || `Cliente ${c.id}`}
                          </span>
                          {c.direccion ? (
                            <span className="block text-xs text-gray-500">{c.direccion}</span>
                          ) : null}
                          {c.telefono ? (
                            <span className="block text-xs text-gray-400">{c.telefono}</span>
                          ) : null}
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div>
                <label
                  htmlFor="delegar-destino"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Migrar seleccionados a
                </label>
                <select
                  id="delegar-destino"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar repartidor…</option>
                  {repartidores
                    .filter((r) => r.nombre.trim())
                    .map((r) => (
                      <option key={r.id} value={r.nombre}>
                        {r.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                onClick={descargarExcel}
                disabled={seleccionadosLista.length === 0}
                className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Descargar Excel ({seleccionadosLista.length})
              </button>
            </>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {exito && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {exito}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={
              enviando ||
              seleccionadosLista.length === 0 ||
              !destino ||
              clientesEnZona.length === 0
            }
            onClick={() => void confirmar()}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {enviando
              ? 'Migrando…'
              : `Migrar ${seleccionadosLista.length || ''}`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
}
