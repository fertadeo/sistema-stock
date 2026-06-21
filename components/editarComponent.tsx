import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@heroui/react";
import diasRepartoData from "./soderia-data/diareparto.json";
import zonas from "./soderia-data/zonas.json";
import AddressAutocomplete from "./AddressAutocomplete";
import { authFetch } from '@/lib/api/fetchWithAuth';
import { geocodificarDireccion } from '@/lib/geocode/geocodificarDireccion';

interface ClienteVinculado {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  saldo_actual: number;
}

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

interface Repartidor {
  id: number;
  nombre: string;
  telefono: string;
  zona_reparto: string;
  activo: boolean;
  fecha_registro: string;
}

interface ModalEditarProps {
  cliente: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (clienteActualizado?: any) => void | Promise<void>;
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
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [clienteVinculado, setClienteVinculado] = useState<ClienteVinculado | null>(null);
  const [resumenDomicilio, setResumenDomicilio] = useState<{ clientes: ClienteVinculado[]; saldo_total: number } | null>(null);
  const [busquedaVinculo, setBusquedaVinculo] = useState("");
  const [candidatosVinculo, setCandidatosVinculo] = useState<ClienteVinculado[]>([]);
  const [vinculando, setVinculando] = useState(false);
  const [mensajeVinculo, setMensajeVinculo] = useState("");

