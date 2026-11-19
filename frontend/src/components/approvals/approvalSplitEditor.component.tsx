'use client';

import React from 'react';
import { Plus, Split, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import { cn } from '@/lib/utils';
import { ApprovalBranch } from '@/services/approvals/types';

/** Cuántas motos del modelo van a una sucursal. */
export interface BranchSplit {
  branch: ApprovalBranch;
  quantity: string;
  /** Ya recibidas en esa sucursal: no se puede bajar de acá ni quitarla. */
  received: number;
}

export function splitTotal(splits: BranchSplit[]): number {
  return splits.reduce((sum, split) => sum + (Number(split.quantity) || 0), 0);
}

interface ApprovalSplitEditorProps {
  modelName: string;
  total: number;
  splits: BranchSplit[];
  branches: ApprovalBranch[];
  onChange: (splits: BranchSplit[]) => void;
  /** "Ajustar total": iguala el total del modelo a lo repartido. */
  onUseSumAsTotal: (sum: number) => void;
}

/**
 * Las sucursales de un modelo como pastillas ("Maturín ×3 · Caracas ×2") y
 * el botón "Repartir", que abre un recuadro con solo las sucursales de ese
 * modelo: cantidad por sucursal, quitar, y agregar otra desde una lista.
 * Avisa si lo repartido no suma el total del modelo.
 */
export function ApprovalSplitEditor({
  modelName,
  total,
  splits,
  branches,
  onChange,
  onUseSumAsTotal,
}: ApprovalSplitEditorProps) {
  const assigned = splitTotal(splits);
  const isBalanced = assigned === total;
  const available = branches.filter(
    (branch) => !splits.some((split) => split.branch.id === branch.id)
  );

  const update = (index: number, quantity: string) =>
    onChange(
      splits.map((split, i) => (i === index ? { ...split, quantity } : split))
    );
  const remove = (index: number) =>
    onChange(splits.filter((_, i) => i !== index));
  const add = (branchId: string) => {
    const branch = branches.find((item) => String(item.id) === branchId);
    if (!branch) return;
    const missing = Math.max(total - assigned, 0);
    onChange([
      ...splits,
      { branch, quantity: String(missing || 1), received: 0 },
    ]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {splits.map((split) => (
        <span
          key={split.branch.id}
          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
        >
          {split.branch.name}{' '}
          <strong className="tabular-nums">
            ×{Number(split.quantity) || 0}
          </strong>
          {split.received > 0 && (
            <span className="text-gray-500"> ({split.received} recibidas)</span>
          )}
        </span>
      ))}
      {!isBalanced && (
        <span className="text-xs font-medium text-destructive">
          Repartidas {assigned} de {total}
        </span>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Split className="mr-1 h-3.5 w-3.5" />
            Repartir
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-3">
          <p className="text-sm font-semibold text-gray-900">
            Repartir {modelName} ({total})
          </p>
          <ul className="space-y-2">
            {splits.map((split, index) => (
              <li key={split.branch.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm">
                  {split.branch.name}
                  {split.received > 0 && (
                    <span className="block text-xs text-gray-500">
                      {split.received} ya recibidas
                    </span>
                  )}
                </span>
                <Input
                  type="number"
                  min={Math.max(split.received, 1)}
                  value={split.quantity}
                  onChange={(event) => update(index, event.target.value)}
                  className="h-8 w-20 text-right tabular-nums"
                  aria-label={`Motos para ${split.branch.name}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-red-600 hover:bg-red-50"
                  disabled={split.received > 0 || splits.length === 1}
                  title={
                    split.received > 0
                      ? 'Ya recibió motos: no se puede quitar'
                      : splits.length === 1
                        ? 'El modelo necesita al menos una sucursal'
                        : 'Quitar'
                  }
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          {available.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Plus className="h-4 w-4 shrink-0" />
              <select
                value=""
                onChange={(event) => add(event.target.value)}
                className="h-8 w-full rounded-md border px-2 text-sm"
              >
                <option value="">Agregar sucursal...</option>
                {available.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div
            className={cn(
              'flex items-center justify-between rounded-md px-2 py-1.5 text-sm',
              isBalanced
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-700'
            )}
          >
            <span>
              Repartidas {assigned} de {total}
            </span>
            {!isBalanced && assigned > 0 && (
              <button
                type="button"
                className="text-xs underline"
                onClick={() => onUseSumAsTotal(assigned)}
              >
                Usar {assigned} como total
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
