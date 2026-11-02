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

export default function DelegarZonaModal({
  open,
  onClose,
  zona,
  clientes,
  repartidores,
  onDelegado,
}: Props) {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    if (!open) return;
    setOrigen('');
    setDestino('');
    setError('');
    setExito('');
  }, [open, zona.id]);

  const clientesEnZona = useMemo(
    () => clientesDentroDeZona(clientes, zona),
    [clientes, zona]
  );

  const origenesDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const c of clientesEnZona) {
      const nom = (c.repartidor || '').trim();
      if (nom) set.add(nom);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clientesEnZona]);

  const preview = useMemo(() => {
    if (!origen) return [];
    return clientesEnZona.filter(
      (c) => (c.repartidor || '').trim().toLowerCase() === origen.trim().toLowerCase()
    );
  }, [clientesEnZona, origen]);

  if (!open) return null;

  const descargarExcel = () => {
    if (preview.length === 0) {
      setError('No hay clientes para exportar');
      return;
    }
    try {
      const ahora = new Date();
      descargarHojaRutaExcel(preview, {
        anio: ahora.getFullYear(),
        mes: ahora.getMonth() + 1,
        repartidor: destino || origen,
        diaReparto: 'delegacion',
        nombreArchivo: `hoja_ruta_${(destino || origen).replace(/\s+/g, '_')}_zona_${zona.id}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el Excel');
    }
  };

  const confirmar = async () => {
    setError('');
    setExito('');
    if (!origen || !destino) {
      setError('Elegí repartidor origen y destino');
      return;
    }
    if (origen.trim().toLowerCase() === destino.trim().toLowerCase()) {
      setError('Origen y destino deben ser distintos');
      return;
    }
    if (preview.length === 0) {
      setError('No hay clientes del origen en esta zona');
      return;
    }

    const ok = window.confirm(
      `¿Ceder ${preview.length} cliente(s) de ${origen} a ${destino}?\n` +
        `Los fiados históricos de ${origen} siguen siendo de su propiedad.`
    );
    if (!ok) return;

    setEnviando(true);
    try {
      const response = await authFetch(createApiUrl('/api/clientes/delegar-zona'), {
        method: 'POST',
        body: JSON.stringify({
          zona_id: zona.id,
          repartidor_origen: origen,
          repartidor_destino: destino,
          cliente_ids: preview.map((c) => c.id),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'No se pudo delegar la zona');
      }
      setExito(`Listo: ${json.data.cantidad} clientes pasaron a ${destino}.`);
      onDelegado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al delegar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Delegar zona</h2>
          <p className="text-sm text-gray-500">
            {zona.nombre} · solo clientes del repartidor origen
          </p>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <div>
            <label htmlFor="delegar-origen" className="mb-1 block text-sm font-medium text-gray-700">
              Repartidor origen (cede clientes)
            </label>
            <select
              id="delegar-origen"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Seleccionar…</option>
              {origenesDisponibles.map((nom) => (
                <option key={nom} value={nom}>
                  {nom} (
                  {
                    clientesEnZona.filter(
                      (c) => (c.repartidor || '').trim().toLowerCase() === nom.toLowerCase()
                    ).length
                  }
                  )
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="delegar-destino" className="mb-1 block text-sm font-medium text-gray-700">
              Repartidor destino (recibe)
            </label>
            <select
              id="delegar-destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Seleccionar…</option>
              {repartidores
                .filter((r) => r.nombre.trim())
                .map((r) => (
                  <option key={r.id} value={r.nombre}>
                    {r.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                Clientes a ceder ({preview.length})
              </h3>
              <button
                type="button"
                onClick={descargarExcel}
                disabled={preview.length === 0}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Descargar Excel
              </button>
            </div>
            {preview.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                Elegí un origen para ver el listado.
              </p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200">
                {preview.map((c) => (
                  <li
                    key={c.id}
                    className="border-b border-gray-100 px-3 py-2 text-sm last:border-0"
                  >
                    <p className="font-medium text-gray-900">{c.nombre}</p>
                    <p className="text-xs text-gray-500">{c.direccion}</p>
                    <p className="text-xs text-gray-400">{c.telefono}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
            disabled={enviando || preview.length === 0 || !destino}
            onClick={() => void confirmar()}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {enviando ? 'Cediendo…' : 'Confirmar cesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
