import React from 'react';
import { Button } from '@/components/ui/button.component';
import { usdFormatCurrency } from '@/lib/utils';
import { CashObjectItem } from '@/services/transactions/types/CashObjects.type';
import {
  canViewTransactionDetails,
  isCashWithdrawalObject,
  isExpenseObject,
  normalizeTypeLabel,
  parsePriceNumber,
} from '@/utils/debtObjects.utils';

interface CashObjectsTableProps {
  items: CashObjectItem[];
  totalCash: number;
  currentPage: number;
  totalPages: number;
  pageSize: string | number;
  onPrev: () => void;
  onNext: () => void;
  onChangePageSize: (size: string) => void;
  onView: (obj: CashObjectItem) => void;
}

export const CashObjectsTable: React.FC<CashObjectsTableProps> = ({
  items,
  totalCash,
  currentPage,
  totalPages,
  pageSize,
  onPrev,
  onNext,
  onChangePageSize,
  onView,
}) => {
  return (
    <div className="border rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Fecha
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Producto
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Monto
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Acción
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Tipo
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((obj) => (
              <tr key={`${obj.type}-${obj.id}`}>
                <td className="px-4 py-2 text-sm text-gray-800">
                  {new Date(obj.date).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-gray-800">
                  {obj.product}
                </td>
                <td
                  className={`px-4 py-2 text-sm ${
                    obj.adds ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {usdFormatCurrency(parsePriceNumber((obj as any).amount))}
                </td>
                <td
                  className={`px-4 py-2 text-sm ${
                    obj.adds ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {obj.adds ? 'Suma' : 'Resta'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-800">
                  {normalizeTypeLabel(obj.type)}
                </td>
                <td className="px-4 py-2 text-sm">
                  {(() => {
                    const viewable =
                      canViewTransactionDetails(obj.type) ||
                      isExpenseObject(obj.type) ||
                      isCashWithdrawalObject(obj.type);
                    return (
                      <Button
                        size="sm"
                        onClick={() => onView(obj)}
                        className={
                          viewable
                            ? 'bg-primary text-white hover:bg-primary/80'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }
                        disabled={!viewable}
                      >
                        {viewable ? 'Ver' : 'Próximamente'}
                      </Button>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
        <div className="text-sm text-gray-700">
          Total efectivo:{' '}
          <span className="font-semibold">{usdFormatCurrency(totalCash)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onPrev} disabled={currentPage <= 1}>
            Anterior
          </Button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <Button onClick={onNext} disabled={currentPage >= totalPages}>
            Siguiente
          </Button>
          <select
            className="px-2 py-1 border rounded-md text-sm"
            value={String(pageSize)}
            onChange={(e) => onChangePageSize(e.target.value)}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    </div>
  );
};
