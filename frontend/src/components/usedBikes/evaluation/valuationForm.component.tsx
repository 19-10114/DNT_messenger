'use client';

import React from 'react';
import { Calculator } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Input } from '@/components/ui/input.component';

/**
 * Parámetros con los que se pide el cálculo del justiprecio.
 * El margen de reventa no entra: lo resuelve el backend por su cuenta.
 */
export interface ValuationInputs {
  marketValue: string;
  /** Descuento comercial en porcentaje */
  commercialPenalty: string;
}

export const EMPTY_VALUATION_INPUTS: ValuationInputs = {
  marketValue: '',
  commercialPenalty: '0',
};

interface ValuationFormProps {
  inputs: ValuationInputs;
  isEvaluating?: boolean;
  onChange: (patch: Partial<ValuationInputs>) => void;
  onEvaluate: () => void;
}

/** Parámetros de valuación de la unidad */
export function ValuationForm({
  inputs,
  isEvaluating = false,
  onChange,
  onEvaluate,
}: ValuationFormProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-base">Parámetros de valuación</CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <label className="flex flex-col gap-1 text-sm min-w-0">
            <span className="font-medium">Valor del mercado</span>
            <Input
              type="number"
              value={inputs.marketValue}
              onChange={(event) =>
                onChange({ marketValue: event.target.value })
              }
              placeholder="0"
              min="0"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm min-w-0">
            <span className="font-medium">Castigo comercial</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={inputs.commercialPenalty}
                onChange={(event) =>
                  onChange({ commercialPenalty: event.target.value })
                }
                placeholder="0"
                min="0"
                max="100"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </label>

          <Button type="button" onClick={onEvaluate} disabled={isEvaluating}>
            <Calculator className="h-4 w-4 mr-1" />
            {isEvaluating ? 'Evaluando...' : 'Evaluar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
