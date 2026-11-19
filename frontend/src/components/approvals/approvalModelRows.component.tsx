import React from 'react';

import { cn } from '@/lib/utils';
import { ApprovalLine } from '@/services/approvals/types';
import { formatApprovalProduct } from './approvals.utils';

/**
 * Las líneas (sucursal, modelo) agrupadas por modelo: una fila por modelo con
 * su total y una pastilla por sucursal, "recibidas/aprobadas".
 */
export function ApprovalModelRows({ lines }: { lines: ApprovalLine[] }) {
  const groups = new Map<number, ApprovalLine[]>();
  lines.forEach((line) => {
    groups.set(line.product.id, [...(groups.get(line.product.id) ?? []), line]);
  });

  if (groups.size === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        La aprobación no tiene modelos.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {Array.from(groups.values()).map((group) => {
        const approved = group.reduce((sum, line) => sum + line.quantity, 0);
        const received = group.reduce(
          (sum, line) => sum + line.receivedQuantity,
          0
        );
        const remaining = group.reduce(
          (sum, line) => sum + line.remainingQuantity,
          0
        );
        return (
          <li
            key={group[0].product.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-1.5">
              <p className="font-medium text-gray-900">
                {formatApprovalProduct(group[0].product)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.map((line) => (
                  <span
                    key={line.id}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs ring-1 ring-inset',
                      line.remainingQuantity > 0
                        ? 'bg-amber-50 text-amber-800 ring-amber-200'
                        : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                    )}
                  >
                    {line.branch.name}{' '}
                    <strong className="tabular-nums">
                      {line.receivedQuantity}/{line.quantity}
                    </strong>
                  </span>
                ))}
              </div>
            </div>
            <dl className="flex shrink-0 gap-4 text-sm tabular-nums">
              <div>
                <dt className="text-xs text-gray-500">Aprobadas</dt>
                <dd className="text-right">{approved}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Recibidas</dt>
                <dd className="text-right">{received}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Faltan</dt>
                <dd
                  className={cn(
                    'text-right font-semibold',
                    remaining > 0 ? 'text-amber-700' : 'text-gray-400'
                  )}
                >
                  {remaining}
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
