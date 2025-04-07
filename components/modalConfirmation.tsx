import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface ModalConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cliente?: {
    nombre: string;
    mensaje?: string;
    envasesPrestados?: Array<{
      cantidad: number;
      nombreProducto: string;
    }>;
  };
}

const ModalConfirmation: React.FC<ModalConfirmationProps> = ({ isOpen, onClose, onConfirm, cliente }) => {
  const tieneEnvasesPrestados = cliente?.envasesPrestados && cliente.envasesPrestados.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="opaque">
      <ModalContent>
        <ModalHeader className={tieneEnvasesPrestados ? "text-danger" : ""}>
          {tieneEnvasesPrestados ? "¡Atención!" : "Confirmación"}
        </ModalHeader>
        <ModalBody>
          {cliente?.mensaje ? (
            <p>{cliente.mensaje}</p>
          ) : (
            <>
              <p className="text-danger font-semibold mb-4">
                Este cliente podría guardar información importante como compras y envases prestados
              </p>
              {tieneEnvasesPrestados && cliente.envasesPrestados ? (
                <div>
                  <p className="mb-2 font-semibold text-danger">
                    El cliente <span className="font-bold">{cliente?.nombre}</span> tiene los siguientes envases prestados:
                  </p>
                  <ul className="pl-5 mb-4 list-disc">
                    {cliente.envasesPrestados.map((envase, index) => (
                      <li key={index} className="text-sm">
                        {envase.cantidad} x {envase.nombreProducto}
                      </li>
                    ))}
                  </ul>
                  <p className="text-danger">
                    ¿Desea eliminar el cliente y sus envases prestados de todas maneras?
                  </p>
                </div>
              ) : (
                <p>¿Está seguro que desea eliminar este cliente?</p>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={onConfirm}>
            {tieneEnvasesPrestados ? "Eliminar de todas maneras" : "Eliminar"}
          </Button>
          <Button color="default" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalConfirmation;
