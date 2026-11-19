'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { cn } from '@/lib/utils';
import {
  UsedBikePricingByCondition,
  UsedBikePricingByRepairs,
  UsedBikePricingResult,
} from '@/services/products/types/UsedBikePricing.type';
import { formatPrice } from '../usedBike.utils';

interface ValuationResultsProps {
  result: UsedBikePricingResult | null;
  isLoading?: boolean;
  isError?: boolean;
}

const EMPTY = '-';

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY;
  return `${value}%`;
}

/** El precio nulo ya se resuelve como "-" en `formatPrice` */
function money(value: number | null | undefined): string {
  return formatPrice(value ?? null);
}

interface RowProps {
  label: string;
  value: string;
  /** Nota al pie de la fila, en tono tenue */
  hint?: string;
  /** Fila de cierre: separador arriba y tipografía destacada */
  total?: boolean;
  /** Color de la estrategia, para las filas de cierre */
  accent?: string;
}

function Row({ label, value, hint, total = false, accent }: RowProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 py-1.5',
        total && 'border-t mt-2 pt-3',
        total && (accent ?? 'border-gray-300')
      )}
    >
      <span
        className={cn(
          'text-sm',
          total ? 'font-semibold' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
      <span className="text-right">
        <span
          className={cn('text-sm', total ? 'font-semibold' : 'font-medium')}
        >
          {value}
        </span>
        {hint ? (
          <span className="block text-[11px] text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** Rango de compra: se abre en el mínimo y no se pasa del máximo */
function priceRange(
  strategy: UsedBikePricingByCondition | UsedBikePricingByRepairs | undefined
): string {
  if (!strategy) return EMPTY;
  return `${money(strategy.minPrice)} – ${money(strategy.maxPrice)}`;
}

/** Las dos estrategias de valuación, lado a lado */
export function ValuationResults({
  result,
  isLoading = false,
  isError = false,
}: ValuationResultsProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-base">Resultados</CardTitle>
        </CardHeader>
        <CardContent className="py-16">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Calculando justiprecio...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const condition = result?.case1;
  const repairs = result?.case2;

  // Reparaciones más caras que la moto: el rango se invierte y no sirve
  const repairsExceedValue = !!repairs && repairs.netBase <= 0;

  return (
    <div className="flex flex-col gap-4">
      {isError ? (
        <p className="text-sm text-destructive">
          No se pudo calcular el justiprecio. Revisa los parámetros e intenta de
          nuevo.
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden border-emerald-500">
          <CardHeader className="border-b border-emerald-500/40 py-3">
            <CardTitle className="text-base text-emerald-700">
              Estrategia A · Por condición
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <Row label="Valor mercado" value={money(condition?.marketValue)} />
            <Row
              label="Castigo"
              value={formatPercent(condition?.punishmentPct)}
              hint={
                condition ? `− ${money(condition.punishmentAmount)}` : undefined
              }
            />
            <Row label="Base" value={money(condition?.base)} />
            <Row
              label="Score"
              value={formatPercent(condition?.scorePct)}
              hint={
                condition ? `− ${money(condition.scoreDeduction)}` : undefined
              }
            />
            <Row
              label="Gastos administrativos"
              value={`- ${money(condition?.adminExpense)}`}
            />
            <Row label="Base neta" value={money(condition?.netBase)} />
            <Row
              label="Justiprecio A"
              value={priceRange(condition)}
              hint={
                condition
                  ? `Margen ${condition.minMarginPct}% – ${condition.maxMarginPct}%`
                  : undefined
              }
              total
              accent="border-emerald-500/40 text-emerald-700"
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-blue-500">
          <CardHeader className="border-b border-blue-500/40 py-3">
            <CardTitle className="text-base text-blue-700">
              Estrategia B · Por reparaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <Row label="Valor mercado" value={money(repairs?.marketValue)} />
            <Row
              label="Castigo"
              value={formatPercent(repairs?.punishmentPct)}
              hint={
                repairs ? `− ${money(repairs.punishmentAmount)}` : undefined
              }
            />
            <Row label="Base" value={money(repairs?.base)} />
            <Row
              label="Repuestos / Mano de obra"
              value={money(repairs?.partsSum)}
            />
            <Row
              label="Gastos administrativos"
              value={`- ${money(repairs?.adminExpense)}`}
            />
            <Row label="Base neta" value={money(repairs?.netBase)} />

            {repairsExceedValue ? (
              <p className="border-t border-blue-500/40 mt-2 pt-3 text-sm text-destructive">
                Las reparaciones superan el valor de la moto: no conviene
                tomarla.
              </p>
            ) : (
              <Row
                label="Justiprecio B"
                value={priceRange(repairs)}
                hint={
                  repairs
                    ? `Margen ${repairs.minMarginPct}% – ${repairs.maxMarginPct}%`
                    : undefined
                }
                total
                accent="border-blue-500/40 text-blue-700"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
