"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import { Input, Pagination, Card, Alert, Select, SelectItem, Chip } from "@heroui/react";
import { SearchIcon } from "@heroui/shared-icons";
import ProductModal from "./productModal";
import { Product } from './productModal';
import { authFetch } from '@/lib/api/fetchWithAuth';
import { formatMonto, precioInputValue } from '@/lib/formatMonto';
import {
  TipoProducto,
  TIPOS_PRODUCTO,
  etiquetaTipoProducto,
  normalizarTipoProducto,
} from '@/types/productos';

type PriceField = 'precioPublico' | 'precioRevendedor';

type TableProductsProps = {
  userLevel: number;
};

type ProductRow = {
  id: number;
  nombreProducto: string;
  precioPublico: number;
  precioRevendedor: number;
  tipoProducto: TipoProducto;
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
  const { userLevel: _userLevel } = props;
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<ProductRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 13;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: number; field: PriceField } | null>(null);
  const [editValue, setEditValue] = useState("");
  const skipBlurSaveRef = useRef(false);
  const editValueRef = useRef("");
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!editingCell) return;
    const frame = requestAnimationFrame(() => {
      const label =
        editingCell.field === 'precioPublico' ? 'Precio público' : 'Precio revendedor';
      const input = document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
      if (input) {
        input.focus();
        // Cursor al final para poder editar dígitos sin borrar todo
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [editingCell]);

  const columns = [
    { name: "ID/SKU", uid: "id" },
    { name: "Producto", uid: "nombreProducto" },
    { name: "Tipo", uid: "tipoProducto" },
    { name: "Precio Público", uid: "precioPublico" },
    { name: "Precio Revendedor", uid: "precioRevendedor" }
  ];

  const toNumber = (value: unknown): number => {
    const num = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    return Number.isFinite(num) ? num : 0;
  };

  const fetchProducts = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos`);
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Error al obtener productos: ${errorMessage}`);
      }
      const data = await response.json();

      const updatedData: ProductRow[] = data.map((product: Product & { tipoProducto?: string }) => ({
        id: product.id,
        nombreProducto: product.nombreProducto,
        precioPublico: toNumber(product.precioPublico),
        precioRevendedor: toNumber(product.precioRevendedor),
        tipoProducto: normalizarTipoProducto(product.tipoProducto),
      }));

      setProducts(updatedData);
      setFilteredProducts(updatedData);
      setError(null);
    } catch {
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
      setCurrentPage(1);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleSave = (updatedProduct: Product) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === updatedProduct.id
          ? {
              id: updatedProduct.id,
              nombreProducto: updatedProduct.nombreProducto,
              precioPublico: toNumber(updatedProduct.precioPublico),
              precioRevendedor: toNumber(updatedProduct.precioRevendedor),
              tipoProducto: normalizarTipoProducto(updatedProduct.tipoProducto),
            }
          : product
      )
    );
  };
  
  const handleDelete = (productId: number) => {
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== productId)
    );
  };
  
  const handleToggle = (productId: number, enabled: boolean) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId ? { ...product, habilitado: enabled } as ProductRow : product
      )
    );
  };

  const showNotification = ({ type, message }: { type: 'success' | 'error'; message: string }) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const startEditing = (product: ProductRow, field: PriceField) => {
    const value = precioInputValue(product[field]);
    editValueRef.current = value;
    setEditingCell({ id: product.id, field });
    setEditValue(value);
  };

  const cancelEditing = () => {
    skipBlurSaveRef.current = true;
    setEditingCell(null);
    setEditValue("");
    editValueRef.current = "";
    requestAnimationFrame(() => {
      skipBlurSaveRef.current = false;
    });
  };

  const handlePriceEdit = async (productId: number, field: PriceField, newValue: string) => {
    try {
      const numericValue = Math.round(parseFloat(newValue || '0'));
      if (isNaN(numericValue) || numericValue < 0) {
        throw new Error('El precio debe ser un número válido mayor o igual a 0');
      }

      const current = products.find((p) => p.id === productId);
      if (current && Math.round(current[field]) === numericValue) {
        setEditingCell(null);
        setEditValue("");
        return true;
      }

      const updateData = { [field]: numericValue };

      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos/${productId}`, {
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

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, [field]: numericValue }
            : product
        )
      );

      showNotification({ type: 'success', message: 'Precio actualizado correctamente' });
      setEditingCell(null);
      setEditValue("");
      return true;
    } catch (error) {
      showNotification({ type: 'error', message: (error as Error).message });
      fetchProducts();
      return false;
    }
  };

  const handleTipoChange = async (productId: number, tipoProducto: TipoProducto) => {
    const current = products.find((p) => p.id === productId);
    if (!current || current.tipoProducto === tipoProducto) return;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, tipoProducto } : p))
    );

    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productos/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoProducto }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error al actualizar el tipo: ${errorData}`);
      }

      showNotification({ type: 'success', message: 'Tipo de producto actualizado' });
    } catch (error) {
      showNotification({ type: 'error', message: (error as Error).message });
      fetchProducts();
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      await handlePriceEdit(editingCell.id, editingCell.field, editValueRef.current);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
    // Flechas / Home / End: comportamiento nativo del input (mover cursor)
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const renderPriceCell = (product: ProductRow, field: PriceField) => {
    const isEditing = editingCell?.id === product.id && editingCell?.field === field;

    return (
      <td
        className="cursor-pointer px-3 py-2 align-middle"
        onClick={() => {
          if (!isEditing) startEditing(product, field);
        }}
      >
        {isEditing ? (
          <div className="flex items-center gap-1 rounded-lg border border-primary-300 bg-white px-2 py-1 shadow-sm">
            <span className="text-default-400 text-small select-none" aria-hidden="true">$</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={editValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                editValueRef.current = raw;
                setEditValue(raw);
              }}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (skipBlurSaveRef.current) return;
                handlePriceEdit(product.id, field, editValueRef.current);
              }}
              onWheel={handleWheel}
              aria-label={field === 'precioPublico' ? 'Precio público' : 'Precio revendedor'}
              className="w-full min-w-[4.5rem] bg-transparent text-right text-sm outline-none"
            />
          </div>
        ) : (
          formatMonto(product[field])
        )}
      </td>
    );
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

        <div className="overflow-x-auto rounded-lg border border-default-200">
          <table className="min-w-full text-sm" aria-label="Tabla de productos">
            <thead className="bg-default-100">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.uid}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-default-600"
                  >
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-t border-default-200 hover:bg-default-50">
                    <td className="px-3 py-2 align-middle">{product.id}</td>
                    <td className="px-3 py-2 align-middle">{product.nombreProducto}</td>
                    <td className="px-3 py-2 align-middle">
                      <Select
                        aria-label={`Tipo de ${product.nombreProducto}`}
                        selectedKeys={new Set([product.tipoProducto])}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0];
                          if (typeof selected === 'string') {
                            handleTipoChange(product.id, normalizarTipoProducto(selected));
                          }
                        }}
                        size="sm"
                        className="min-w-[160px]"
                        classNames={{
                          trigger: "h-8 min-h-8",
                        }}
                        renderValue={() => (
                          <Chip
                            size="sm"
                            variant="flat"
                            color={product.tipoProducto === 'insumo' ? 'warning' : 'primary'}
                          >
                            {etiquetaTipoProducto(product.tipoProducto)}
                          </Chip>
                        )}
                      >
                        {TIPOS_PRODUCTO.map((tipo) => (
                          <SelectItem key={tipo.value} textValue={tipo.label}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </td>
                    {renderPriceCell(product, 'precioPublico')}
                    {renderPriceCell(product, 'precioRevendedor')}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-default-500">
                    No hay productos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-default-400">
          Enter guarda · Esc cancela · usá las flechas para mover el cursor dentro del precio
        </p>
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
