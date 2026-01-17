import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@heroui/react";

interface Movimiento {
  id: number;
  tipo: "VENTA_LOCAL" | "CIERRE_VENTA" | "GASTO" | "NUEVO_CLIENTE";
  descripcion: string;
  usuario_id: number;
  fecha: string;
  activo: boolean;
  monto: string;
  detalles: any;
}

interface ModalToTableProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: {
    id: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
}

const ModalToTable: React.FC<ModalToTableProps> = ({ isOpen, onClose, cliente }) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovimientos = async () => {
      if (!cliente?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Intentar obtener movimientos del cliente desde la API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movimientos/cliente/${cliente.id}`);
        
        // Si el endpoint no existe o no hay movimientos, establecer array vacío
        if (!response.ok) {
          // Si es 404 o cualquier error, simplemente no hay movimientos
          setMovimientos([]);
          return;
        }
        
        const data = await response.json();
        
        if (data.success && data.movimientos) {
          setMovimientos(data.movimientos);
        } else if (data.success && Array.isArray(data)) {
          setMovimientos(data);
        } else {
          setMovimientos([]);
        }
      } catch (error) {
        console.error('Error al cargar movimientos:', error);
        // En caso de error, simplemente establecer array vacío
        setMovimientos([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchMovimientos();
    }
  }, [isOpen, cliente?.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {cliente?.nombre}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <p>Teléfono: {cliente?.telefono || 'No registrado'}</p>
              <p>Email: {cliente?.email || 'No registrado'}</p>
              <p className="col-span-2">Dirección: {cliente?.direccion || 'No registrada'}</p>
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-lg font-semibold">Historial de Movimientos</h3>
              
              {error && (
                <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="w-8 h-8 rounded-full border-4 border-blue-500 animate-spin border-t-transparent"></div>
                </div>
              ) : movimientos.length > 0 ? (
                <div className="space-y-4">
                  {movimientos.map((movimiento) => (
                    <div key={movimiento.id} className="overflow-hidden mb-4 bg-white rounded-xl border shadow-sm transition-all hover:shadow-md">
                      <div className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-3 items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {new Date(movimiento.fecha).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="px-3 py-1 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full">
                              {movimiento.tipo}
                            </span>
                          </div>
                          <p className="text-base font-medium text-gray-800">{movimiento.descripcion}</p>
                          {movimiento.monto && (
                            <p className="text-lg font-bold text-gray-900">
                              ${Number(movimiento.monto).toLocaleString('es-AR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
                  Aun no hay movimientos registrados con este cliente
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalToTable;