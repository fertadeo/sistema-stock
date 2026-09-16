'use client';

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/lib/api/fetchWithAuth';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Select, 
  SelectItem, 
  Button, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Input,
  Textarea,
  useDisclosure
} from '@heroui/react';
import Alert from '@/components/shared/alert';

type Repartidor = {
  id: number;
  nombre: string;
};

type MovimientoCuentaCorriente = {
  id: string;
  fecha: string;
  tipo: 'DEBITO' | 'CREDITO';
  descripcion: string;
  monto: number;
  saldo_acumulado: number;
  medio_pago?: string;
  observaciones?: string;
};

type ResumenCuentaCorriente = {
  repartidor_id: number;
  repartidor_nombre: string;
  saldo_actual: number;
  total_debitos: number;
  total_creditos: number;
  cantidad_movimientos: number;
  ultimo_movimiento_at: string | null;
};

export default function CuentaCorrienteRepartidores() {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<string>('');
  const [resumen, setResumen] = useState<ResumenCuentaCorriente | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCuentaCorriente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('success');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [registrandoPago, setRegistrandoPago] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [medioPago, setMedioPago] = useState<'efectivo' | 'transferencia' | 'debito' | 'credito'>('efectivo');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    cargarRepartidores();
  }, []);

  const cargarRepartidores = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repartidores`);
      if (!response.ok) throw new Error('Error al cargar repartidores');
      const data = await response.json();
      setRepartidores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar repartidores:', error);
      mostrarAlerta('Error al cargar la lista de repartidores', 'error');
    }
  };

  const cargarCuentaCorriente = async (repartidorId: string) => {
    if (!repartidorId) {
      setResumen(null);
      setMovimientos([]);
      return;
    }

    setCargando(true);
    try {
      // NOTA: Este endpoint debe implementarse en el backend
      // GET /api/repartidores/{id}/cuenta-corriente
      // Debe devolver: { resumen: ResumenCuentaCorriente, movimientos: MovimientoCuentaCorriente[] }
      
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/repartidores/${repartidorId}/cuenta-corriente`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          // Si el endpoint no existe, mostrar datos mock para desarrollo
          throw new Error('Endpoint no implementado aún. Documentación en el PR.');
        }
        throw new Error('Error al cargar cuenta corriente');
      }

      const data = await response.json();
      setResumen(data.resumen || data.data?.resumen);
      setMovimientos(data.movimientos || data.data?.movimientos || []);
    } catch (error: any) {
      console.error('Error al cargar cuenta corriente:', error);
      mostrarAlerta(error.message || 'Error al cargar cuenta corriente del repartidor', 'error');
      
      // Datos de ejemplo para desarrollo (se eliminan cuando el backend esté implementado)
      setResumen(null);
      setMovimientos([]);
    } finally {
      setCargando(false);
    }
  };

  const handleRepartidorChange = (value: string) => {
    setRepartidorSeleccionado(value);
    cargarCuentaCorriente(value);
  };

  const abrirModalPago = () => {
    setMontoPago('');
    setMedioPago('efectivo');
    setObservaciones('');
    onOpen();
  };

  const registrarPago = async () => {
    if (!repartidorSeleccionado || !montoPago || parseFloat(montoPago) <= 0) {
      mostrarAlerta('Ingresá un monto válido para el pago', 'error');
      return;
    }

    setRegistrandoPago(true);
    try {
      // NOTA: Este endpoint debe implementarse en el backend
      // POST /api/repartidores/{id}/cuenta-corriente/pagos
      // Body: { monto: number, medio_pago: string, observaciones?: string }
      // Response: { success: boolean, saldo_actual: number, pago: {...} }
      
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/repartidores/${repartidorSeleccionado}/cuenta-corriente/pagos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monto: parseFloat(montoPago),
            medio_pago: medioPago,
            observaciones: observaciones.trim() || undefined
          })
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint no implementado aún. Documentación en el PR.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el pago');
      }

      mostrarAlerta('Pago registrado exitosamente', 'success');
      onClose();
      
      // Recargar cuenta corriente
      await cargarCuentaCorriente(repartidorSeleccionado);
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      mostrarAlerta(error.message || 'Error al registrar el pago', 'error');
    } finally {
      setRegistrandoPago(false);
    }
  };

  const mostrarAlerta = (mensaje: string, tipo: 'error' | 'success') => {
    setAlertMessage(mensaje);
    setAlertType(tipo);
    setAlertVisible(true);
  };

  useEffect(() => {
    if (alertVisible) {
      const timer = setTimeout(() => {
        setAlertVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertVisible]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {alertVisible && (
        <div className="fixed right-4 md:right-8 bottom-4 md:bottom-8 z-50">
          <Alert
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Cuenta Corriente Repartidores</h1>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>⚠️ Funcionalidad pendiente de backend:</strong> Los endpoints necesarios
            están documentados en el PR. Esta UI está lista para conectar cuando el backend
            implemente los endpoints de cuenta corriente de repartidores.
          </p>
        </div>
        <p className="text-gray-600">
          Registrá pagos parciales de los repartidores a la empresa y visualizá el estado
          de sus cuentas (saldo, historial de movimientos).
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Seleccionar Repartidor</h2>
        </CardHeader>
        <CardBody>
          <Select
            label="Repartidor"
            placeholder="Seleccioná un repartidor"
            selectedKeys={repartidorSeleccionado ? [repartidorSeleccionado] : []}
            onChange={(e) => handleRepartidorChange(e.target.value)}
            className="max-w-md"
          >
            {repartidores.map((rep) => (
              <SelectItem key={rep.id.toString()} value={rep.id.toString()}>
                {rep.nombre}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {cargando && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!cargando && resumen && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={resumen.saldo_actual > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
              <CardBody>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-600">Saldo Actual</p>
                  <p className={`text-3xl font-bold ${resumen.saldo_actual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${resumen.saldo_actual.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumen.saldo_actual > 0 
                      ? 'El repartidor debe a la empresa' 
                      : 'La cuenta está al día'}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardBody>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-600">Total Fiado</p>
                  <p className="text-3xl font-bold text-orange-600">
                    ${resumen.total_debitos.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Monto total que el repartidor fió
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardBody>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-600">Total Pagado</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ${resumen.total_creditos.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Monto total abonado a la empresa
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Registrar Pago</h2>
                <p className="text-sm text-gray-600">
                  El repartidor abona parcialmente su deuda
                </p>
              </div>
              <Button
                color="primary"
                onPress={abrirModalPago}
                isDisabled={resumen.saldo_actual <= 0}
              >
                Registrar Pago
              </Button>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <h2 className="text-lg font-semibold">Historial de Movimientos</h2>
                <p className="text-sm text-gray-600">
                  {resumen.cantidad_movimientos} movimiento(s) registrado(s)
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {movimientos.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  No hay movimientos registrados para este repartidor
                </p>
              ) : (
                <div className="space-y-3">
                  {movimientos.map((mov) => (
                    <div
                      key={mov.id}
                      className={`p-4 rounded-lg border ${
                        mov.tipo === 'DEBITO' 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              mov.tipo === 'DEBITO' 
                                ? 'bg-red-200 text-red-800' 
                                : 'bg-green-200 text-green-800'
                            }`}>
                              {mov.tipo === 'DEBITO' ? 'Débito' : 'Pago'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatearFecha(mov.fecha)}
                            </span>
                          </div>
                          <p className="mt-2 font-medium text-gray-900">
                            {mov.descripcion}
                          </p>
                          {mov.medio_pago && (
                            <p className="text-sm text-gray-600 mt-1">
                              Medio: {mov.medio_pago}
                            </p>
                          )}
                          {mov.observaciones && (
                            <p className="text-sm text-gray-600 mt-1">
                              {mov.observaciones}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            mov.tipo === 'DEBITO' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {mov.tipo === 'DEBITO' ? '+' : '-'}${mov.monto.toLocaleString('es-AR')}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Saldo: ${mov.saldo_acumulado.toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {!cargando && !resumen && repartidorSeleccionado && (
        <Card>
          <CardBody>
            <p className="text-center text-gray-600 py-4">
              No se encontró información de cuenta corriente para este repartidor.
            </p>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader>
                <div>
                  <h3 className="text-lg font-bold">Registrar Pago del Repartidor</h3>
                  <p className="text-sm font-normal text-gray-600">
                    Saldo actual: ${resumen?.saldo_actual.toLocaleString('es-AR') || '0'}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Input
                    type="number"
                    label="Monto del pago"
                    placeholder="0.00"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">$</span>
                      </div>
                    }
                    min="0"
                    step="0.01"
                  />

                  <Select
                    label="Medio de pago"
                    selectedKeys={[medioPago]}
                    onChange={(e) => setMedioPago(e.target.value as any)}
                  >
                    <SelectItem key="efectivo" value="efectivo">Efectivo</SelectItem>
                    <SelectItem key="transferencia" value="transferencia">Transferencia</SelectItem>
                    <SelectItem key="debito" value="debito">Débito</SelectItem>
                    <SelectItem key="credito" value="credito">Crédito</SelectItem>
                  </Select>

                  <Textarea
                    label="Observaciones (opcional)"
                    placeholder="Ej: Pago parcial semana 1"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onCloseModal}
                  isDisabled={registrandoPago}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={registrarPago}
                  isDisabled={registrandoPago || !montoPago || parseFloat(montoPago) <= 0}
                >
                  {registrandoPago ? 'Registrando...' : 'Registrar Pago'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Documentación de endpoints */}
      <Card className="bg-gray-50">
        <CardHeader>
          <h3 className="text-lg font-semibold">📋 Documentación de Endpoints Necesarios</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4 text-sm font-mono">
            <div>
              <p className="font-bold text-blue-600">GET /api/repartidores/:id/cuenta-corriente</p>
              <p className="text-gray-700 mt-1">Obtener resumen y movimientos de cuenta corriente de un repartidor</p>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`Response: {
  "success": true,
  "data": {
    "resumen": {
      "repartidor_id": 5,
      "repartidor_nombre": "Juan Pérez",
      "saldo_actual": 45000,
      "total_debitos": 150000,
      "total_creditos": 105000,
      "cantidad_movimientos": 24,
      "ultimo_movimiento_at": "2026-09-15T10:30:00Z"
    },
    "movimientos": [
      {
        "id": "uuid-1",
        "fecha": "2026-09-15T10:30:00Z",
        "tipo": "CREDITO",
        "descripcion": "Pago parcial - Semana 1",
        "monto": 25000,
        "saldo_acumulado": 45000,
        "medio_pago": "efectivo",
        "observaciones": "Pago semanal"
      },
      {
        "id": "uuid-2",
        "fecha": "2026-09-14T15:20:00Z",
        "tipo": "DEBITO",
        "descripcion": "Fiado cliente María García",
        "monto": 12000,
        "saldo_acumulado": 70000,
        "observaciones": null
      }
    ]
  }
}`}
              </pre>
            </div>

            <div>
              <p className="font-bold text-green-600">POST /api/repartidores/:id/cuenta-corriente/pagos</p>
              <p className="text-gray-700 mt-1">Registrar un pago del repartidor a la empresa</p>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`Request Body: {
  "monto": 25000,
  "medio_pago": "efectivo",
  "observaciones": "Pago parcial semana 1"
}

Response: {
  "success": true,
  "message": "Pago registrado exitosamente",
  "data": {
    "pago": {
      "id": "uuid-new",
      "repartidor_id": 5,
      "monto": 25000,
      "medio_pago": "efectivo",
      "fecha": "2026-09-16T22:30:00Z",
      "observaciones": "Pago parcial semana 1"
    },
    "saldo_actual": 20000
  }
}`}
              </pre>
            </div>

            <div className="pt-4 border-t">
              <p className="font-bold text-gray-700">Notas de implementación:</p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Los débitos se generan automáticamente cuando el repartidor fía a clientes</li>
                <li>Los créditos se registran manualmente desde esta UI</li>
                <li>El saldo es: total_debitos - total_creditos</li>
                <li>Saldo positivo = repartidor debe a la empresa</li>
                <li>Los medios de pago son: efectivo, transferencia, debito, credito</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
