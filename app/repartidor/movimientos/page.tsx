'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MovimientosRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cliente = searchParams?.get('cliente');

  useEffect(() => {
    if (cliente) {
      router.replace(`/repartidor/rapido?cliente=${cliente}&movimientos=1`);
    } else {
      router.replace('/repartidor/clientes');
    }
  }, [router, cliente]);

  return (
    <div className="p-6 text-sm text-gray-500">
      Redirigiendo a la ficha del cliente...
    </div>
  );
}

export default function MovimientosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Redirigiendo...</div>}>
      <MovimientosRedirectContent />
    </Suspense>
  );
}
