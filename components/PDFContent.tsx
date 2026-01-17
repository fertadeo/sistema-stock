import Image from 'next/image';
import { createPortal } from 'react-dom';

interface PDFContentProps {
  selectedRevendedorName: string;
  selectedDate: any;
  products: any[];
  formatDate: (date: any) => string;
  invoiceRef: React.RefObject<HTMLDivElement>;
}

const PDFContent = ({ selectedRevendedorName, selectedDate, products, formatDate, invoiceRef }: PDFContentProps) => {
  // Solo renderizar si estamos en el cliente
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={invoiceRef} style={{ position: 'fixed', left: '-9999px', top: 0 }}>
      <div className="p-6 bg-white">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="mb-4 w-[250px] h-[150px] relative">
              <Image 
                src="/images/soderialogo.png" 
                alt="Sodería Don Javier" 
                layout="responsive"
                width={250}
                height={150}
                objectFit="contain"
                priority
              />
            </div>
            <p className="font-bold"></p>
              Revendedor&nbsp;&nbsp;:&nbsp;&nbsp;
              <span style={{ whiteSpace: 'pre' }}>{selectedRevendedorName}</span>
      
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              <p>Gerónimo del Barco 2560</p>
              <p>Río Cuarto, Córdoba</p>
              <p>Tel: 3585602938</p>
            </div>
            <p className="text-gray-600">Fecha: {formatDate(selectedDate)}</p>
          </div>
        </div>

        <table className="mb-8 w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 font-semibold text-left text-gray-900">Producto</th>
              <th className="px-4 py-3 font-semibold text-center text-gray-900">Cajones</th>
              <th className="px-4 py-3 font-semibold text-center text-gray-900">Unidades</th>
              <th className="px-4 py-3 font-semibold text-center text-gray-900">Total Unid.</th>
              <th className="px-4 py-3 font-semibold text-right text-gray-900">Precio Unit.</th>
              <th className="px-4 py-3 font-semibold text-right text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {products.filter(p => p.quantity > 0).map(product => {
              const precio = Number(product.precioRevendedor) || 0;
              const cantidad = Number(product.quantity) || 0;
              const subtotal = precio * cantidad;
              return (
                <tr key={product.id} className="border-b border-gray-200">
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3 text-center">
                    {product.name?.toLowerCase().includes('soda') ? Math.floor(cantidad / 6) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.name?.toLowerCase().includes('soda') ? cantidad % 6 : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">{cantidad}</td>
                  <td className="px-4 py-3 text-right">${precio.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-3 text-right">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={5} className="px-4 py-3 text-right">Total General:</td>
              <td className="px-4 py-3 text-right">
                ${products.reduce((sum, product) => {
                  const precio = Number(product.precioRevendedor) || 0;
                  const cantidad = Number(product.quantity) || 0;
                  return sum + (precio * cantidad);
                }, 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="pt-4 mt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Gracias por su compra. Para consultas comunicarse al 3585602938.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PDFContent; 