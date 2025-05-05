'use client'

import { Alert, Card, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MetricasPage() {
  const router = useRouter();
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (count === 0) {
      router.push('/home');
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, router]);

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-gray-50">
      <Card className="flex flex-col gap-6 items-center p-6 w-full max-w-md shadow-lg">
        <Alert 
          color="primary" 
          className="text-base font-semibold text-center rounded-md"
          title="Módulo de métricas en desarrollo"
        />
        <div className="flex flex-col gap-2 items-center mt-4">
          <span className="text-sm text-gray-700">
            Te llevaremos de vuelta al inicio en <span className="font-bold text-primary-600">{count}...</span>
          </span>
          <Spinner size="lg" color="primary" />
        </div>
      </Card>
    </div>
  );
}
