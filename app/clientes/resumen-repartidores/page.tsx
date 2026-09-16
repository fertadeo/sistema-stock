'use client';

import dynamic from 'next/dynamic';

const ResumenRepartidores = dynamic(() => import('@/components/ResumenRepartidores'), { ssr: false });

export default function ResumenRepartidoresPage() {
  return (
    <div className="w-full min-h-0">
      <ResumenRepartidores />
    </div>
  );
}
