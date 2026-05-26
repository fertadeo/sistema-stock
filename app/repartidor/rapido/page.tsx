import { Suspense } from 'react';
import RepartidorRapido from '@/components/RepartidorRapido';

export default function RepartidorRapidoPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Cargando repartidor rápido...</div>}>
      <RepartidorRapido />
    </Suspense>
  );
}
