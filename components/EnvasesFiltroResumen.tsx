'use client';

import React from 'react';
import {
  ResumenEnvasesFiltro,
  etiquetaFiltroEnvases,
} from '@/lib/map/envasesResumen';

type Props = {
  resumen: ResumenEnvasesFiltro;
  totalClientesFiltrados: number;
  filtroDia: string;
  filtroRepartidor: string;
  filtroZona: string;
};

export default function EnvasesFiltroResumen({
  resumen,
  totalClientesFiltrados,
  filtroDia,
  filtroRepartidor,
  filtroZona,
}: Props) {
  const contexto = etiquetaFiltroEnvases({
    dia: filtroDia,
    repartidor: filtroRepartidor,
    zona: filtroZona,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm">
      <div className="border-b border-sky-100 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-sky-950">Envases prestados</h3>
            <p className="mt-0.5 truncate text-[11px] text-sky-800/80">{contexto}</p>
          </div>
          <div className="shrink-0 rounded-lg bg-sky-700 px-2.5 py-1 text-center text-white shadow-sm">
            <p className="text-lg font-bold leading-none">{resumen.totalUnidades}</p>
            <p className="text-[9px] leading-tight opacity-90">unidades</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-lg bg-blue-50 px-2 py-2 text-center ring-1 ring-blue-100">
            <p className="text-base font-bold text-blue-800">{resumen.agua}</p>
            <p className="text-[10px] font-semibold text-blue-700">Agua</p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-2 py-2 text-center ring-1 ring-emerald-100">
            <p className="text-base font-bold text-emerald-800">{resumen.soda}</p>
            <p className="text-[10px] font-semibold text-emerald-700">Soda</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-2 py-2 text-center ring-1 ring-gray-200">
            <p className="text-base font-bold text-gray-800">{resumen.otros}</p>
            <p className="text-[10px] font-semibold text-gray-600">Otros</p>
          </div>
        </div>

        <p className="text-[11px] text-gray-600">
          {resumen.clientesConEnvases} de {totalClientesFiltrados} cliente
          {totalClientesFiltrados === 1 ? '' : 's'} filtrado
          {totalClientesFiltrados === 1 ? '' : 's'} con envases prestados
        </p>

        {resumen.porProducto.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-center text-xs text-gray-500">
            No hay envases prestados con el filtro actual.
          </p>
        ) : (
          <ul className="max-h-36 space-y-1 overflow-y-auto">
            {resumen.porProducto.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-sm ring-1 ring-gray-100"
              >
                <span className="min-w-0 truncate font-medium text-gray-800">
                  {item.producto_nombre}
                </span>
                <span className="shrink-0 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-900">
                  {item.cantidad}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
