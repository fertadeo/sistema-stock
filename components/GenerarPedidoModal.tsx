import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Input,
} from "@nextui-org/react";
import abacoRoller from './utils/abacos/roller.json';
import { RollerDetailForm } from "./forms/RollerDetailForm";

interface Sistema {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface Client {
  nombre: string;
  direccion?: string;
  telefono?: string;
}

interface GenerarPedidoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedClient: Client | null;
  productos: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  onPedidoCreated: (pedido: any) => void;
}

// Actualizar la interfaz para el JSON
interface SistemaRoller {
  ancho: number;
  alto: number;
  sistema: string;
  garantia?: string;
}

interface AbacoRoller {
  sistemas: SistemaRoller[];
}

// Función para determinar el sistema
const determinarSistemaRoller = (ancho: number, alto: number): string => {
  const sistemas = (abacoRoller as AbacoRoller).sistemas;

  // Ordenar los sistemas por ancho y alto
  const sortedSistemas = sistemas.sort((a, b) => {
    if (a.ancho === b.ancho) {
      return a.alto - b.alto;
    }
    return a.ancho - b.ancho;
  });

  for (const sistema of sortedSistemas) {
    if (sistema.ancho >= ancho && sistema.alto >= alto) {
      return sistema.sistema;
    }
  }
  
  return "No hay sistema disponible para estas medidas";
};

// Agregar esta función helper antes del componente principal
const getUniqueSistemas = (sistemas: SistemaRoller[]): string[] => {
  return Array.from(new Set(sistemas.map(sistema => sistema.sistema)));
};

// Agregar cerca de la parte superior del archivo, antes del componente
const MOCK_TELAS = [
  {
    id: 1,
    nombre: "Screen 5% White/Pearl",
    tipo: "Screen",
    color: "Blanco/Perla",
    precio: 15000
  },
  {
    id: 2,
    nombre: "Screen 3% Black/Grey",
    tipo: "Screen",
    color: "Negro/Gris",
    precio: 16500
  },
  {
    id: 3,
    nombre: "Blackout Premium White",
    tipo: "Blackout",
    color: "Blanco",
    precio: 18000
  },
  {
    id: 4,
    nombre: "Blackout Premium Beige",
    tipo: "Blackout",
    color: "Beige",
    precio: 18000
  },
  {
    id: 5,
    nombre: "Sunscreen 10% Ivory",
    tipo: "Sunscreen",
    color: "Marfil",
    precio: 17000
  },
  {
    id: 6,
    nombre: "Sunscreen 10% Grey",
    tipo: "Sunscreen",
    color: "Gris",
    precio: 17000
  }
];

