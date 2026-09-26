import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@heroui/react";
import { authFetch } from '@/lib/api/fetchWithAuth';

interface GastoEgresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGastoAgregado?: (gasto: any) => void;
  gastoParaEditar?: {
    id: number;
    monto: number;
    concepto: string;
    detalles?: {
      proveedor?: string;
      factura?: string;
      categoria?: string;
    };
  } | null;
  onGastoEditado?: (gasto: any) => void;
}

const CATEGORIAS = [
  "Pago de haberes",
  "Impuestos",
  "Compra de insumos",
  "Gastos varios",
  "Servicios",
  "Mantenimiento",
  "Otros"
];

const GastoEgresoModal: React.FC<GastoEgresoModalProps> = ({ isOpen, onClose, onGastoAgregado, gastoParaEditar, onGastoEditado }) => {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [factura, setFactura] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos cuando hay un gasto para editar
  React.useEffect(() => {
    if (gastoParaEditar) {
      setConcepto(gastoParaEditar.concepto || "");
      setMonto(String(gastoParaEditar.monto));
      setCategoria(gastoParaEditar.detalles?.categoria || "");
      setProveedor(gastoParaEditar.detalles?.proveedor || "");
      setFactura(gastoParaEditar.detalles?.factura || "");
    } else {
      setConcepto("");
      setMonto("");
      setCategoria("");
      setProveedor("");
      setFactura("");
    }
    setError("");
  }, [gastoParaEditar, isOpen]);

  const handleGuardar = async () => {
    if (!concepto.trim()) {
      setError("El concepto es obligatorio");
      return;
    }
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      setError("Ingrese un monto válido");
      return;
    }
    if (!categoria) {
      setError("Seleccione una categoría");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body = {
        monto: Number(monto),
        concepto: concepto.trim(),
        detalles: {
          proveedor: proveedor.trim() || undefined,
          factura: factura.trim() || undefined,
          categoria
        }
      };

      const esEdicion = !!gastoParaEditar;
      const url = esEdicion 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/gastos/${gastoParaEditar.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/gastos`;
      
      const response = await authFetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) throw new Error(`Error al ${esEdicion ? 'editar' : 'guardar'} el gasto`);
      const data = await response.json();
      
      if (esEdicion && onGastoEditado) {
        onGastoEditado({ ...body, id: gastoParaEditar.id });
      } else if (onGastoAgregado) {
        onGastoAgregado(data.gasto || body);
      }
      
      setConcepto("");
      setMonto("");
      setCategoria("");
      setProveedor("");
      setFactura("");
      onClose();
    } catch (err) {
      setError(`Error al ${gastoParaEditar ? 'editar' : 'guardar'} el gasto`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConcepto("");
    setMonto("");
    setCategoria("");
    setProveedor("");
    setFactura("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} backdrop="blur" size="md">
      <ModalContent>
        <ModalHeader>{gastoParaEditar ? 'Editar Gasto/Egreso' : 'Nuevo Gasto/Egreso'}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="Concepto"
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              placeholder="Ingrese el concepto del gasto"
            />
            <Input
              label="Monto"
              value={monto}
              onChange={e => setMonto(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="Ingrese el monto"
              type="number"
              min="1"
            />
            <Select
              label="Categoría"
              placeholder="Seleccione una categoría"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
            >
              {CATEGORIAS.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </Select>
            <Input
              label="Proveedor (opcional)"
              value={proveedor}
              onChange={e => setProveedor(e.target.value)}
              placeholder="Ingrese el nombre del proveedor"
            />
            <Input
              label="Factura (opcional)"
              value={factura}
              onChange={e => setFactura(e.target.value)}
              placeholder="Ingrese el número de factura"
            />
            {error && <div className="text-sm text-red-500">{error}</div>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button color="success" onClick={handleGuardar} style={{ color: "white" }} isLoading={loading}>
            {gastoParaEditar ? 'Actualizar' : 'Guardar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GastoEgresoModal; 