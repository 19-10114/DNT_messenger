'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { useToast } from '@/components/ui/use-toast';
import {
  CART_ROW_REJECTION_LABELS,
  RejectedCartRow,
} from '@/models/purchasePartsCart.model';

interface RejectedRowsTableProps {
  rows: RejectedCartRow[];
}

/**
 * Filas del Excel o de la factura que no entraron al carrito de preorden, con
 * el motivo. "Copiar" deja `sku<TAB>cantidad` por línea (más la descripción
 * leída, si es de una factura), para pegar en una planilla o mandárselo a
 * quien tenga que dar de alta el repuesto.
 */
export function RejectedRowsTable({ rows }: RejectedRowsTableProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    const text = rows
      .map((row) =>
        [row.sku ?? row.id ?? '', row.quantity ?? '', row.description]
          .filter((cell) => cell !== undefined)
          .join('\t')
      )
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ description: 'Lista copiada al portapapeles.' });
    } catch {
      toast({
        description: 'No se pudo copiar la lista.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="max-h-48 overflow-y-auto rounded border border-amber-200 bg-white dark:border-amber-900 dark:bg-transparent">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-amber-100/80 text-left text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <tr>
              <th className="px-2 py-1 font-medium">Fila</th>
              <th className="px-2 py-1 font-medium">SKU / id</th>
              <th className="px-2 py-1 font-medium text-right">Cant.</th>
              <th className="px-2 py-1 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.location ?? ''}-${row.rowNumber}-${index}`}
                className="border-t border-amber-100 dark:border-amber-900"
              >
                <td className="px-2 py-1 tabular-nums">
                  {row.location ? (
                    <span className="whitespace-nowrap">
                      {row.location}
                      {row.reason !== 'unreadable_page' &&
                        ` · ${row.rowNumber}`}
                    </span>
                  ) : (
                    row.rowNumber
                  )}
                </td>
                <td className="px-2 py-1">
                  <span className="font-mono">
                    {row.sku ?? (row.id !== null ? `id ${row.id}` : '—')}
                  </span>
                  {row.description && (
                    <span className="block text-muted-foreground">
                      {row.description}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1 text-right tabular-nums">
                  {row.quantity ?? '—'}
                </td>
                <td className="px-2 py-1">
                  {CART_ROW_REJECTION_LABELS[row.reason]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={handleCopy}
      >
        <Copy className="h-3 w-3 mr-1.5" /> Copiar lista
      </Button>
    </div>
  );
}
