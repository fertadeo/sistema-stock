import React, { useState, useEffect } from "react";
import { Modal,ModalContent,ModalHeader,ModalFooter,Button,Input,Checkbox,Spinner,} from "@heroui/react";
import Notification from "./notification";
import { authFetch, createApiUrl } from '@/lib/api/fetchWithAuth';



interface OneProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void; 
}

const OneProductModal: React.FC<OneProductModalProps> = ({ isOpen, onClose, onProductAdded }) => {
  const [discountEnabled, setDiscountEnabled] = useState(false);

  const [productData, setProductData] = useState({
    id: "",
    ProductoNombre: "",
    CantidadStock: "",
    Descripción: "",
    PrecioPublico: "",
    PrecioRevendedor: "",
    Descuento: "",


  });
  const [inputValidity, setInputValidity] = useState({
    ProductoNombre: true,
    PrecioPublico: true,
    PrecioRevendedor: true,
    CantidadStock: true,
    Descripción: true,
  });

  
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    description: '',
    type: 'success' as 'success' | 'error',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNextProductId();
    }
  }, [isOpen]);


  const fetchNextProductId = async () => {
    try {
      const response = await authFetch(createApiUrl('/api/productos/last-id/obtener'));
      if (!response.ok) throw new Error('Error al obtener el último ID de producto');
      const data = await response.json();
      const lastId = Number(data.ultimoId) || 0;
      setProductData((prevState) => ({
        ...prevState,
        id: String(lastId + 1),
      }));
    } catch (error) {
      console.error('Error fetching next product ID:', error);
      setProductData((prevState) => ({ ...prevState, id: '1' }));
    }
  };

  const handleDiscountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDiscountEnabled(event.target.checked);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setInputValidity((prevValidity) => ({
      ...prevValidity,
      [name]: value.trim() !== "" || name === "Descuento",
    }));
  };

  const validateInputs = () => {
    const newValidity = {
      ProductoNombre: productData.ProductoNombre.trim() !== "",
      PrecioPublico: productData.PrecioPublico.trim() !== "",
      PrecioRevendedor: productData.PrecioRevendedor.trim() !== "",
      CantidadStock: productData.CantidadStock.trim() !== "",
      Descripción: productData.Descripción.trim() !== "",
    };
    setInputValidity(newValidity);
    return Object.values(newValidity).every((valid) => valid);
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    setIsSaving(true);
    try {
      const productToSend = {
        nombreProducto: productData.ProductoNombre.trim(),
        cantidadStock: Number(productData.CantidadStock),
        descripcion: productData.Descripción.trim(),
        precioPublico: Number(productData.PrecioPublico),
        precioRevendedor: Number(productData.PrecioRevendedor),
      };

      const response = await authFetch(createApiUrl('/api/productos/crear-producto'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar producto');
      }

      const data = await response.json();
      if (data?.producto?.id) {
        setProductData((prevState) => ({
          ...prevState,
          id: String(data.producto.id),
        }));
      }

      setNotification({
        isVisible: true,
        message: 'Producto agregado correctamente',
        description: data?.producto?.id ? `ID asignado: ${data.producto.id}` : '',
        type: 'success',
      });
      setTimeout(handleNotificationClose, 3000);
      onProductAdded();
      setIsSaving(false);
      onClose();
    } catch (error) {
      console.error('Error al enviar producto:', error);
      setNotification({
        isVisible: true,
        message: 'Ocurrió un error',
        description: error instanceof Error ? error.message : 'No se pudo agregar tu producto.',
        type: 'error',
      });
      setTimeout(handleNotificationClose, 3000);
      setIsSaving(false);
    }
  };


  const handleNotificationClose = () => {
    setNotification((prevState) => ({ ...prevState, isVisible: false }));
  };

  return (
    <Modal size={"2xl"} isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Cargar un producto</ModalHeader>
            <div className="flex flex-col gap-4 m-6">
              <div className="flex flex-wrap w-full gap-4 mb-6 md:flex-nowrap md:mb-0">
                <Input
                  label="ID/SKU"
                  placeholder="ID Producto Nuevo"
                  name="id"
                  value={productData.id}
                  readOnly
                  labelPlacement="inside"
                />
       </div>
       <div className="flex flex-wrap w-full gap-4 mb-6 md:flex-nowrap md:mb-0">
                <Input
                  label="Nombre del Producto"
                  placeholder="Nombre del producto"
                  name="ProductoNombre"
                  value={productData.ProductoNombre}
                  onChange={handleInputChange}
                  isInvalid={!inputValidity.ProductoNombre}
                  labelPlacement="inside"

                />
</div>
<div className="flex flex-wrap w-full gap-4 mb-6 md:flex-nowrap md:mb-0">
                 <Input
                  label="Descripción"
                  placeholder="Descripción del producto"
                  name="Descripción"
                  value={productData.Descripción}
                  onChange={handleInputChange}
                  labelPlacement="inside"
                />
       </div>

              <div className="flex flex-wrap w-full gap-4 mb-6 md:flex-nowrap md:mb-0">

                <Input
                  type="number"
                  label="Precio de Venta al publico"
                  placeholder="0.00"
                  name="PrecioPublico"
                  value={productData.PrecioPublico}
                  onChange={handleInputChange}

                  labelPlacement="inside"

                  startContent={
                    <div className="flex items-center pointer-events-none">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  }
                />
              </div>

              <div className="flex flex-wrap w-full gap-4 mb-6 md:flex-nowrap md:mb-0">
                <Input
                  label="Precio Revendedor"
                  placeholder="$0.00 "
                  name="PrecioRevendedor"
                  value={productData.PrecioRevendedor}
                  onChange={handleInputChange}
                  labelPlacement="inside"

                />
              </div>

              <div className="flex flex-wrap w-full gap-4 mb-6 md:flex-nowrap md:mb-0">
                <Input
                  type="number"
                  label="Stock Ingresante"
                  placeholder="Cantidad"
                  name="CantidadStock"
                  value={productData.CantidadStock}
                  onChange={handleInputChange}
                  labelPlacement="inside"

                />

            
              </div>

              <div className="hidden flex-wrap items-center w-full gap-4 mb-6 md:flex-nowrap md:mb-0">
                <Checkbox isSelected={discountEnabled} onChange={handleDiscountChange}>
                  ¿Aplicar descuento?
                </Checkbox>


                <Input
                  type="number"
                  label="Porcentaje de Descuento"
                  placeholder="0"
                  name="Descuento"
                  value={productData.Descuento}
                  onChange={handleInputChange}
                  labelPlacement="inside"
                  disabled={!discountEnabled}
                  startContent={
                    <div className="flex items-center pointer-events-none">
                      <span className="text-default-400 text-small">%</span>
                    </div>
                  }
                />
              </div>

            
            </div>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cerrar
              </Button>
              <Button color="primary" onPress={handleSubmit} isDisabled={isSaving}>
                {isSaving ? <Spinner size="sm" color="default"/> : "Guardar Producto"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
      <Notification
        message={notification.message}
        description={notification.description}
        isVisible={notification.isVisible}
        onClose={handleNotificationClose}
        type={notification.type}
      />
    </Modal>
  );
};

export default OneProductModal;
