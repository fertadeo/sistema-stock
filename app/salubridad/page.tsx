'use client';

export default function SalubridadPage() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Salubridad del sistema</h1>
        <p className="mt-2 text-sm text-gray-600">
          Módulo reservado para superadmin. Aquí se centralizará la auditoría de movimientos,
          errores, inconsistencias y trazabilidad operativa del sistema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
          <h2 className="font-semibold text-amber-900">Próximamente</h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-800">
            <li>Auditoría de movimientos de cuenta corriente</li>
            <li>Registro de errores de sincronización offline</li>
            <li>Alertas de inconsistencias en envases y cobros</li>
            <li>Historial de acciones por usuario</li>
          </ul>
        </div>

        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="font-semibold text-gray-900">Estado actual</h2>
          <p className="mt-3 text-sm text-gray-600">
            El acceso por rol ya está activo. Este módulo queda habilitado como punto de entrada
            para la futura consola de salubridad.
          </p>
        </div>
      </div>
    </div>
  );
}
