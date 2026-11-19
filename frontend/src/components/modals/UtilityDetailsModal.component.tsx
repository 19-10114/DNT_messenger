'use client';

import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { SearchType } from '@/services/transactions/types/SalesReport.type';

interface ProductDetail {
  name: string;
  utility: number;
  boughtQuantity: number;
  boughtAmount: number;
  soldQuantity: number;
  soldAmount: number;
  beginningInventory: number;
  endingInventory: number;
}

interface UtilityDetailsModalProps {
  token: string | undefined;
  startDate: string;
  endDate: string;
  branchName: string;
  branchId: number;
  searchType: SearchType;
  selectedProducts: string[];
  selectedModels: string[];
  products: ProductDetail[];
  isOpen: boolean;
  onClose: () => void;
}

const UtilityDetailsModal: React.FC<UtilityDetailsModalProps> = ({
  startDate,
  endDate,
  branchName,
  branchId,
  searchType,
  selectedProducts,
  selectedModels,
  products,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calcular totales
  const totals = useMemo(() => {
    let totalUtility = 0;
    let totalSoldQuantity = 0;
    let totalSoldAmount = 0;
    let totalBoughtQuantity = 0;
    let totalBoughtAmount = 0;
    let totalBeginningInventory = 0;
    let totalEndingInventory = 0;

    products.forEach((product) => {
      const utility = Number(product.utility) || 0;
      const soldQty = Number(product.soldQuantity) || 0;
      const soldAmt = Number(product.soldAmount) || 0;
      const boughtQty = Number(product.boughtQuantity) || 0;
      const boughtAmt = Number(product.boughtAmount) || 0;
      const beginningInv = Number(product.beginningInventory) || 0;
      const endingInv = Number(product.endingInventory) || 0;

      totalUtility += utility;
      totalSoldQuantity += soldQty;
      totalSoldAmount += soldAmt;
      totalBoughtQuantity += boughtQty;
      totalBoughtAmount += boughtAmt;
      totalBeginningInventory += beginningInv;
      totalEndingInventory += endingInv;
    });

    return {
      totalUtility,
      totalSoldQuantity,
      totalSoldAmount,
      totalBoughtQuantity,
      totalBoughtAmount,
      totalBeginningInventory,
      totalEndingInventory,
    };
  }, [products]);

  // Filtrar productos por búsqueda y por productos seleccionados
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtrar por productos seleccionados
      if (
        selectedProducts.length > 0 &&
        !selectedProducts.includes(product.name)
      ) {
        return false;
      }
      // Filtrar por término de búsqueda
      if (
        searchTerm &&
        !product.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [products, selectedProducts, searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Detalles de Utilidad - {branchName} (
            {searchType === 'bikes' ? 'Motos' : 'Repuestos'})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de filtros */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Filtros aplicados:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Período:</span>{' '}
                <span className="text-gray-800">
                  {startDate} - {endDate}
                </span>
              </div>
              {searchType === 'parts' && (
                <div>
                  <span className="font-medium text-gray-600">Modelos:</span>{' '}
                  {selectedModels.length > 0 ? (
                    <span className="inline-flex flex-wrap gap-1">
                      {selectedModels.map((prod, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs"
                        >
                          {prod}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-gray-500">Todos los modelos</span>
                  )}
                </div>
              )}
              <div>
                <span className="font-medium text-gray-600">Productos:</span>{' '}
                {selectedProducts.length > 0 ? (
                  <span className="inline-flex flex-wrap gap-1">
                    {selectedProducts.map((prod, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs"
                      >
                        {prod}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-500">Todos los productos</span>
                )}
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredProducts.length} de {products.length} productos
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Utilidad ($)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Cantidad Comprada
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Monto Comprado ($)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Cantidad Vendida
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Monto Vendido ($)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Inventario Inicial
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Inventario Final
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product, index) => {
                  const utility = Number(product.utility) || 0;
                  const utilityClass =
                    utility >= 0 ? 'text-green-600' : 'text-red-600';

                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right ${utilityClass} font-medium`}
                      >
                        {utility.toLocaleString('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {Number(product.boughtQuantity) || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {(Number(product.boughtAmount) || 0).toLocaleString(
                          'es-CO',
                          {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {Number(product.soldQuantity) || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {(Number(product.soldAmount) || 0).toLocaleString(
                          'es-CO',
                          {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {(
                          Number(product.beginningInventory) || 0
                        ).toLocaleString('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {(Number(product.endingInventory) || 0).toLocaleString(
                          'es-CO',
                          {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 sticky bottom-0 border-t-2 border-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    TOTAL
                  </td>
                  <td
                    className={`px-4 py-3 text-sm font-bold text-right ${totals.totalUtility >= 0 ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {totals.totalUtility.toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                    {totals.totalBoughtQuantity}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                    {totals.totalBoughtAmount.toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                    {totals.totalSoldQuantity}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                    {totals.totalSoldAmount.toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                    {totals.totalBeginningInventory.toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                    {totals.totalEndingInventory.toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mensaje si no hay datos */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {searchTerm
                  ? 'No se encontraron productos que coincidan con la búsqueda'
                  : 'No hay productos en este período'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UtilityDetailsModal;
