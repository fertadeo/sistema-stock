'use client';
import HistorialRevendedores from '@/components/ventas/revendedores/historialRevendedores';

export default function HistorialPage() {
  return (
    <div className="flex flex-col w-full h-screen min-h-screen bg-gray-100 border-red-500">
      <div className="flex flex-col flex-1 bg-fuchsia-400">
        <HistorialRevendedores />
      </div>
    </div>
  );
} 