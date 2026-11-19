'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Input } from '@/components/ui/input.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { cn } from '@/lib/utils';
import { EvaluationIssue } from '@/stores/usedBikeEvaluation/usedBikeEvaluation.store';
import { formatPrice } from '../usedBike.utils';
import { normalizeLabel, optionStyle } from './evaluationOptions';
import { UsedBikePricingResult } from '@/services/products/types/UsedBikePricing.type';

/** Repuesto asignado, normalizado para el resumen */
export interface SummaryProduct {
  key: string;
  label: string;
  price: number;
}

export type EvaluationDecision = 'approve' | 'reject';

/**
 * Cómo se le paga al dueño la unidad que se compra. Es un dato libre: se
 * guarda tal cual en las `notes` del registro, así que el valor **es** la
 * etiqueta que se ve.
 */
export const USED_BIKE_PAYMENT_METHODS = [
  'Forma de pago para otra moto de contado',
  'Inicial para moto arranca',
  'USDT',
  'Zelle',
  'Banesco Panamá',
  'Efectivo',
  'Bs',
];

interface DecisionModalProps {
  /** `undefined` mantiene el modal cerrado */
  decision?: EvaluationDecision;
  askedPrice: number | null;
  offeredPrice: number | null;
  issues: EvaluationIssue[];
  products: SummaryProduct[];
  pricing: UsedBikePricingResult | null;
  /**
   * Margen de reventa que deja el precio ofrecido sobre el `netBase` de la
   * estrategia A. Solo se muestra: se calculó al confirmar el precio y aquí no
   * se edita. `null` mientras no haya con qué calcularlo.
   */
  margin: number | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Al aprobar, `inNumber` queda como número de entrada de la transacción de
   * compra y `paymentMethod` como las `notes` del registro — vacío si no se
   * eligió ninguna.
   */
  onConfirm: (inNumber: string, paymentMethod: string) => void;
}

type SectionKey = 'R' | 'M' | 'products';

/** Rango de compra sugerido: se abre en el mínimo, se cierra en el máximo */
function priceRange(
  strategy: { minPrice: number; maxPrice: number } | null | undefined
): string {
  if (!strategy) return '-';
  return `${formatPrice(strategy.minPrice)} – ${formatPrice(strategy.maxPrice)}`;
}

interface DataRowProps {
  label: string;
  value: string;
}

/**
 * El margen se calcula al confirmar el precio ofrecido; aquí solo se lee.
 * Dos decimales: es la misma precisión con la que viaja al backend.
 */
function formatMargin(margin: number | null): string {
  return margin === null ? '-' : `${margin.toFixed(2)}%`;
}

function DataRow({ label, value }: DataRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

interface CollapsibleRowProps {
  summary: string;
  isOpen: boolean;
  isEmpty: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Fila plegable: el detalle se despliega al hacer click */
function CollapsibleRow({
  summary,
  isOpen,
  isEmpty,
  onToggle,
  children,
}: CollapsibleRowProps) {
  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={onToggle}
        disabled={isEmpty}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
          !isEmpty && 'hover:bg-muted/40 transition-colors',
          isEmpty && 'text-muted-foreground cursor-default'
        )}
      >
        {isEmpty ? (
          <span className="h-4 w-4" />
        ) : isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        {summary}
      </button>

      {isOpen && !isEmpty ? (
        <div className="border-t px-3 py-2 flex flex-col gap-1">{children}</div>
      ) : null}
    </div>
  );
}

