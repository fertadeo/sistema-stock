'use client';

import dynamic from 'next/dynamic';

const CuentaCorrienteRepartidores = dynamic(() => import('@/components/CuentaCorrienteRepartidores'), { ssr: false });

export default function CuentaCorrienteRepartidoresPage() {
  return (
    <div className="w-full min-h-0">
      <CuentaCorrienteRepartidores />
    </div>
  );
}
