import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@heroui/react";

interface GastoEgresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGastoAgregado?: (gasto: any) => void;
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

const GastoEgresoModal: React.FC<GastoEgresoModalProps> = ({ isOpen, onClose, onGastoAgregado }) => {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [factura, setFactura] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gastos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error("Error al guardar el gasto");
      const data = await response.json();
      if (onGastoAgregado) {
        onGastoAgregado(body);
      }
      setConcepto("");
      setMonto("");
      setCategoria("");
      setProveedor("");
      setFactura("");
      onClose();
    } catch (err) {
      setError("Error al guardar el gasto");
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
        <ModalHeader>Nuevo Gasto/Egreso</ModalHeader>
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
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GastoEgresoModal; 