/** Confirmación de aprobación o rechazo, con el resumen de la evaluación */
export function DecisionModal({
  decision,
  askedPrice,
  offeredPrice,
  issues,
  products,
  pricing,
  margin,
  isLoading = false,
  onOpenChange,
  onConfirm,
}: DecisionModalProps) {
  const [openSection, setOpenSection] = useState<SectionKey>();
  const [inNumber, setInNumber] = useState('');
  /** Vacío = no se eligió: en ese caso las `notes` no se tocan */
  const [paymentMethod, setPaymentMethod] = useState('');

  // Al reabrir el modal se parte en blanco
  useEffect(() => {
    if (!decision) return;
    setInNumber('');
    setPaymentMethod('');
  }, [decision]);

  const toggle = (section: SectionKey) =>
    setOpenSection((current) => (current === section ? undefined : section));

  const regularIssues = issues.filter(
    (issue) => normalizeLabel(issue.optionLabel) === 'R'
  );
  const badIssues = issues.filter(
    (issue) => normalizeLabel(issue.optionLabel) === 'M'
  );

  const isApproval = decision === 'approve';

  const renderIssues = (list: EvaluationIssue[], label: string) => {
    const style = optionStyle(label);

    return list.map((issue) => (
      <div key={issue.questionId} className="flex items-center gap-2">
        <span
          className={cn(
            'h-5 min-w-[1.25rem] rounded border px-1 flex items-center justify-center text-[11px] font-semibold',
            style.badge
          )}
        >
          {issue.optionLabel}
        </span>
        <div className="min-w-0">
          <p className="text-sm truncate">{issue.questionText}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {issue.section}
          </p>
        </div>
      </div>
    ));
  };

  return (
    <Dialog open={!!decision} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApproval ? (
              <ThumbsUp className="h-5 w-5 text-emerald-600" />
            ) : (
              <ThumbsDown className="h-5 w-5 text-destructive" />
            )}
            {isApproval
              ? 'Vas a aprobar la unidad'
              : 'Vas a rechazar la unidad'}
          </DialogTitle>
          <DialogDescription>
            Revisa el resumen de la evaluación antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border px-3 py-2">
            <DataRow label="Precio pedido" value={formatPrice(askedPrice)} />
            <DataRow
              label="Precio ofrecido"
              value={formatPrice(offeredPrice)}
            />
            {/* Solo informativo: no se edita acá, y al rechazar no aplica */}
            {isApproval ? (
              <DataRow label="Margen de reventa" value={formatMargin(margin)} />
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <CollapsibleRow
              summary={`Tiene ${regularIssues.length} pregunta(s) evaluada(s) como R`}
              isOpen={openSection === 'R'}
              isEmpty={regularIssues.length === 0}
              onToggle={() => toggle('R')}
            >
              {renderIssues(regularIssues, 'R')}
            </CollapsibleRow>

            <CollapsibleRow
              summary={`Tiene ${badIssues.length} pregunta(s) evaluada(s) como M`}
              isOpen={openSection === 'M'}
              isEmpty={badIssues.length === 0}
              onToggle={() => toggle('M')}
            >
              {renderIssues(badIssues, 'M')}
            </CollapsibleRow>

            <CollapsibleRow
              summary={`Tiene ${products.length} repuesto(s) asignado(s)`}
              isOpen={openSection === 'products'}
              isEmpty={products.length === 0}
              onToggle={() => toggle('products')}
            >
              {products.map((product) => (
                <div
                  key={product.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm truncate">{product.label}</span>
                  <span className="text-sm font-medium shrink-0">
                    {formatPrice(product.price)}
                  </span>
                </div>
              ))}
            </CollapsibleRow>
          </div>

          <div className="rounded-md border px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Precios sugeridos por la evaluación
            </p>
            <DataRow label="Justiprecio A" value={priceRange(pricing?.case1)} />
            <DataRow
              label="Justiprecio B"
              value={
                pricing?.case2 && pricing.case2.netBase <= 0
                  ? 'Las reparaciones superan el valor'
                  : priceRange(pricing?.case2)
              }
            />
          </div>

          {/* Solo al aprobar: queda en las `notes` del registro. Opcional */}
          {isApproval ? (
            <div className="rounded-md border px-3 py-3 flex flex-col gap-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                Observaciones (Pago al Cliente)
              </span>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {USED_BIKE_PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Queda como `in_number` en la transacción de compra */}
          {isApproval ? (
            <label className="rounded-md border px-3 py-3 flex flex-col gap-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                Número de entrada
              </span>
              <Input
                value={inNumber}
                onChange={(event) => setInNumber(event.target.value)}
                placeholder="Ej. 000123"
                className="w-48"
              />
            </label>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {/* Aprobar registra la compra en el libro mayor y no se puede deshacer */}
          <Button
            type="button"
            variant={isApproval ? 'default' : 'destructive'}
            className={cn(
              isApproval && 'bg-emerald-600 text-white hover:bg-emerald-700'
            )}
            disabled={isLoading}
            onClick={() => onConfirm(inNumber.trim(), paymentMethod)}
          >
            {isLoading ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
