"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Pagination, Card, Alert } from "@heroui/react";
import { FaEye } from "react-icons/fa";
import ProductModal from "./productModal";
import { SearchIcon } from "@heroui/shared-icons";
import { Product } from './productModal';
import { uid } from "chart.js/dist/helpers/helpers.core";



type TableProductsProps = {
  userLevel: number; // Nivel del usuario (1: empleado, 2: dueño, 3: programador)
};

const Notification = ({ type, message, onClose }: { 
  type: 'success' | 'error', 
  message: string, 
  onClose: () => void 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Alert 
        color={type === 'success' ? 'success' : 'danger'}
        title={message}
        onClose={onClose}
      />
    </div>
  );
};

const TableProducts = forwardRef((props: TableProductsProps, ref) => {
  const { userLevel } = props;
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 13;
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{id: number, field: string} | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Configuración de columnas según nivel de usuario
  const columns = [
    { name: "ID/SKU", uid: "id" },
    { name: "Producto", uid: "nombreProducto" },
    { name: "Precio Público", uid: "precioPublico" },
    { name: "Precio Revendedor", uid: "precioRevendedor" }
  ];

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`);
      if (!response.ok) {
        const errorMessage = await response.text(); // Get the error message from the response
        throw new Error(`Error al obtener productos: ${errorMessage}`);
      }
      const data = await response.json();
      console.log('API Response:', data); // Log the response to check its structure

      const updatedData = data.map((product: Product) => {
        const precioPublico = product.precioPublico;
        const precioRevendedor = product.precioRevendedor;


        return {
          id: product.id,
          nombreProducto: product.nombreProducto,
          precioPublico: !isNaN(precioPublico) ? precioPublico.toFixed(2) : "0.00", // Handle null or invalid values
          precioRevendedor: !isNaN(precioRevendedor) ? precioRevendedor.toFixed(2) : "0.00" // Handle null or invalid values
        };
      });


      setProducts(updatedData);
      setFilteredProducts(updatedData);
      setError(null);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError('Error al cargar los productos. Por favor, intente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshProducts: fetchProducts,
  }));

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter((product) =>
        product.nombreProducto.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      setCurrentPage(1); // Nuevo: reset a página 1
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const getCantidadStyle = (cantidad: number) => {
    if (cantidad > 5) return { color: "green" };
    if (cantidad >= 1 && cantidad <= 5) return { color: "orange" };
    return { color: "red" };
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };


  const handleSave = (updatedProduct: Product) => {
    // Lógica para guardar un producto actualizado
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  };
  
  const handleDelete = (productId: number) => {
    // Lógica para eliminar un producto
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== productId)
    );
  };
  
  const handleToggle = (productId: number, enabled: boolean) => {
    // Lógica para habilitar/deshabilitar un producto
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId ? { ...product, habilitado: enabled } : product
      )
    );
  };

  const handlePriceEdit = async (productId: number, field: string, newValue: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Validar que el valor sea un número válido
      const numericValue = parseFloat(newValue);
      if (isNaN(numericValue) || numericValue < 0) {
        throw new Error('El precio debe ser un número válido mayor o igual a 0');
      }

      // Preparar los datos en el formato requerido
      const updateData = {
        [field]: numericValue  // Ejemplo: { "precioPublico": 100 }
      };

      // Realizar la petición PUT
      const response = await fetch(`${apiUrl}/api/productos/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error al actualizar el precio: ${errorData}`);
      }

      // Actualizar el estado local
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, [field]: numericValue.toFixed(2) }
          : product
      ));

      showNotification({ type: 'success', message: 'Precio actualizado correctamente' });
      setEditingCell(null);

    } catch (error) {
      console.error('Error updating price:', error);
      showNotification({ type: 'error', message: (error as Error).message });
      fetchProducts();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, productId: number, field: string, value: string) => {
    if (e.key === 'Enter') {
      handlePriceEdit(productId, field, value);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const showNotification = ({ type, message }: { type: 'success' | 'error'; message: string }) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500); // Auto-cierre después de 3 segundos
  };

  if (loading) return <div>Cargando productos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      <Card className="p-4">
        <div className="flex justify-between mb-5">
          <Input
            placeholder="Buscar producto"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={
              <SearchIcon className="flex-shrink-0 pointer-events-none text-default-400" />
            }
          />
        </div>

        <Table aria-label="Tabla de productos">
          <TableHeader>
            {columns.map((column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.nombreProducto}</TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => setEditingCell({ id: product.id, field: 'precioPublico' })}
                  >
                    {editingCell?.id === product.id && editingCell?.field === 'precioPublico' ? (
                      <Input
                        type="number"
                        value={product.precioPublico.toString()}
                        onChange={(e) => {
                          const newProducts = products.map(p => 
                            p.id === product.id 
                              ? { ...p, precioPublico: parseFloat(e.target.value) }
                              : p
                          );
                          setProducts(newProducts);
                        }}
                        onKeyDown={(e) => handleKeyPress(e, product.id, 'precioPublico', product.precioPublico.toString())}
                        onBlur={() => handlePriceEdit(product.id, 'precioPublico', product.precioPublico.toString())}
                      />

                    ) : (
                      product.precioPublico
                    )}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => setEditingCell({ id: product.id, field: 'precioRevendedor' })}
                  >
                    {editingCell?.id === product.id && editingCell?.field === 'precioRevendedor' ? (
                      <Input
                        type="number"
                        value={product.precioRevendedor}
                        onChange={(e) => {
                          const newProducts = products.map(p => 
                            p.id === product.id 
                              ? { ...p, precioRevendedor: e.target.value }
                              : p
                          );
                          setProducts(newProducts);
                        }}
                        onKeyDown={(e) => handleKeyPress(e, product.id, 'precioRevendedor', product.precioRevendedor.toString())}
                        onBlur={() => handlePriceEdit(product.id, 'precioRevendedor', product.precioRevendedor.toString())}
                      />

                    ) : (
                      product.precioRevendedor
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} style={{ textAlign: "center" }}>
                  No hay productos disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Pagination
        initialPage={1}
        page={currentPage}
        onChange={handlePageChange}
        total={Math.ceil(filteredProducts.length / itemsPerPage)}
        className="flex justify-center mt-5"
      />

      <ProductModal
        product={selectedProduct}
        onSave={handleSave}
        onDelete={handleDelete}
        onToggle={handleToggle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});

TableProducts.displayName = "TableProducts";

export default TableProducts;
