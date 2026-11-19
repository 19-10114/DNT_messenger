'use client';

import React, { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Pencil, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { APPROVAL_LOOKUP_QUERY_KEY } from '@/hooks/approvals/approvalsQueryKeys';
import { formatCurrency, cn } from '@/lib/utils';
import { ApprovalsService } from '@/services/approvals/approvals.service';
import { ApprovalLookup } from '@/services/approvals/types';
import { useToken } from '@/stores/auth/auth.store';
import {
  bikeIdentityWarnings,
  normalizeSerial,
  splitChassisForReading,
} from './bikeIdentity.utils';

const approvalsService = new ApprovalsService();

export interface ReviewBikeLine {
  productId: number;
  name: string;
  plate: string;
  color: string;
  chassisSerial: string;
  motorSerial: string;
  year: string;
  cost: number;
  approvalNumber: string;
}

/** Cambia si cambia cualquier dato: una moto editada vuelve a "sin revisar". */
function lineSignature(line: ReviewBikeLine, index: number): string {
  return [
    index,
    line.productId,
    line.plate,
    line.color,
    normalizeSerial(line.chassisSerial),
    normalizeSerial(line.motorSerial),
    line.year,
    line.approvalNumber,
  ].join('|');
}

interface PurchaseBikeReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: ReviewBikeLine[];
  /** Sucursal que recibe: el cupo de cada aprobación es por sucursal. */
  targetBranchId?: number;
  targetBranchName: string;
  /** Al editar una preorden, para no contar su propio cupo dos veces. */
  purchaseOrderId?: number;
  isSaving: boolean;
  onConfirm: () => void;
  onEditLine: (index: number) => void;
}

/**
 * Revisión final de una preorden de motos, antes de mandarla.
 *
 * Cada moto se marca como revisada por separado: un solo "Confirmar" se
 * aprende a apretar sin leer, y lo que se carga acá no se corrige fácil.
 * Marcar es un click en la fila; editar una moto la vuelve a dejar sin
 * revisar. Los avisos (chasis que no mide 17, I/O/Q, seriales casi iguales)
 * no bloquean: piden mirar dos veces.
 *
 * Abajo, cómo queda cada aprobación de Empire después de esta preorden.
 */
