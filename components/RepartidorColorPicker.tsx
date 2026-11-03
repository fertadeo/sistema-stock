'use client';

import React from 'react';
import { REPARTIDOR_PIN_COLORS } from '@/lib/map/markerPinIcon';

type Props = {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
};

function esHexValido(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color.trim());
}

export default function RepartidorColorPicker({
  value,
  onChange,
  disabled = false,
  label = 'Color del pin',
  id = 'repartidor-color-pin',
}: Props) {
  const actual = esHexValido(value) ? value.trim() : REPARTIDOR_PIN_COLORS[0];

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {REPARTIDOR_PIN_COLORS.map((color) => {
          const seleccionado = actual.toUpperCase() === color.toUpperCase();
          return (
            <button
              key={color}
              type="button"
              disabled={disabled}
              title={color}
              aria-label={`Color ${color}`}
              aria-pressed={seleccionado}
              onClick={() => onChange(color)}
              className={`h-7 w-7 rounded-full border-2 transition disabled:opacity-50 ${
                seleccionado
                  ? 'border-gray-900 scale-110'
                  : 'border-white ring-1 ring-gray-300 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          );
        })}
        <label
          htmlFor={id}
          className="relative ml-1 flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-white shadow-sm"
          title="Color personalizado"
        >
          <span
            className="absolute inset-0"
            style={{
              background:
                'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
            }}
            aria-hidden
          />
          <input
            id={id}
            type="color"
            value={actual}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <span className="text-xs font-mono text-gray-500">{actual.toUpperCase()}</span>
      </div>
    </div>
  );
}