  // Efecto para cargar productos y actualizar envases prestados
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`);
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

  // Efecto para cargar repartidores desde la API
  useEffect(() => {
    const fetchRepartidores = async () => {
      try {
        const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repartidores`);
        if (!response.ok) throw new Error('Error al cargar repartidores');
        const data = await response.json();
        setRepartidores(data);
      } catch (error) {
        console.error('Error al cargar repartidores:', error);
      }
    };
    fetchRepartidores();
  }, []);

  // Efecto para actualizar los valores cuando cambia el cliente o se abre el modal
  useEffect(() => {
    if (cliente && isOpen) {
      console.log('Cliente recibido:', cliente); // Para debug
      setDni(cliente.dni || "");
      setNombre(cliente.nombre || "");
      setTelefono(cliente.telefono || "");
      setEmail(cliente.email || "");
      setDireccion(cliente.direccion || "");
      setLatitud(cliente.latitud != null && cliente.latitud !== "" ? String(cliente.latitud) : "");
      setLongitud(cliente.longitud != null && cliente.longitud !== "" ? String(cliente.longitud) : "");
      setZona(cliente.zona?.toString() || "");
      setRepartidor(cliente.repartidor || "");
      setDiaReparto(cliente.dia_reparto || "");
      setClienteVinculado(cliente.cliente_vinculado || null);
      setResumenDomicilio(cliente.resumen_domicilio || null);
      setBusquedaVinculo("");
      setCandidatosVinculo([]);
      setMensajeVinculo("");
    }
  }, [cliente, isOpen]);

  useEffect(() => {
    if (!isOpen || !cliente?.id || busquedaVinculo.trim().length < 2) {
      setCandidatosVinculo([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/clientes?search=${encodeURIComponent(busquedaVinculo.trim())}`
        );
        if (!response.ok) return;
        const data = await response.json();
        const filtrados = (Array.isArray(data) ? data : [])
          .filter((c: { id: number }) => c.id !== cliente.id)
          .slice(0, 8)
          .map((c: ClienteVinculado) => ({
            id: c.id,
            nombre: c.nombre,
            telefono: c.telefono,
            direccion: c.direccion,
            saldo_actual: 0,
          }));
        setCandidatosVinculo(filtrados);
      } catch {
        setCandidatosVinculo([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busquedaVinculo, isOpen, cliente?.id]);

  const handleVincular = async (otroClienteId: number) => {
    if (!cliente?.id) return;
    setVinculando(true);
    setMensajeVinculo("");
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${cliente.id}/vincular`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliente_vinculado_id: otroClienteId }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al vincular clientes");
      }
      setClienteVinculado(data.data?.cliente?.cliente_vinculado || null);
      setResumenDomicilio(data.data?.resumen_domicilio || null);
      setBusquedaVinculo("");
      setCandidatosVinculo([]);
      setMensajeVinculo("Clientes vinculados correctamente");
      onSave();
    } catch (error) {
      setMensajeVinculo(error instanceof Error ? error.message : "Error al vincular");
    } finally {
      setVinculando(false);
    }
  };

  const handleDesvincular = async () => {
    if (!cliente?.id) return;
    setVinculando(true);
    setMensajeVinculo("");
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${cliente.id}/vincular`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al desvincular clientes");
      }
      setClienteVinculado(null);
      setResumenDomicilio(null);
      setMensajeVinculo("Vinculación eliminada");
      onSave();
    } catch (error) {
      setMensajeVinculo(error instanceof Error ? error.message : "Error al desvincular");
    } finally {
      setVinculando(false);
    }
  };

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
        const zonaNumero = parseInt(zona);

        let latitudFinal = latitud;
        let longitudFinal = longitud;
        let direccionFinal = direccion;

        if (direccion.trim() && (!latitudFinal || !longitudFinal)) {
          const coords = await geocodificarDireccion(direccion);
          if (coords) {
            latitudFinal = coords.latitud;
            longitudFinal = coords.longitud;
            if (coords.direccion) {
              direccionFinal = coords.direccion;
            }
          }
        }

        const datosActualizados = {
          dni,
          nombre,
          email,
          telefono,
          direccion: direccionFinal,
          latitud: latitudFinal || null,
          longitud: longitudFinal || null,
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

        const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${cliente.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosActualizados),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al actualizar el cliente");
        }

        const clienteActualizado = await response.json();
        await onSave(clienteActualizado);
        onClose();
      } catch (error) {
        console.error("Error al actualizar el cliente:", error);
        // Aquí podrías agregar un manejo de errores más específico si lo necesitas
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isDismissable={false}
      backdrop="opaque"
      size="2xl"
      scrollBehavior="inside"
      classNames={{ base: "mx-2 sm:mx-auto max-h-[90dvh]" }}
    >
      <ModalContent>
        <ModalHeader>Editar datos de cliente</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {latitud && longitud && (
              <p className="text-xs text-green-600 sm:col-span-2">
                Ubicación detectada: {Number(latitud).toFixed(5)}, {Number(longitud).toFixed(5)}
              </p>
            )}
            {direccion.trim() && !latitud && (
              <p className="text-xs text-gray-500 sm:col-span-2">
                Elegí una sugerencia de Google para guardar las coordenadas en el mapa.
              </p>
            )}
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
              {repartidores.map((rep) => (
                <SelectItem key={rep.nombre} value={rep.nombre}>
                  {rep.nombre}
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

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="mb-2 text-lg font-bold text-blue-900">Vinculación de domicilio</h3>
            <p className="mb-4 text-sm text-blue-800">
              Vincule otro integrante del mismo domicilio que tenga cuenta corriente o movimientos por separado.
            </p>

            {clienteVinculado ? (
              <div className="space-y-3">
                <div className="p-3 bg-white rounded border border-blue-200">
                  <p className="font-semibold text-gray-800">{clienteVinculado.nombre}</p>
                  <p className="text-sm text-gray-600">{clienteVinculado.telefono}</p>
                  <p className="text-sm text-gray-500">{clienteVinculado.direccion}</p>
                  <p className="mt-1 text-sm font-medium text-red-600">
                    Deuda: ${clienteVinculado.saldo_actual.toLocaleString("es-AR")}
                  </p>
                </div>
                {resumenDomicilio && (
                  <p className="text-sm font-semibold text-blue-900">
                    Deuda total del domicilio: ${resumenDomicilio.saldo_total.toLocaleString("es-AR")}
                  </p>
                )}
                <Button color="danger" variant="flat" size="sm" isLoading={vinculando} onClick={handleDesvincular}>
                  Desvincular
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Buscar cliente a vincular"
                  placeholder="Nombre, teléfono o dirección..."
                  value={busquedaVinculo}
                  onChange={(e) => setBusquedaVinculo(e.target.value)}
                />
                {candidatosVinculo.length > 0 && (
                  <div className="overflow-y-auto max-h-40 space-y-2">
                    {candidatosVinculo.map((candidato) => (
                      <div
                        key={candidato.id}
                        className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
                      >
                        <div>
                          <p className="text-sm font-medium">{candidato.nombre}</p>
                          <p className="text-xs text-gray-500">{candidato.direccion}</p>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          isLoading={vinculando}
                          onClick={() => handleVincular(candidato.id)}
                        >
                          Vincular
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {mensajeVinculo && (
              <p className="mt-2 text-sm text-gray-700">{mensajeVinculo}</p>
            )}
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
