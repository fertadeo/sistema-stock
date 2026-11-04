'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { authFetch, createApiUrl } from '@/lib/api/fetchWithAuth';
import { clientesDentroDeZona, ZonaGeometria } from '@/lib/map/zonaRadio';
import { descargarHojaRutaExcel } from '@/lib/export/excelHojaRuta';
import { optimizarRutaVecinoMasCercano } from '@/lib/map/optimizarRuta';

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
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  /** Orden de parada (#) por cliente_id tras armar la hoja de ruta. */
  const [ordenRutaIds, setOrdenRutaIds] = useState<number[] | null>(null);

  const geometriaKey = useMemo(() => {
    const poly = zona.poligono || [];
    return [
      zona.id,
      zona.tipo || '',
      Number(zona.latitud),
      Number(zona.longitud),
      Number(zona.radio_metros) || 0,
      poly.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(';'),
    ].join('|');
  }, [zona]);

  const clientesEnZona = useMemo(
    () => clientesDentroDeZona(clientes, zona),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientes, geometriaKey]
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

  const idsEnZonaKey = useMemo(
    () =>
      clientesEnZona
        .map((c) => c.id)
        .sort((a, b) => a - b)
        .join(','),
    [clientesEnZona]
  );

  useEffect(() => {
    if (!open) return;
    setError('');
    setExito('');
    setDestino('');
    setOrdenRutaIds(null);
    setSeleccionados(new Set(clientesEnZona.map((c) => c.id)));
    const primera = tabs[0]?.nombre || '';
    setTabActiva((prev) =>
      prev && tabs.some((t) => t.nombre === prev) ? prev : primera
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zona.id, geometriaKey, idsEnZonaKey]);

  const ordenIndex = useMemo(() => {
    const map = new Map<number, number>();
    if (!ordenRutaIds) return map;
    ordenRutaIds.forEach((id, idx) => map.set(id, idx + 1));
    return map;
  }, [ordenRutaIds]);

  const clientesTab = useMemo(() => {
    const base = clientesEnZona.filter(
      (c) => nombreGrupo(c.repartidor) === tabActiva
    );
    if (!ordenRutaIds) return base;
    return [...base].sort((a, b) => {
      const ia = ordenIndex.get(a.id);
      const ib = ordenIndex.get(b.id);
      if (ia != null && ib != null) return ia - ib;
      if (ia != null) return -1;
      if (ib != null) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [clientesEnZona, tabActiva, ordenRutaIds, ordenIndex]);

  const seleccionadosLista = useMemo(() => {
    const base = clientesEnZona.filter((c) => seleccionados.has(c.id));
    if (!ordenRutaIds) return base;
    const porId = new Map(base.map((c) => [c.id, c]));
    const ordenados: ClienteZona[] = [];
    for (const id of ordenRutaIds) {
      const c = porId.get(id);
      if (c) ordenados.push(c);
    }
    // Seleccionados nuevos que no estaban en la ruta armada
    for (const c of base) {
      if (!ordenIndex.has(c.id)) ordenados.push(c);
    }
    return ordenados;
  }, [clientesEnZona, seleccionados, ordenRutaIds, ordenIndex]);

  const seleccionadosEnTab = useMemo(
    () => clientesTab.filter((c) => seleccionados.has(c.id)).length,
    [clientesTab, seleccionados]
  );

  if (!open) return null;

  const invalidarOrdenRuta = () => setOrdenRutaIds(null);

  const toggleCliente = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    invalidarOrdenRuta();
  };

  const seleccionarTodosTab = () => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      for (const c of clientesTab) next.add(c.id);
      return next;
    });
    invalidarOrdenRuta();
  };

  const deseleccionarTodosTab = () => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      for (const c of clientesTab) next.delete(c.id);
      return next;
    });
    invalidarOrdenRuta();
  };

  const armarHojaRuta = (): ClienteZona[] => {
    const seleccion = clientesEnZona.filter((c) => seleccionados.has(c.id));
    if (seleccion.length === 0) {
      setError('Seleccioná al menos un cliente para armar la hoja de ruta');
      return [];
    }
    const ruta = optimizarRutaVecinoMasCercano(seleccion);
    setOrdenRutaIds(ruta.map((c) => c.id));
    setError('');
    setExito(`Hoja de ruta armada: ${ruta.length} paradas (vecino más cercano).`);
    return ruta;
  };

  const descargarExcel = async () => {
    if (seleccionadosLista.length === 0) {
      setError('Seleccioná al menos un cliente para exportar');
      return;
    }
    setError('');
    setDescargandoExcel(true);
    try {
      const ruta =
        ordenRutaIds &&
        ordenRutaIds.length === seleccionadosLista.length &&
        seleccionadosLista.every((c) => ordenIndex.has(c.id))
          ? seleccionadosLista
          : armarHojaRuta();

      if (ruta.length === 0) return;

      const response = await authFetch(createApiUrl('/api/clientes/deudas-delegacion'), {
        method: 'POST',
        body: JSON.stringify({
          cliente_ids: ruta.map((c) => c.id),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.success === false) {
        throw new Error(json.message || 'No se pudieron obtener las deudas');
      }

      const deudas = Array.isArray(json.data) ? json.data : [];
      const deudaPorId = new Map<
        number,
        { repartidor_anterior: string | null; deuda_anterior: number }
      >();
      for (const row of deudas) {
        const id = Number(row.cliente_id);
        if (!id) continue;
        deudaPorId.set(id, {
          repartidor_anterior:
            typeof row.repartidor_anterior === 'string' ? row.repartidor_anterior : null,
          deuda_anterior: Number(row.deuda_anterior) || 0,
        });
      }

      const clientesExcel = ruta.map((c) => {
        const deuda = deudaPorId.get(c.id);
        return {
          ...c,
          repartidor_anterior: deuda?.repartidor_anterior ?? c.repartidor,
          deuda_anterior: deuda?.deuda_anterior ?? 0,
        };
      });

      const ahora = new Date();
      descargarHojaRutaExcel(clientesExcel, {
        anio: ahora.getFullYear(),
        mes: ahora.getMonth() + 1,
        repartidor: destino || 'seleccion',
        diaReparto: 'delegacion',
        nombreArchivo: `hoja_ruta_${(destino || 'seleccion').replace(/\s+/g, '_')}_zona_${zona.id}`,
        incluirDeudaDelegacion: true,
      });
      setExito(`Excel listo: ${ruta.length} clientes en orden de hoja de ruta.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el Excel');
    } finally {
      setDescargandoExcel(false);
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
            {ordenRutaIds ? ` · ruta ${ordenRutaIds.length} paradas` : ''}
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
                  {ordenRutaIds ? ' · orden de ruta' : ''}
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
                  const parada = ordenIndex.get(c.id);
                  return (
                    <li key={c.id} className="border-b border-gray-100 last:border-0">
                      <div className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50">
                        {parada != null ? (
                          <span
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700"
                            title={`Parada ${parada}`}
                          >
                            {parada}
                          </span>
                        ) : null}
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

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    armarHojaRuta();
                  }}
                  disabled={seleccionadosLista.length === 0}
                  className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  Armar hoja de ruta ({seleccionadosLista.length})
                </button>
                <button
                  type="button"
                  onClick={() => void descargarExcel()}
                  disabled={seleccionadosLista.length === 0 || descargandoExcel}
                  className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {descargandoExcel
                    ? 'Preparando Excel…'
                    : `Descargar Excel (${seleccionadosLista.length})`}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                La hoja de ruta ordena por vecino más cercano (desde la empresa). El Excel
                usa ese orden e incluye la deuda con el repartidor anterior.
              </p>
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
