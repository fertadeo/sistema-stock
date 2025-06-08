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
import AddressAutocomplete from "./AddressAutocomplete";

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
  const [latitud, setLatitud] = useState<string>('');
  const [longitud, setLongitud] = useState<string>('');

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
          break;
        case "telefono":
          setTelefono(value);
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

  const handleAddressChange = (address: string, lat: string, lon: string) => {
    console.log("=== CAMBIO DE DIRECCIÓN ===");
    console.log("Dirección:", address);
    console.log("Latitud:", lat);
    console.log("Longitud:", lon);
    console.log("========================");
    
    setDireccion(address);
    setLatitud(lat);
    setLongitud(lon);
  };

  const validateForm = () => {
    return true; // Siempre retorna true ya que todos los campos son opcionales
  };

  const handleAgregarEnvase = () => {
    if (!productoSeleccionado) return;

    const producto = productos.find(p => p.id === parseInt(productoSeleccionado));
    if (!producto) return;

    // Extraer la capacidad del nombre del producto si no está definida explícitamente
    let capacidad = producto.capacidad;
    
    if (!capacidad) {
      // Intentar extraer la capacidad del nombre del producto
      const nombreProducto = producto.nombreProducto;
      
      // Buscar patrones como "20L", "12L", "1250cc", etc.
      const capacidadMatch = nombreProducto.match(/(\d+)(?:\.\d+)?\s*(?:L|l|litros?|cc|ml)/i);
      
      if (capacidadMatch) {
        let valor = parseFloat(capacidadMatch[1]);
        const unidad = capacidadMatch[0].toLowerCase();
        
        // Convertir a litros si es necesario
        if (unidad.includes('cc') || unidad.includes('ml')) {
          valor = valor / 1000; // Convertir cc/ml a litros
        }
        
        capacidad = valor;
        console.log(`Capacidad extraída del nombre: ${capacidad}L`);
      } else {
        // Si no se puede extraer, usar un valor predeterminado
        capacidad = 1; // Valor predeterminado de 1 litro
        console.log(`No se pudo extraer la capacidad, usando valor predeterminado: ${capacidad}L`);
      }
    }

    // Asegurarnos de que cantidad sea un número válido
    const cantidad = isNaN(cantidadSeleccionada) || cantidadSeleccionada <= 0 ? 1 : cantidadSeleccionada;

    const nuevoEnvase: EnvasePrestado = {
      productoId: producto.id,
      cantidad: cantidad,
      nombreProducto: producto.nombreProducto,
      tipo: producto.tipo,
      capacidad: capacidad
    };

    // Verificar que todos los campos requeridos estén presentes
    if (!nuevoEnvase.productoId || !nuevoEnvase.cantidad || !nuevoEnvase.nombreProducto || !nuevoEnvase.capacidad) {
      setNotificationMessage("Error en los datos del envase");
      setNotificationDescription("Faltan datos requeridos para el envase.");
      setNotificationType("error");
      setNotificationVisible(true);
      return;
    }

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

    // Asegurarnos de que zona sea un número o null
    let zonaId = null;
    if (zona && zona.trim() !== "") {
      zonaId = parseInt(zona);
      if (isNaN(zonaId)) {
        zonaId = null;
      }
    }

    const nuevoCliente = {
      dni: dni || null,
      nombre: nombre.trim(),
      email: email || null,
      telefono: telefono.trim(),
      direccion: direccion || null,
      latitud: latitud || null,
      longitud: longitud || null,
      zona: zonaId,
      repartidor: repartidor || null,
      dia_reparto: diaReparto || null,
      envases_prestados: envasesPrestados.length > 0 ? 
        envasesPrestados.map(envase => ({
          producto_id: envase.productoId,
          producto_nombre: envase.nombreProducto,
          capacidad: envase.capacidad,
          cantidad: envase.cantidad
        })) : 
        []
    };

    // Logs detallados para debug
    console.log("=== DATOS DEL NUEVO CLIENTE ===");
    console.log("Datos completos:", nuevoCliente);
    console.log("Dirección:", direccion);
    console.log("Latitud:", latitud);
    console.log("Longitud:", longitud);
    console.log("URL de la API:", `${process.env.NEXT_PUBLIC_API_URL}/api/clientes`);
    console.log("Datos a enviar (JSON):", JSON.stringify(nuevoCliente, null, 2));
    console.log("========================");

    try {
      setIsSaving(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoCliente),
      });

      // Log de la respuesta
      console.log("=== RESPUESTA DEL SERVIDOR ===");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      
      const responseText = await response.text();
      console.log("Respuesta completa:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("Respuesta parseada:", responseData);
      } catch (e) {
        console.log("No se pudo parsear la respuesta como JSON");
      }
      console.log("========================");

      if (!response.ok) {
        const errorMessage = responseData?.message || "Error al guardar el cliente";
        throw new Error(errorMessage);
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
      console.error("=== ERROR DETALLADO ===");
      console.error("Error completo:", error);
      console.error("Mensaje de error:", error instanceof Error ? error.message : "Error desconocido");
      console.error("========================");
      
      setNotificationMessage("Error inesperado");
      setNotificationDescription(error instanceof Error ? error.message : "Error al guardar el cliente");
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
                  onChange={(e) => handleInputChange(e, "nombre")}
                />
                <AddressAutocomplete
                  className="flex-1"
                  label="Dirección"
                  placeholder="Ingrese la dirección"
                  value={direccion}
                  onChange={handleAddressChange}
                />
              </div>
              <div className="flex gap-4 mb-4">
                <Input
                  className="w-1/3"
                  label="DNI / CUIL"
                  placeholder="Ingrese el DNI o CUIL del cliente"
                  value={dni}
                  onChange={(e) => handleInputChange(e, "dni")}
                />
                <Input
                  className="w-1/3"
                  label="Email"
                  placeholder="Ingrese el Email"
                  value={email}
                  onChange={(e) => handleInputChange(e, "email")}
                />
                <Input
                  className="w-1/3"
                  label="Teléfono"
                  placeholder="Ingrese el teléfono"
                  value={telefono}
                  onChange={(e) => handleInputChange(e, "telefono")}
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
                  {envasesPrestados.length > 0 ? (
                    envasesPrestados.map((envase, index) => (
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
                    ))
                  ) : (
                    <div className="py-2 italic text-center text-gray-500">
                      Este cliente no tiene envases prestados
                    </div>
                  )}
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
