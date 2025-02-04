// src/components/ProductModal.tsx
"use client";

import React, { useState, useEffect, ReactNode } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem
} from "@heroui/react";
import { FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import EditableField from "./EditableField";


export type Product = {
  id: number;
  precioRevendedor: any;
  precioPublico: number;
  nombreProducto: string;
};

type Proveedor = {
  id: number;
  nombreProveedores: string;
};

type ProductModalProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete: (productId: number) => void;
  onToggle: (productId: number, enabled: boolean) => void;
};

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  onDelete,
  // onToggle,
}) => {
  if (!product) return null;
  // const [editedProduct, setEditedProduct] = useState<Product | null>(product);
  // const [proveedores, setProveedores] = useState<Proveedor[]>([]);
// Estados iniciales definidos correctamente
/* eslint-disable */
const [editedProduct, setEditedProduct] = useState<Product | null>(null);
const [proveedores, setProveedores] = useState<Proveedor[]>([]);
/* eslint-enable */

// Sincronizar el producto editado con el estado cuando cambien las props
/* eslint-disable */
useEffect(() => {
  setEditedProduct(product || null); // Asegúrate de manejar el caso en el que product sea null o undefined
}, [product]);


// Efecto para cargar proveedores al montar el componente
useEffect(() => {
  const fetchProveedores = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/proveedores`);
      if (!response.ok) throw new Error("Error al obtener proveedores");
      const data = await response.json();
      setProveedores(data);
    } catch (error) {
      console.error("Error fetching proveedores:", error);
    }
  };

  fetchProveedores(); // Llamada a la función
}, []); // Solo se ejecuta al montar el componente

/* eslint-enable */
  const handleSaveChanges = async () => {
    if (editedProduct) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/productos/${editedProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedProduct),
        });

        if (!response.ok) {
          throw new Error("Error al actualizar el producto");
        }

        const updatedProduct = await response.json();
        onSave(updatedProduct);
      } catch (error) {
        console.error("Error al guardar los cambios:", error);
      }
    }
  };

  const handleDelete = () => {
    if (editedProduct) {
      onDelete(editedProduct.id);
    }
  };

  const handleToggle = (productId: number, enabled: boolean) => {
    setProducts((prevProducts) =>
      prevProducts.map((product: { id: number; }) =>
        product.id === productId ? { ...product, habilitado: enabled } : product
      )
    );
  };
  

  const handleProveedorChange = (value: string) => {
    const selectedProveedor = proveedores.find(
      (p) => p.nombreProveedores === value
    );
    if (selectedProveedor) {
      setEditedProduct((prevProduct) =>
        prevProduct ? { ...prevProduct, proveedor: selectedProveedor } : prevProduct
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <h2>
            {editedProduct ? editedProduct.nombreProducto : "Detalles del Producto"}
          </h2>
        </ModalHeader>
        <ModalBody>
          {editedProduct && (
            <div>
              <EditableField
                label="ID/SKU"
                value={editedProduct.id}
                onChange={() => { }}
                isEditable={false}
              />
              <EditableField
                label="Producto"
                value={editedProduct.nombreProducto}
                onChange={(value) =>
                  setEditedProduct({
                    ...editedProduct,
                    nombreProducto: value.toString(),
                  })
                }
              />
             


             
              <EditableField
                label="Precio"
                value={editedProduct.precioPublico}
                onChange={(value) =>
                  setEditedProduct({
                    ...editedProduct,
                    precioPublico: Number(value),
                  })
                }

                type="number"
              />
              <EditableField
                label="Precio Revendedor"
                value={editedProduct.precioRevendedor}

                onChange={(value) =>
                  setEditedProduct({
                    ...editedProduct,
                    precioRevendedor: Number(value),
                  })

                }
                type="number"
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" color="danger" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="solid" color="primary" onClick={handleSaveChanges}>
            Guardar Cambios
          </Button>
          {/* <Button
            variant="flat"
            color={editedProduct?.habilitado ? "warning" : "success"}
            onClick={handleToggle}
          > */}
            {/* {editedProduct?.habilitado ? "Deshabilitar" : "Habilitar"}
            {editedProduct?.habilitado ? (
              <FaToggleOff style={{ marginLeft: "5px" }} />
            ) : (
              <FaToggleOn style={{ marginLeft: "5px" }} />
            )}
          </Button> */}
        
              {/* <FaTrash style={{ marginRight: "5px" }} />
              Eliminar
            </Button>
          )} */}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductModal;
function setProducts(arg0: (prevProducts: any) => any) {
  throw new Error("Function not implemented.");
}