export function PurchaseBikeReviewDialog({
  open,
  onOpenChange,
  lines,
  targetBranchId,
  targetBranchName,
  purchaseOrderId,
  isSaving,
  onConfirm,
  onEditLine,
}: PurchaseBikeReviewDialogProps) {
  const token = useToken();
  // Por firma y no por índice: sobrevive a cerrar el diálogo para editar.
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const signatures = lines.map(lineSignature);
  const reviewedCount = signatures.filter((sig) => reviewed.has(sig)).length;
  const allReviewed = lines.length > 0 && reviewedCount === lines.length;

  const toggle = (signature: string) =>
    setReviewed((prev) => {
      const next = new Set(prev);
      if (next.has(signature)) next.delete(signature);
      else next.add(signature);
      return next;
    });

  const warningsByLine = useMemo(
    () =>
      lines.map((line, index) =>
        bikeIdentityWarnings(
          line,
          lines.filter((_, other) => other !== index)
        )
      ),
    [lines]
  );

  const numbers = useMemo(
    () =>
      Array.from(new Set(lines.map((line) => line.approvalNumber))).filter(
        Boolean
      ),
    [lines]
  );
  const lookups = useQueries({
    queries: numbers.map((number) => ({
      queryKey: [APPROVAL_LOOKUP_QUERY_KEY, token, number, purchaseOrderId],
      queryFn: () =>
        approvalsService.lookup(token as string, number, purchaseOrderId),
      enabled: open && !!token,
      retry: false,
      staleTime: 15 * 1000,
    })),
  });

  const summary = numbers.map((number, index) => {
    const lookup = lookups[index]?.data as ApprovalLookup | undefined;
    const taken = new Map<number, { name: string; count: number }>();
    lines
      .filter((line) => line.approvalNumber === number)
      .forEach((line) => {
        const entry = taken.get(line.productId) ?? {
          name: line.name,
          count: 0,
        };
        entry.count += 1;
        taken.set(line.productId, entry);
      });
    return {
      number,
      isLoading: lookups[index]?.isLoading,
      models: Array.from(taken.entries()).map(([productId, entry]) => {
        const lookupLine = lookup?.lines.find(
          (line) =>
            line.product.id === productId && line.branch.id === targetBranchId
        );
        const available = lookupLine?.availableQuantity;
        return {
          productId,
          name: entry.name,
          taken: entry.count,
          approved: lookupLine?.quantity,
          received: lookupLine?.receivedQuantity,
          available,
          after: available === undefined ? undefined : available - entry.count,
        };
      }),
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="min(900px, 95vw)" maxHeight="90vh">
        <DialogHeader>
          <DialogTitle>
            Revise las {lines.length} motos antes de enviar
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                Compare cada moto con su factura y con la calcomanía del chasis.
                Placa, chasis y motor quedan en el inventario, en el GPS y en
                los papeles del cliente: un error obliga a anular la compra y
                volver a cargarla. El modelo y el número de aprobación
                descuentan de lo que Empire aprobó.
              </p>
              <p>
                Recibe: <strong>{targetBranchName || 'sin sucursal'}</strong>.
                Haga click en cada moto para marcarla como revisada.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-2">
          {lines.map((line, index) => {
            const signature = signatures[index];
            const isChecked = reviewed.has(signature);
            const warnings = warningsByLine[index];
            const [chassisHead, chassisTail] = splitChassisForReading(
              line.chassisSerial
            );
            return (
              <li
                key={`${index}-${line.plate}`}
                className={cn(
                  'cursor-pointer rounded-lg border p-3 transition-colors',
                  isChecked
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => toggle(signature)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggle(signature)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Moto ${line.plate} revisada`}
                    className="mt-1 h-5 w-5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-gray-900">
                        {index + 1}. {line.name}{' '}
                        <span className="font-normal text-gray-500">
                          · {line.color} · {line.year}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Aprobación{' '}
                        <span className="font-mono font-semibold text-gray-900">
                          {line.approvalNumber}
                        </span>{' '}
                        · {formatCurrency(line.cost)}
                      </p>
                    </div>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-gray-500">Placa</dt>
                        <dd className="font-mono text-base font-semibold tracking-wider text-gray-900">
                          {line.plate}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Chasis (VIN)</dt>
                        <dd className="font-mono text-base tracking-wider text-gray-900">
                          {chassisHead}
                          <span className="ml-0.5 rounded bg-yellow-100 px-0.5 font-semibold">
                            {chassisTail}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Motor</dt>
                        <dd className="font-mono text-base tracking-wider text-gray-900">
                          {normalizeSerial(line.motorSerial)}
                        </dd>
                      </div>
                    </dl>
                    {warnings.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {warnings.map((warning) => (
                          <li
                            key={warning}
                            className="flex items-start gap-1.5 text-xs text-amber-700"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Corregir esta moto"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditLine(index);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <ShieldCheck className="h-4 w-4" />
            Cómo quedan las aprobaciones de Empire
          </h4>
          <div className="space-y-2 text-sm">
            {summary.map((entry) => (
              <div key={entry.number}>
                <p className="font-mono font-semibold text-gray-900">
                  {entry.number}
                </p>
                {entry.isLoading ? (
                  <p className="text-xs text-gray-500">Consultando...</p>
                ) : (
                  <ul className="ml-4 list-disc text-gray-700">
                    {entry.models.map((model) => (
                      <li key={model.productId}>
                        {model.name}: esta preorden toma {model.taken}
                        {model.available !== undefined && (
                          <>
                            {' '}
                            de {model.available} disponibles (aprobadas{' '}
                            {model.approved}, recibidas {model.received}) →{' '}
                            <span
                              className={cn(
                                'font-semibold',
                                (model.after ?? 0) < 0
                                  ? 'text-red-700'
                                  : 'text-gray-900'
                              )}
                            >
                              quedan {model.after}
                            </span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <p
            className={cn(
              'flex items-center gap-1.5 text-sm',
              allReviewed ? 'text-emerald-700' : 'text-gray-600'
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            {reviewedCount} de {lines.length} revisadas
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Volver al carrito
            </Button>
            <Button disabled={!allReviewed || isSaving} onClick={onConfirm}>
              {isSaving
                ? 'Enviando...'
                : `Confirmar ${lines.length} ${lines.length === 1 ? 'moto' : 'motos'}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
