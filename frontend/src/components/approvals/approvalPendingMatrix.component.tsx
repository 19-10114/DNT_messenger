import React from 'react';

import { cn } from '@/lib/utils';
import { ApprovalPendingMatrix as Matrix } from '@/services/approvals/types';
import { formatApprovalProduct } from './approvals.utils';

/**
 * Motos por recibir, sucursales × modelos. Solo aparecen las sucursales y los
 * modelos con algo pendiente, así que crece con lo que falta y no con el
 * catálogo. Primera columna fija y totales en ambos bordes; un cero se
 * muestra como "·" para que los números se lean de un vistazo.
 */
export function ApprovalPendingMatrix({
  matrix,
  isLoading,
}: {
  matrix: Matrix | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-md bg-gray-100" />;
  }
  if (!matrix || matrix.branches.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        Nada por recibir.
      </p>
    );
  }

  return (
    <div className="max-h-[32rem] overflow-auto rounded-md border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr>
            <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600">
              Sucursal
            </th>
            {matrix.products.map((column) => (
              <th
                key={column.product.id}
                className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600"
                title={formatApprovalProduct(column.product)}
              >
                {column.product.name}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold text-gray-900">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {matrix.branches.map((row) => (
            <tr key={row.branch.id} className="hover:bg-gray-50">
              <td className="sticky left-0 whitespace-nowrap bg-white px-3 py-1.5 font-medium text-gray-900">
                {row.branch.name}
              </td>
              {row.cells.map((value, index) => (
                <td
                  key={matrix.products[index].product.id}
                  className={cn(
                    'px-3 py-1.5 text-right tabular-nums',
                    value > 0 ? 'text-gray-900' : 'text-gray-300'
                  )}
                >
                  {value > 0 ? value : '·'}
                </td>
              ))}
              <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-amber-700">
                {row.total}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-gray-50">
          <tr>
            <td className="sticky left-0 bg-gray-50 px-3 py-2 font-semibold text-gray-900">
              Total
            </td>
            {matrix.products.map((column) => (
              <td
                key={column.product.id}
                className="px-3 py-2 text-right font-semibold tabular-nums"
              >
                {column.total}
              </td>
            ))}
            <td className="px-3 py-2 text-right font-bold tabular-nums text-amber-700">
              {matrix.total}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
