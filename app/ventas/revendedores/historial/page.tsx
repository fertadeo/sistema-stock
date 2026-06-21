'use client';
import HistorialRevendedores from '@/components/ventas/revendedores/historialRevendedores';

export default function HistorialPage() {
  return (
    <div className="flex flex-col w-full min-h-0 bg-gray-100">
      <div className="flex flex-col flex-1 bg-fuchsia-400">
        <HistorialRevendedores />
      </div>
    </div>
  );
} 