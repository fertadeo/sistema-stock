import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@heroui/react";
import repartidoresData from "./soderia-data/repartidores.json";
import diasRepartoData from "./soderia-data/diareparto.json";
import zonas from "./soderia-data/zonas.json";
import AddressAutocomplete from "./AddressAutocomplete";

interface Producto {
  id: number;
  nombreProducto: string;
  precioPublico: number;
  precioRevendedor: number;
  cantidadStock: number | null;
  descripcion: string | null;
}

interface EnvasePrestado {
  producto_id: number;
  producto_nombre: string;
  capacidad: number;
  cantidad: number;
}

interface ModalEditarProps {
  cliente: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ModalEditar: React.FC<ModalEditarProps> = ({ cliente, isOpen, onClose, onSave }) => {
  // Estados inicializados con valores del cliente
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [zona, setZona] = useState("");
  const [repartidor, setRepartidor] = useState("");
  const [diaReparto, setDiaReparto] = useState("");
  const [envasesPrestados, setEnvasesPrestados] = useState<EnvasePrestado[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProducto, setSelectedProducto] = useState("");
  const [cantidad, setCantidad] = useState("1");

  // Efecto para cargar productos y actualizar envases prestados
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`);
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        setProductos(data);

        // Si hay envases prestados, actualizar sus nombres
        if (cliente?.envases_prestados?.length > 0) {
          const envasesActualizados = cliente.envases_prestados.map((envase: EnvasePrestado) => {
            const productoEncontrado = data.find((p: Producto) => p.id === envase.producto_id);
            return {
              producto_id: envase.producto_id,
              producto_nombre: productoEncontrado ? productoEncontrado.nombreProducto : 'Producto no encontrado',
              capacidad: envase.capacidad,
              cantidad: envase.cantidad
            };
          });
          setEnvasesPrestados(envasesActualizados);
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    };
    fetchProductos();
  }, [cliente]);

  // Efecto para actualizar los valores cuando cambia el cliente o se abre el modal
  useEffect(() => {
    if (cliente && isOpen) {
      console.log('Cliente recibido:', cliente); // Para debug
      setDni(cliente.dni || "");
      setNombre(cliente.nombre || "");
      setTelefono(cliente.telefono || "");
      setEmail(cliente.email || "");
      setDireccion(cliente.direccion || "");
      setLatitud(cliente.latitud || "");
      setLongitud(cliente.longitud || "");
      setZona(cliente.zona?.toString() || "");
      setRepartidor(cliente.repartidor || "");
      setDiaReparto(cliente.dia_reparto || "");
    }
  }, [cliente, isOpen]);

  const handleAgregarEnvase = () => {
    if (!selectedProducto || !cantidad) return;
    
    const producto = productos.find(p => p.id.toString() === selectedProducto);
    if (!producto) return;

    // Extraer la capacidad del nombreProducto (ejemplo: "Bidón x 20L" -> 20)
    const capacidadMatch = producto.nombreProducto.match(/\d+/);
    const capacidad = capacidadMatch ? parseInt(capacidadMatch[0]) : 1;

    const nuevoEnvase: EnvasePrestado = {
      producto_id: producto.id,
      producto_nombre: producto.nombreProducto,
      capacidad: capacidad,
      cantidad: parseInt(cantidad)
    };

    setEnvasesPrestados([...envasesPrestados, nuevoEnvase]);
    setSelectedProducto("");
    setCantidad("1");
  };

  const handleQuitarEnvase = (index: number) => {
    setEnvasesPrestados(envasesPrestados.filter((_, i) => i !== index));
  };

  const handleDireccionChange = (direccion: string, lat: string, lon: string) => {
    setDireccion(direccion);
    setLatitud(lat);
    setLongitud(lon);
  };

  const handleSave = async () => {
    if (cliente) {
      try {
        // Asegurarse de que zona sea un número
        const zonaNumero = parseInt(zona);

        const datosActualizados = {
          dni,
          nombre,
          email,
          telefono,
          direccion,
          latitud,
          longitud,
          zona: zonaNumero,
          repartidor,
          dia_reparto: diaReparto,
          envases_prestados: envasesPrestados.map(envase => ({
            producto_id: envase.producto_id,
            producto_nombre: envase.producto_nombre,
            capacidad: envase.capacidad,
            cantidad: envase.cantidad
          }))
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${cliente.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosActualizados),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al actualizar el cliente");
        }

        onSave();
        onClose();
      } catch (error) {
        console.error("Error al actualizar el cliente:", error);
        // Aquí podrías agregar un manejo de errores más específico si lo necesitas
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="opaque" size="2xl">
      <ModalContent>
        <ModalHeader>Editar datos de cliente</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="DNI o CUIL/CUIT"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingrese DNI o CUIL/CUIT"
            />
            <Input
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese nombre"
            />
            <Input
              label="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ingrese teléfono"
            />
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese email"
            />
            <AddressAutocomplete
              label="Dirección"
              value={direccion}
              onChange={handleDireccionChange}
              placeholder="Ingrese dirección"
            />
            <Select
              label="Zona"
              placeholder="Seleccione la zona"
              selectedKeys={zona ? [zona] : []}
              onChange={(e) => setZona(e.target.value)}
            >
              {zonas.map((zona, index) => (
                <SelectItem key={index.toString()} value={index.toString()}>
                  {zona.nombre}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Repartidor"
              placeholder="Seleccione el repartidor"
              selectedKeys={repartidor ? [repartidor] : []}
              onChange={(e) => setRepartidor(e.target.value)}
            >
              {repartidoresData.repartidores.map((rep) => (
                <SelectItem key={rep} value={rep}>
                  {rep}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Día de Reparto"
              placeholder="Seleccione el día de reparto"
              selectedKeys={diaReparto ? [diaReparto] : []}
              onChange={(e) => setDiaReparto(e.target.value)}
            >
              {diasRepartoData.diasReparto.map((dia) => (
                <SelectItem key={dia} value={dia}>
                  {dia}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-bold">Envases Prestados</h3>
            
            <div className="flex gap-4 mb-4">
              <Select
                label="Producto"
                placeholder="Seleccione el producto"
                value={selectedProducto}
                onChange={(e) => setSelectedProducto(e.target.value)}
                className="flex-1"
              >
                {productos.map((producto) => (
                  <SelectItem key={producto.id} value={producto.id.toString()}>
                    {producto.nombreProducto}
                  </SelectItem>
                ))}
              </Select>
              
              <Input
                type="number"
                label="Cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
                className="w-32"
              />
              
              <Button
                color="primary"
                className="self-end"
                onClick={handleAgregarEnvase}
              >
                Agregar
              </Button>
            </div>

            {/* Lista de envases prestados */}
            <div className="space-y-2">
              {envasesPrestados.map((envase, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{`${envase.cantidad} x ${envase.producto_nombre}`}</span>
                  <Button
                    color="danger"
                    variant="light"
                    size="sm"
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
          <Button color="primary" onClick={handleSave}>
            Guardar Datos
          </Button>
          <Button color="danger" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalEditar;