export default function GenerarPedidoModal({
  isOpen,
  onOpenChange,
  selectedClient,
  productos,
  total,
  onPedidoCreated
}: GenerarPedidoModalProps) {
  // Estado para controlar el paso actual
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estados del primer paso
  const [selectedSistema, setSelectedSistema] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("1");
  const [ancho, setAncho] = useState<string>("");
  const [alto, setAlto] = useState<string>("");
  const [selectedArticulo, setSelectedArticulo] = useState<string>("");
  
  // Estados específicos de Roller
  const [detalle, setDetalle] = useState("");
  const [caidaPorDelante, setCaidaPorDelante] = useState(false);
  const [colorSistema, setColorSistema] = useState("");
  const [ladoComando, setLadoComando] = useState("");
  const [tipoTela, setTipoTela] = useState("");
  const [soporteIntermedio, setSoporteIntermedio] = useState(false);
  const [soporteDoble, setSoporteDoble] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);

  const [sistemaRecomendado, setSistemaRecomendado] = useState<string>("");
  const [pedidoJSON, setPedidoJSON] = useState<string>("");

  // Agregar nuevos estados para el buscador de telas
  const [searchTela, setSearchTela] = useState("");
  const [telasFiltradas, setTelasFiltradas] = useState<Array<{
    id: number;
    nombre: string;
    tipo: string;
    color: string;
    precio: number;
  }>>([]);
  const [selectedTela, setSelectedTela] = useState<string>("");
  const [showTelasList, setShowTelasList] = useState(false);

  // Define state to hold calculated prices
  const [precioSistema, setPrecioSistema] = useState(0);
  const [precioTela, setPrecioTela] = useState(0);

  const resetInputs = () => {
    setCurrentStep(1);
    setSelectedSistema("");
    setCantidad("1");
    setAncho("");
    setAlto("");
    setSelectedArticulo("");
    setDetalle("");
    setCaidaPorDelante(false);
    setColorSistema("");
    setLadoComando("");
    setTipoTela("");
    setSoporteIntermedio(false);
    setSoporteDoble(false);
    setSearchTela("");
    setTelasFiltradas([]);
    setSelectedTela("");
    setShowTelasList(false);
  };

  // Validar si podemos pasar al siguiente paso
  const canProceedToNextStep = () => {
    return selectedSistema && cantidad && ancho && alto && selectedArticulo;
  };

  const handleClose = () => {
    if (selectedSistema || cantidad !== "1" || ancho !== "0" || alto !== "0" || selectedArticulo) {
      setShowConfirmModal(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    onOpenChange(false);
  };

  useEffect(() => {
    const fetchSistemas = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sistemas`);
        if (!response.ok) throw new Error('Error al cargar sistemas');
        const data = await response.json();
        setSistemas(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchSistemas();
    }
  }, [isOpen]);

  // Actualizar el useEffect
  useEffect(() => {
    if (selectedSistema === "ROLLER" && ancho !== "" && alto !== "" && ancho !== "0" && alto !== "0") {
      // Convertir ancho y alto de cm a m
      const anchoEnMetros = Number(ancho) / 100;
      const altoEnMetros = Number(alto) / 100;
      
      const sistema = determinarSistemaRoller(anchoEnMetros, altoEnMetros);
      setSistemaRecomendado(sistema);
      setSelectedArticulo(sistema);
    } else {
      setSistemaRecomendado("");
      setSelectedArticulo("");
    }
  }, [ancho, alto, selectedSistema]);

  // Agregar función de búsqueda de telas
  const handleTelaSearch = async (value: string) => {
    setSearchTela(value);
    setShowTelasList(true);

    if (!value.trim()) {
      setTelasFiltradas([]);
      setShowTelasList(false);
      return;
    }

    // Simular búsqueda local
    const searchTerms = value.toLowerCase().split(' ');
    const filtered = MOCK_TELAS.filter(tela => {
      const searchString = `${tela.nombre} ${tela.tipo} ${tela.color}`.toLowerCase();
      return searchTerms.every(term => searchString.includes(term));
    });
    
    setTelasFiltradas(filtered);
  };

  // Update the calcularPrecioTotal function to set these values
  const calcularPrecioTotal = () => {
    if (!ancho || !alto || !cantidad || !selectedTela) return 0;

    const anchoMetros = Number(ancho) / 100; // Convert to meters
    const precioSistemaPorMetro = 12000; // Example price
    const telaSeleccionada = MOCK_TELAS.find(t => t.nombre === selectedTela);
    const precioTelaPorMetro = telaSeleccionada ? telaSeleccionada.precio : 0;

    const nuevoPrecioSistema = precioSistemaPorMetro * anchoMetros;
    const nuevoPrecioTela = precioTelaPorMetro * anchoMetros;

    setPrecioSistema(nuevoPrecioSistema);
    setPrecioTela(nuevoPrecioTela);

    const costoColocacion = 5000; // Fixed cost
    return (nuevoPrecioSistema + nuevoPrecioTela + costoColocacion) * Number(cantidad);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          resetInputs();
        }
        onOpenChange(open);
      }}
      size="5xl"
    >
      <ModalContent>
        {(onClose) => {
          const handleGenerarPedido = () => {
            if (!selectedClient) return;
            
            const pedido = {
              sistema: selectedSistema,
              detalles: {
                cantidad: parseFloat(cantidad),
                ancho: Number(ancho),
                alto: Number(alto),
                sistemaRecomendado,
                articuloSeleccionado: selectedArticulo,
                tela: selectedTela,
                caidaPorDelante,
                colorSistema,
                ladoComando,
                tipoTela,
                soporteIntermedio,
                soporteDoble,
                detalle
              },
              fecha: new Date().toISOString(),
              precioTotal: calcularPrecioTotal()
            };

            // Agregar console.log detallado
            console.log('=== DETALLE DEL PEDIDO ===');
            console.log('Cliente:', selectedClient.nombre);
            console.log('Sistema:', selectedSistema);
            console.log('Medidas:', `${ancho}cm x ${alto}cm`);
            console.log('Sistema recomendado:', sistemaRecomendado);
            console.log('Cantidad:', cantidad);
            console.log('Tela seleccionada:', selectedTela);
            console.log('Detalles de instalación:', {
              'Caída por delante': caidaPorDelante ? 'Sí' : 'No',
              'Color del sistema': colorSistema,
              'Lado del comando': ladoComando,
              'Tipo de tela': tipoTela,
              'Soporte intermedio': soporteIntermedio ? 'Sí' : 'No',
              'Soporte doble': soporteDoble ? 'Sí' : 'No'
            });
            console.log('Observaciones:', detalle || 'Sin observaciones');
            console.log('Precio total:', `$${calcularPrecioTotal().toLocaleString()}`);
            console.log('========================');

            setPedidoJSON(JSON.stringify(pedido, null, 2));
            onPedidoCreated(pedido);
            onClose();
          };

          return (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Generar Pedido
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  {/* Primer paso */}
                  <div className="space-y-4">
                    <Select
                      label="Seleccionar Sistema"
                      placeholder="Elegir un sistema"
                      selectedKeys={selectedSistema ? [selectedSistema] : []}
                      onSelectionChange={(keys) => setSelectedSistema(Array.from(keys)[0] as string)}
                    >
                      <SelectItem key="ROLLER">ROLLER</SelectItem>
                    </Select>

                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        type="number"
                        label="Cantidad"
                        value={cantidad}
                        onValueChange={setCantidad}
                        variant="bordered"
                        size="sm"
                      />
                      <Input
                        type="number"
                        label="Ancho (cm)"
                        value={ancho}
                        onValueChange={setAncho}
                        variant="bordered"
                        size="sm"
                        placeholder="0"
                      />
                      <Input
                        type="number"
                        label="Alto (cm)"
                        value={alto}
                        onValueChange={setAlto}
                        variant="bordered"
                        size="sm"
                        placeholder="0"
                      />
                    </div>

                    <Select
                      label="Artículo"
                      selectedKeys={selectedArticulo ? [selectedArticulo] : []}
                      onSelectionChange={(keys) => setSelectedArticulo(Array.from(keys)[0] as string)}
                    >
                      {getUniqueSistemas((abacoRoller as AbacoRoller).sistemas).map((sistema) => (
                        <SelectItem key={sistema} value={sistema}>
                          {sistema}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Segundo paso - aparece cuando se completan los campos del primer paso */}
                  {canProceedToNextStep() && selectedSistema === "ROLLER" && (
                    <div className="pt-4 mt-4 border-t">
                      <RollerDetailForm
                        detalle={detalle}
                        caidaPorDelante={caidaPorDelante}
                        colorSistema={colorSistema}
                        ladoComando={ladoComando}
                        tipoTela={tipoTela}
                        soporteIntermedio={soporteIntermedio}
                        soporteDoble={soporteDoble}
                        onDetalleChange={setDetalle}
                        onCaidaChange={setCaidaPorDelante}
                        onColorChange={setColorSistema}
                        onLadoComandoChange={setLadoComando}
                        onTipoTelaChange={setTipoTela}
                        onSoporteIntermedioChange={setSoporteIntermedio}
                        onSoporteDobleChange={setSoporteDoble}
                      />
                    </div>
                  )}

                  {/* Tercer paso - Buscador de telas */}
                  {canProceedToNextStep() && selectedSistema === "ROLLER" && (
                    <div className="pt-4 mt-4 border-t">
                      <div className="relative">
                        <Input
                          label="Buscar Tela"
                          placeholder="Escribe para buscar telas..."
                          value={searchTela}
                          onValueChange={handleTelaSearch}
                          variant="bordered"
                          className="mb-2"
                        />
                        
                        {showTelasList && telasFiltradas.length > 0 && (
                          <div className="overflow-auto absolute z-50 w-full max-h-60 bg-white rounded-lg border shadow-lg">
                            {telasFiltradas.map((tela) => (
                              <button
                                key={tela.id}
                                className="p-3 w-full text-left border-b hover:bg-gray-50 last:border-b-0"
                                onClick={() => {
                                  setSelectedTela(tela.nombre);
                                  setSearchTela(tela.nombre);
                                  setShowTelasList(false);
                                }}
                                
                                tabIndex={0}
                              >
                                <div className="font-medium">{tela.nombre}</div>
                                <div className="text-sm text-gray-600">
                                  <span className="mr-2">Tipo: {tela.tipo}</span>
                                  <span className="mr-2">Color: {tela.color}</span>
                                  <span>Precio: ${tela.precio}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {showTelasList && searchTela && telasFiltradas.length === 0 && (
                          <div className="absolute z-50 p-3 w-full text-center text-gray-500 bg-white rounded-lg border">
                            No se encontraron telas
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cuarto paso - Resumen de precios */}
                  {canProceedToNextStep() && selectedSistema === "ROLLER" && (
                    <div className="pt-4 mt-4 border-t">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Resumen de Precios</h3>
                        {selectedTela && ancho && alto && cantidad && (
                          <>
                            <div className="flex justify-between items-center">
                              <span>Metros cuadrados:</span>
                              <span>{((Number(ancho) / 100) * (Number(alto) / 100)).toFixed(2)} m²</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Precio sistema:</span>
                              <span>${precioSistema.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Precio tela:</span>
                              <span>${precioTela.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Cantidad:</span>
                              <span>{cantidad}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span>Total:</span>
                              <span>${calcularPrecioTotal().toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleGenerarPedido}
                  isDisabled={!selectedSistema || !cantidad || !ancho || !alto || !selectedArticulo}
                >
                  Generar Pedido
                </Button>
              </ModalFooter>
            </>
          );
        }}
      </ModalContent>
    </Modal>
  );
}