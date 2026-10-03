import React from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import type { ResumenImportacion } from "@/lib/import/clientesExcel";

type ErrorImportacion = {
  nombre: string;
  motivo: string;
};

type Props = {
  isOpen: boolean;
  archivoNombre: string;
  resumen: ResumenImportacion | null;
  aplicando: boolean;
  progreso: { hechas: number; total: number } | null;
  resultado: { ok: number; errores: ErrorImportacion[] } | null;
  onClose: () => void;
  onConfirmar: () => void;
};

const Tarjeta = ({ valor, etiqueta }: { valor: number; etiqueta: string }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
    <p className="text-lg font-semibold text-gray-900">{valor}</p>
    <p className="text-xs text-gray-600">{etiqueta}</p>
  </div>
);

const LIMITE_LISTA = 30;

const ImportarClientesModal: React.FC<Props> = ({
  isOpen,
  archivoNombre,
  resumen,
  aplicando,
  progreso,
  resultado,
  onClose,
  onConfirmar,
}) => {
  const totalActualizar = resumen?.actualizaciones.length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isDismissable={!aplicando}
      hideCloseButton={aplicando}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Revisar importación
          {archivoNombre && (
            <span className="text-sm font-normal text-gray-500">{archivoNombre}</span>
          )}
        </ModalHeader>
        <ModalBody>
          {resultado ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-800">
                Se actualizaron {resultado.ok} cliente{resultado.ok === 1 ? "" : "s"}.
                {resultado.errores.length > 0
                  ? ` ${resultado.errores.length} no se pudieron guardar.`
                  : ""}
              </p>
              {resultado.errores.length > 0 && (
                <ul className="flex flex-col gap-2 text-sm">
                  {resultado.errores.map((error, index) => (
                    <li key={`${error.nombre}-${index}`} className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                      <span className="font-semibold">{error.nombre}: </span>
                      {error.motivo}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : resumen ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Tarjeta valor={resumen.totalFilas} etiqueta="Filas leídas" />
                <Tarjeta valor={totalActualizar} etiqueta="A actualizar" />
                <Tarjeta valor={resumen.sinCambios} etiqueta="Sin cambios" />
                <Tarjeta valor={resumen.observaciones.length} etiqueta="Con observaciones" />
              </div>

              {totalActualizar === 0 ? (
                <p className="text-sm text-gray-700">
                  No hay datos modificados para guardar.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-gray-800">
                    Cambios detectados
                  </p>
                  <ul className="flex flex-col gap-2">
                    {resumen.actualizaciones.slice(0, LIMITE_LISTA).map((item) => (
                      <li key={`${item.id}-${item.fila}`} className="rounded-md border border-gray-200 px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.nombre}
                          <span className="ml-2 text-xs font-normal text-gray-500">Fila {item.fila}</span>
                        </p>
                        <ul className="mt-1 text-sm text-gray-700">
                          {item.cambios.map((cambio) => (
                            <li key={cambio.campo}>
                              <span className="font-medium">{cambio.campo}: </span>
                              {cambio.anterior} → {cambio.nuevo}
                            </li>
                          ))}
                        </ul>
                        {item.aviso && <p className="mt-1 text-xs text-amber-700">{item.aviso}</p>}
                      </li>
                    ))}
                  </ul>
                  {resumen.actualizaciones.length > LIMITE_LISTA && (
                    <p className="text-xs text-gray-500">
                      Mostrando {LIMITE_LISTA} de {resumen.actualizaciones.length} clientes a actualizar.
                    </p>
                  )}
                </div>
              )}

              {resumen.observaciones.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-gray-800">Observaciones</p>
                  <ul className="flex flex-col gap-2">
                    {resumen.observaciones.slice(0, LIMITE_LISTA).map((item) => (
                      <li key={`${item.fila}-${item.nombre}`} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                        <span className="font-semibold">Fila {item.fila} · {item.nombre}: </span>
                        {item.motivo}
                      </li>
                    ))}
                  </ul>
                  {resumen.observaciones.length > LIMITE_LISTA && (
                    <p className="text-xs text-gray-500">
                      Mostrando {LIMITE_LISTA} de {resumen.observaciones.length} observaciones.
                    </p>
                  )}
                </div>
              )}

              {aplicando && progreso && (
                <p className="text-sm font-medium text-blue-700">
                  Actualizando {progreso.hechas} de {progreso.total}...
                </p>
              )}
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={aplicando}>
            {resultado ? "Cerrar" : "Cancelar"}
          </Button>
          {!resultado && (
            <Button
              color="primary"
              onPress={onConfirmar}
              isDisabled={aplicando || totalActualizar === 0}
              isLoading={aplicando}
            >
              {aplicando ? "Actualizando..." : `Actualizar ${totalActualizar} cliente${totalActualizar === 1 ? "" : "s"}`}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImportarClientesModal;
