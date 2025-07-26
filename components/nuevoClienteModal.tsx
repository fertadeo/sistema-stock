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

// Estilos CSS para mejorar la experiencia en mobile
const mobileStyles = `
  @media (max-width: 768px) {
    .modal-mobile-fix {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      height: 100vh !important;
      width: 100vw !important;
      margin: 0 !important;
      border-radius: 0 !important;
    }
    
    .modal-content-mobile {
      height: 100vh !important;
      max-height: 100vh !important;
      border-radius: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    
    .modal-body-mobile {
      flex: 1 !important;
      overflow-y: auto !important;
      padding-bottom: 140px !important;
      min-height: 0 !important;
    }
    
    .modal-footer-mobile {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: white !important;
      border-top: 1px solid #e5e7eb !important;
      padding: 1rem !important;
      z-index: 1000 !important;
      height: auto !important;
      min-height: 100px !important;
    }
  }
`;

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
  const [cantidadInput, setCantidadInput] = useState("1");
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
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      <Modal 
        backdrop="blur" 
        isOpen={isOpen} 
        onClose={onClose} 
        size="4xl" 
        className="p-4"
        classNames={{
          wrapper: "items-start pt-16 md:pt-0 modal-mobile-fix",
          base: "max-h-[85vh] md:max-h-[90vh] modal-mobile-fix",
          body: "overflow-y-auto flex flex-col"
        }}
        scrollBehavior="inside"
      >
        <ModalContent className="max-h-[85vh] md:max-h-[90vh] overflow-y-auto modal-content-mobile">
          <>
            <ModalHeader className="flex flex-row justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold">Nuevo Cliente</h2>
              <Button
                isIconOnly
                color="danger"
                variant="flat"
                onPress={onClose}
                size="sm"
                className="text-red-600"
              >
                ×
              </Button>
            </ModalHeader>

            <ModalBody className="space-y-4 pb-4 modal-body-mobile flex-1">
              {/* Primera fila - ID y Nombre */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  className="md:col-span-1"
                  label="ID"
                  value={idCliente ? idCliente.toString() : "..."}
                  readOnly
                  disabled
                  size="sm"
                />
                <Input
                  className="md:col-span-2"
                  label="Nombre completo"
                  placeholder="Ingrese el nombre"
                  value={nombre}
                  onChange={(e) => handleInputChange(e, "nombre")}
                  size="sm"
                />
              </div>

              {/* Segunda fila - Dirección completa */}
              <div className="w-full">
                <AddressAutocomplete
                  className="w-full"
                  label="Dirección"
                  placeholder="Ingrese la dirección"
                  value={direccion}
                  onChange={handleAddressChange}
                />
              </div>

              {/* Tercera fila - DNI, Email, Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  className="w-full"
                  label="DNI / CUIL"
                  placeholder="Ingrese el DNI o CUIL del cliente"
                  value={dni}
                  onChange={(e) => handleInputChange(e, "dni")}
                  size="sm"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <Input
                  className="w-full"
                  label="Email"
                  placeholder="Ingrese el Email"
                  value={email}
                  onChange={(e) => handleInputChange(e, "email")}
                  size="sm"
                />
                <Input
                  className="w-full"
                  label="Teléfono"
                  placeholder="Ingrese el teléfono"
                  value={telefono}
                  onChange={(e) => handleInputChange(e, "telefono")}
                  size="sm"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>

              {/* Cuarta fila - Zona, Repartidor, Día de Reparto */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select  
                  className="w-full"
                  label="Zona"
                  placeholder="Seleccione la zona"
                  value={zona}
                  onChange={(e) => handleInputChange(e.target.value, "zona")}
                  size="sm"
                >
                  {zonas.map((zona, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {zona.nombre}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  className="w-full"
                  label="Repartidor"
                  placeholder="Seleccione el repartidor"
                  value={repartidor}
                  onChange={(e) => handleInputChange(e.target.value, "repartidor")}
                  size="sm"
                >
                  {repartidoresData.repartidores.map((rep, index) => (
                    <SelectItem key={rep} value={rep}>
                      {rep}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  className="w-full"
                  label="Día de Reparto"
                  placeholder="Seleccione el día de reparto"
                  value={diaReparto}
                  onChange={(e) => setDiaReparto(e.target.value)}
                  size="sm"
                >
                  {diasRepartoData.diasReparto.map((dia) => (
                    <SelectItem key={dia} value={dia}>
                      {dia}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Sección de Envases Prestados */}
              <div className="flex flex-col gap-4 p-4 rounded-lg border">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-lg font-semibold">Envases Prestados</h3>
                  
                  {/* Controles de agregar envase */}
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    {/* Fila 1: Producto y Cantidad en móvil, lado a lado en desktop */}
                    <div className="flex flex-row gap-2">
                      <Select
                        className="w-[70%] md:w-48"
                        label="Producto"
                        placeholder="Seleccione el producto"
                        value={productoSeleccionado}
                        onChange={(e) => setProductoSeleccionado(e.target.value)}
                        size="sm"
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
                        value={cantidadInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCantidadInput(value);
                          if (value === '') {
                            setCantidadSeleccionada(1);
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue > 0) {
                              setCantidadSeleccionada(numValue);
                            }
                          }
                        }}
                        onBlur={() => {
                          if (cantidadInput === '' || parseInt(cantidadInput) <= 0) {
                            setCantidadInput("1");
                            setCantidadSeleccionada(1);
                          }
                        }}
                        className="w-[30%] md:w-24"
                        size="sm"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                    {/* Fila 2: Botón Agregar */}
                    <Button 
                      color="primary" 
                      onPress={handleAgregarEnvase}
                      className="w-full md:w-auto h-10 px-4"
                      size="sm"
                    >
                      <span className="hidden md:inline">Agregar</span>
                      <span className="md:hidden">+ Agregar</span>
                    </Button>
                  </div>
                </div>

                {/* Lista de envases */}
                <div className="overflow-y-auto mt-2 max-h-32">
                  {envasesPrestados.length > 0 ? (
                    envasesPrestados.map((envase, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-2 hover:bg-gray-50 rounded">
                        <span className="font-medium text-sm">{envase.cantidad} x {envase.nombreProducto}</span>
                        <Button
                          color="danger"
                          size="sm"
                          variant="flat"
                          onPress={() => handleQuitarEnvase(index)}
                        >
                          <span className="hidden md:inline">Quitar</span>
                          <span className="md:hidden">×</span>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 italic text-center text-gray-500 text-sm">
                      Este cliente no tiene envases prestados
                    </div>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col sm:flex-row gap-2 sticky bottom-0 bg-white border-t pt-4 modal-footer-mobile z-50">
              <Button
                color="success"
                onPress={handleGuardar}
                disabled={isSaving || idCliente === null}
                style={{ color: "white" }}
                className="w-full sm:w-auto"
                size="sm"
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
