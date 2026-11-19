'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

import { Input } from '@/components/ui/input.component';
import { useApprovalSearch } from '@/hooks/approvals';
import { cn } from '@/lib/utils';
import { formatApprovalDate, normalizeApprovalNumber } from './approvals.utils';

interface ApprovalNumberInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Sucursal que recibe: cada opción muestra lo pendiente para ella. */
  branchId?: number;
  placeholder?: string;
  className?: string;
}

/**
 * Campo del número de aprobación de Empire con autocompletado.
 *
 * Al enfocarlo o escribir, despliega las aprobaciones abiertas cuyo número
 * empieza con lo escrito, de menor a mayor, con su fecha y lo pendiente (para
 * la sucursal que recibe, si se indica). Flechas + Enter o click para elegir;
 * Escape cierra. La lista se dibuja en el lugar, sin portal, para funcionar
 * dentro de diálogos.
 */
export function ApprovalNumberInput({
  id,
  value,
  onChange,
  branchId,
  placeholder = '13222345',
  className,
}: ApprovalNumberInputProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();

  const { approvalSearchResults, isSearchingApprovals, isApprovalSearchError } =
    useApprovalSearch(value, branchId, open);

  useEffect(() => setHighlighted(0), [value]);
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const choose = (number: string) => {
    onChange(number);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) =>
        Math.min(index + 1, approvalSearchResults.length - 1)
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      const option = approvalSearchResults[highlighted];
      if (option) {
        event.preventDefault();
        choose(option.number);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const typed = normalizeApprovalNumber(value);

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value.toUpperCase());
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={cn('font-mono', className)}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full min-w-[16rem] overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {isApprovalSearchError ? (
            <li className="px-3 py-2 text-sm text-destructive">
              No se pudieron buscar las aprobaciones.
            </li>
          ) : approvalSearchResults.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              {isSearchingApprovals
                ? 'Buscando...'
                : typed
                  ? `Ninguna aprobación abierta empieza con ${typed}.`
                  : 'No hay aprobaciones abiertas.'}
            </li>
          ) : (
            approvalSearchResults.map((option, index) => {
              const pending =
                option.remainingForBranch ?? option.remainingQuantity;
              return (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={index === highlighted}
                  onMouseDown={(event) => {
                    // Antes del blur del input, que cerraría la lista.
                    event.preventDefault();
                    choose(option.number);
                  }}
                  onMouseEnter={() => setHighlighted(index)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-sm',
                    index === highlighted && 'bg-gray-100'
                  )}
                >
                  <span>
                    <span className="font-mono font-semibold text-gray-900">
                      {option.number}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {formatApprovalDate(option.approvalDate)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap text-xs',
                      pending > 0 ? 'text-emerald-700' : 'text-gray-400'
                    )}
                  >
                    {pending} por recibir
                    {option.remainingForBranch !== null && ' aquí'}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
