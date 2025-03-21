import React, { useState, ChangeEvent, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
  Select,
  SelectItem,
} from "@heroui/react";
import Notification from "./notification"; // Importa el componente de notificación
import zonas from "./soderia-data/zonas.json"; // Importamos el archivo de zonas
import repartidoresData from "./soderia-data/repartidores.json";
import diasRepartoData from "./soderia-data/diareparto.json";

type EnvasePrestado = {
  productoId: number;
  cantidad: number;
  nombreProducto: string;
  tipo: string;
  capacidad: number;
};

interface Producto {
  id: number;
  nombreProducto: string;
  tipo: string;
  capacidad: number;
}

interface NuevoClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteAgregado: () => void;
}

const NuevoClienteModal: React.FC<NuevoClienteModalProps> = ({
  isOpen,
  onClose,
  onClienteAgregado,
}) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [idCliente, setIdCliente] = useState<number | null>(null); // Estado para el ID del cliente
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [email, setEmail] = useState("");
  const [zona, setZona] = useState("");
  const [repartidor, setRepartidor] = useState("");
  const [diaReparto, setDiaReparto] = useState("");
  const [envasesPrestados, setEnvasesPrestados] = useState<EnvasePrestado[]>([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationDescription, setNotificationDescription] = useState("");
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({
    nombre: false,
    telefono: false,
  });
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);

  // Fetch para obtener los productos
  const fetchProductos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`);
      if (!response.ok) {
        throw new Error("Error al obtener productos");
      }
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      setNotificationMessage("Error");
      setNotificationDescription("No se pudieron cargar los productos.");
      setNotificationType("error");
      setNotificationVisible(true);
    }
  };

  // Efecto para cargar productos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchProductos();
    }
  }, [isOpen]);

  // Fetch para obtener el próximo ID
  const fetchNextClienteId = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/getNextClienteId`);
      if (!response.ok) {
        throw new Error("Error al obtener el próximo ID");
      }

      const data = await response.json();
      setIdCliente(data.nextId); // Actualiza el estado con el ID obtenido
    } catch (error) {
      // console.error("Error al obtener el próximo ID de cliente:", error);
      setIdCliente(null); // Reinicia el estado en caso de error
    }
  };

  // Efecto para cargar el ID cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      fetchNextClienteId();
    }
  }, [isOpen]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement> | string,
    field: string
  ) => {
    if (typeof e !== 'string') {
      const value = e.target.value;

      switch (field) {
        case "nombre":
          setNombre(value);
          setFormErrors((prevErrors) => ({
            ...prevErrors,
            nombre: value.trim() === "",
          }));
          break;
        case "telefono":
          setTelefono(value);
          setFormErrors((prevErrors) => ({
            ...prevErrors,
            telefono: value.trim() === "",
          }));
          break;
        case "direccion":
          setDireccion(value);
          break;
        case "email":
          setEmail(value);
          break;
        case "dni":
          setDni(value);
          break;
        default:
          break;
      }
    } else {
      // Si es un string (para los Select)
      switch (field) {
        case "zona":
          setZona(e);
          break;
        case "repartidor":
          setRepartidor(e);
          break;
        case "diaReparto":
          setDiaReparto(e);
          break;
      }
    }
  };

  const validateForm = () => {
    const errors = {
      nombre: nombre.trim() === "",
      telefono: telefono.trim() === "",
    };

    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const handleAgregarEnvase = () => {
    if (!productoSeleccionado) return;

    const producto = productos.find(p => p.id === parseInt(productoSeleccionado));
    if (!producto) return;

    const nuevoEnvase: EnvasePrestado = {
      productoId: producto.id,
      cantidad: cantidadSeleccionada,
      nombreProducto: producto.nombreProducto,
      tipo: producto.tipo,
      capacidad: producto.capacidad
    };

    setEnvasesPrestados(prev => [...prev, nuevoEnvase]);
    setProductoSeleccionado("");
    setCantidadSeleccionada(1);
  };

  const handleQuitarEnvase = (index: number) => {
    setEnvasesPrestados(prev => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (!validateForm()) {
      return;
    }

    const nombreZona = zona ? zonas[parseInt(zona)].nombre : null;

    // Transformar los envases prestados al formato requerido
    const envases_prestados = envasesPrestados.map(envase => ({
      tipo_producto: envase.tipo,
      capacidad: envase.capacidad,
      cantidad: envase.cantidad
    }));

    const nuevoCliente = {
      dni: dni || null,
      nombre,
      email: email || null,
      telefono,
      direccion: direccion || null,
      zona: nombreZona,
      repartidor: repartidor || null,
      dia_reparto: diaReparto || null,
      envases_prestados
    };

    console.log("Datos a enviar:", nuevoCliente);

    try {
      setIsSaving(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoCliente),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.message === "El cliente con este DNI ya existe") {
          setNotificationMessage("Error: Cliente duplicado");
          setNotificationDescription("No se puede registrar un cliente con un DNI ya registrado.");
          setNotificationType("error");
        } else {
          setNotificationMessage("Error al guardar el cliente");
          setNotificationDescription("Ocurrió un problema al intentar guardar el cliente.");
          setNotificationType("error");
        }

        setNotificationVisible(true);
        setIsSaving(false);
        return;
      }

      onClienteAgregado();

      setNotificationMessage("¡Cliente guardado exitosamente!");
      setNotificationDescription("El cliente ha sido agregado correctamente.");
      setNotificationType("success");
      setNotificationVisible(true);

      setTimeout(() => {
        setDni("");
        setNombre("");
        setTelefono("");
        setEmail("");
        setDireccion("");
        setZona("");
        setRepartidor("");
        setDiaReparto("");
        setEnvasesPrestados([]);
        setIsSaving(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error al guardar el nuevo cliente:", error);
      setNotificationMessage("Error inesperado");
      setNotificationDescription("Ocurrió un error inesperado al intentar guardar el cliente.");
      setNotificationType("error");
      setNotificationVisible(true);
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal backdrop="blur" isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">
              Nuevo Cliente
            </ModalHeader>

            <ModalBody>
              <div className="flex gap-4 mb-4">
                <Input
                  className="w-24"
                  label="ID"
                  value={idCliente ? idCliente.toString() : "..."}
                  readOnly
                  disabled
                />
                <Input
                  className="w-1/2"
                  label="Nombre completo"
                  placeholder="Ingrese el nombre"
                  value={nombre}
                  required
                  onChange={(e) => handleInputChange(e, "nombre")}
                  color={formErrors.nombre ? "danger" : "default"}
                />
                <Input
                  className="flex-1"
                  label="Dirección (opcional)"
                  placeholder="Ingrese la dirección"
                  value={direccion}
                  onChange={(e) => handleInputChange(e, "direccion")}
                />
              </div>
              <div className="flex gap-4 mb-4">
                <Input
                  className="w-1/3"
                  label="DNI / CUIL (opcional)"
                  placeholder="Ingrese el DNI o CUIL del cliente"
                  value={dni}
                  onChange={(e) => handleInputChange(e, "dni")}
                />
                <Input
                  className="w-1/3"
                  label="Email (opcional)"
                  placeholder="Ingrese el Email"
                  value={email}
                  onChange={(e) => handleInputChange(e, "email")}
                />
                <Input
                  className="w-1/3"
                  label="Teléfono"
                  placeholder="Ingrese el teléfono"
                  value={telefono}
                  required
                  onChange={(e) => handleInputChange(e, "telefono")}
                  color={formErrors.telefono ? "danger" : "default"}
                />
              </div>
              <div className="flex gap-4 mb-4">
                <Select  
                  className="w-1/3"
                  label="Zona"
                  placeholder="Seleccione la zona"
                  value={zona}
                  onChange={(e) => handleInputChange(e.target.value, "zona")}
                >
                  {zonas.map((zona, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {zona.nombre}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  className="w-1/3"
                  label="Repartidor"
                  placeholder="Seleccione el repartidor"
                  value={repartidor}
                  onChange={(e) => handleInputChange(e.target.value, "repartidor")}
                >
                  {repartidoresData.repartidores.map((rep, index) => (
                    <SelectItem key={rep} value={rep}>
                      {rep}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  className="w-1/3"
                  label="Día de Reparto"
                  placeholder="Seleccione el día de reparto"
                  value={diaReparto}
                  onChange={(e) => setDiaReparto(e.target.value)}
                >
                  {diasRepartoData.diasReparto.map((dia) => (
                    <SelectItem key={dia} value={dia}>
                      {dia}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-4 p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Envases Prestados</h3>
                  <div className="flex flex-1 gap-2 items-end ml-4">
                    <Select
                      className="flex-1"
                      label="Producto"
                      placeholder="Seleccione el producto"
                      value={productoSeleccionado}
                      onChange={(e) => setProductoSeleccionado(e.target.value)}
                    >
                      {productos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id.toString()}>
                          {producto.nombreProducto}
                        </SelectItem>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      label="Cantidad"
                      value={cantidadSeleccionada.toString()}
                      onChange={(e) => setCantidadSeleccionada(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                    <Button color="primary" className="h-[56px]" onClick={handleAgregarEnvase}>
                      Agregar
                    </Button>
                  </div>
                </div>
                <div className="overflow-y-auto mt-2 max-h-32">
                  {envasesPrestados.map((envase, index) => (
                    <div key={index} className="flex justify-between items-center py-1 hover:bg-gray-50">
                      <span className="font-medium">{envase.cantidad} x {envase.nombreProducto}</span>
                      <Button
                        color="danger"
                        size="sm"
                        variant="light"
                        onClick={() => handleQuitarEnvase(index)}
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cerrar
              </Button>
              <Button
                color="success"
                onPress={handleGuardar}
                disabled={isSaving || idCliente === null}
                style={{ color: "white" }}
              >
                {isSaving ? <Spinner color="default" /> : "Guardar"}
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>

      <Notification
        message={notificationMessage}
        description={notificationDescription}
        isVisible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
        type={notificationType}
      />
    </>
  );
};

export default NuevoClienteModal;
