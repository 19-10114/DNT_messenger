'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { useUsedBikePricing } from '@/hooks/products';
import { UsedBikeProductPrice } from '@/services/products/types/UsedBike.type';
import { getUsedBikeErrorMessage } from '../usedBikeError';
import { formatOfferRange, profitMargin } from '../usedBike.utils';
import { useToast } from '@/components/ui/use-toast';
import {
  AssignedProduct,
  EvaluationIssue,
  EvaluationScore,
} from '@/stores/usedBikeEvaluation/usedBikeEvaluation.store';
import {
  DecisionModal,
  EvaluationDecision,
  SummaryProduct,
} from './decisionModal.component';
import { PriceMarker, PriceNegotiation } from './priceNegotiation.component';
import { ProductAssignmentModal } from './productAssignmentModal.component';
import { RequiredPartsCard } from './requiredPartsCard.component';
import {
  EMPTY_VALUATION_INPUTS,
  ValuationForm,
  ValuationInputs,
} from './valuationForm.component';
import { ValuationResults } from './valuationResults.component';

interface EvaluationStageTwoProps {
  issues: EvaluationIssue[];
  /** Puntaje del cuestionario completo */
  score: EvaluationScore;
  /** Lo que el backend ya tiene guardado para esta unidad */
  savedProductPrices: UsedBikeProductPrice[];
  /** Lo que pide el dueño; entra en la escala de precios */
  askedPrice: number | null;
  onAssignProduct: (questionId: number, product: AssignedProduct) => void;
  onRemoveProduct: (questionId: number, productId: string) => void;
  onUpdatePrice: (questionId: number, productId: string, price: number) => void;
  onUpdateQuantity: (
    questionId: number,
    productId: string,
    quantity: number
  ) => void;
  /** Persiste los repuestos asignados en la moto usada */
  onSaveProducts: () => void;
  isSavingProducts?: boolean;
  /**
   * Persiste los justiprecios recién calculados. Se dispara en cuanto la
   * calculadora responde, no al aprobar: la aprobación no los acepta.
   */
  onSaveOffers?: (offers: {
    offerA?: string;
    offerB?: string;
  }) => Promise<void>;
  /**
   * Persiste el precio de compra acordado apenas se confirma en la escala,
   * sin esperar a la decisión. `null` cuando se borra el campo.
   */
  onSaveOfferedPrice?: (offeredPrice: number | null) => Promise<void>;
  /** Confirmación de aprobar o rechazar; al rechazar solo importa la decisión */
  onDecision: (
    decision: EvaluationDecision,
    details: {
      offeredPrice: number | null;
      /** Número de entrada de la compra; vacío si no se indicó */
      inNumber: string;
      /** Forma de pago acordada; vacía si no se eligió */
      paymentMethod: string;
      /** Margen de reventa calculado sobre la estrategia A */
      margin: number | null;
    }
  ) => Promise<void>;
  isDecisionLoading?: boolean;
  /** Ya tiene transacción de compra: no se puede aprobar dos veces */
  isAlreadyApproved?: boolean;
}

/** Etapa 2: repuestos necesarios para los hallazgos R y M */
export function EvaluationStageTwo({
  issues,
  score,
  savedProductPrices,
  askedPrice,
  onAssignProduct,
  onRemoveProduct,
  onUpdatePrice,
  onUpdateQuantity,
  onSaveProducts,
  isSavingProducts = false,
  onSaveOffers,
  onSaveOfferedPrice,
  onDecision,
  isDecisionLoading = false,
  isAlreadyApproved = false,
}: EvaluationStageTwoProps) {
  const { toast } = useToast();
  const [openIssueId, setOpenIssueId] = useState<number>();
  const [offeredPrice, setOfferedPrice] = useState<number | null>(null);
  const [decision, setDecision] = useState<EvaluationDecision>();

  const [valuationInputs, setValuationInputs] = useState<ValuationInputs>(
    EMPTY_VALUATION_INPUTS
  );

  const { calculatePricing, pricing, isCalculatingPricing, isErrorPricing } =
    useUsedBikePricing();

  // Misma fórmula que el backend: 0 si la versión no tiene preguntas puntuadas
  const totalScore = score.maxScore
    ? (score.rawScore / score.maxScore) * 100
    : 0;

  /**
   * Margen de reventa que deja lo que se ofrece pagar, medido contra el valor
   * neto de la **estrategia A**. Es derivado: se recalcula solo con cada
   * precio confirmado, así que no hay estado que se pueda quedar viejo. Sin
   * haber corrido la calculadora no hay `netBase` y queda en `null`.
   */
  const margin = profitMargin(offeredPrice, pricing?.case1?.netBase);

  /** Confirmar el precio en la escala lo guarda ya, sin esperar la decisión */
  const handleOfferedPriceChange = async (price: number | null) => {
    setOfferedPrice(price);

    try {
      await onSaveOfferedPrice?.(price);
    } catch (error) {
      toast({
        title: 'No se pudo guardar el precio ofrecido',
        description: getUsedBikeErrorMessage(
          error,
          'El precio se muestra igual, pero no quedó guardado en la unidad.'
        ),
        variant: 'destructive',
      });
    }
  };

  const onEvaluate = async () => {
    const marketValue = Number(valuationInputs.marketValue);

    if (!valuationInputs.marketValue.trim() || Number.isNaN(marketValue)) {
      toast({
        title: 'Falta el valor de mercado',
        description: 'Indica cuánto vale la moto en el mercado para calcular.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Se piden ambas estrategias: los porcentajes van como enteros.
      // El margen no viaja: el backend aplica el suyo.
      const result = await calculatePricing({
        payload: {
          marketValue,
          punishment: Number(valuationInputs.commercialPenalty) || 0,
          percentageScore: totalScore,
          products: issues.flatMap((issue) =>
            issue.products.map((product) => ({
              productId: product.productId,
              quantity: product.quantity,
              price: product.price,
            }))
          ),
        },
      });

      // El cálculo no persiste nada: los justiprecios se guardan aparte para
      // poder reconstruir la escala de precios en la ficha de la unidad.
      await onSaveOffers?.({
        offerA: formatOfferRange(result?.case1),
        offerB: formatOfferRange(result?.case2),
      });
    } catch (error) {
      toast({
        title: 'No se pudo calcular',
        description: getUsedBikeErrorMessage(
          error,
          'Ocurrió un error al calcular el justiprecio.'
        ),
        variant: 'destructive',
      });
    }
  };

  const openIssue = issues.find((issue) => issue.questionId === openIssueId);

  /**
   * Los repuestos locales mandan; si no hay, se listan los ya guardados. Lo
   * guardado solo tiene ids: sin hallazgo que lo reclame no hay nombre que dar.
   */
  const assignedProducts = issues.flatMap((issue) => issue.products);
  const summaryProducts: SummaryProduct[] = assignedProducts.length
    ? assignedProducts.map((product) => ({
        key: product.id,
        label:
          product.quantity > 1
            ? `${product.name} x${product.quantity}`
            : product.name,
        price: product.price * product.quantity,
      }))
    : savedProductPrices.map((entry, index) => {
        const quantity = entry.quantity ?? 1;
        const name = `Producto #${entry.productId}`;

        return {
          key: `${entry.productId}-${index}`,
          label: quantity > 1 ? `${name} x${quantity}` : name,
          price: entry.price * quantity,
        };
      });

  const priceMarkers: PriceMarker[] = [
    {
      key: 'asked',
      label: 'Pedido',
      value: askedPrice,
      labelTone: 'text-foreground',
      dotTone: 'bg-foreground',
    },
    {
      key: 'strategyA',
      label: 'Estrategia A',
      value: pricing?.case1?.minPrice ?? null,
      to: pricing?.case1?.maxPrice ?? null,
      labelTone: 'text-emerald-700',
      dotTone: 'bg-emerald-600',
      dotToneSoft: 'bg-emerald-300',
    },
    {
      // Con reparaciones más caras que la moto el rango se invierte: no se grafica
      key: 'strategyB',
      label: 'Estrategia B',
      value:
        pricing?.case2 && pricing.case2.netBase > 0
          ? pricing.case2.minPrice
          : null,
      to: pricing?.case2?.maxPrice ?? null,
      labelTone: 'text-blue-700',
      dotTone: 'bg-blue-600',
      dotToneSoft: 'bg-blue-300',
    },
    {
      key: 'offered',
      label: 'Ofrecido',
      value: offeredPrice,
      labelTone: 'text-amber-700',
      dotTone: 'bg-amber-500',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Puntuación:{' '}
          <span className="font-semibold text-foreground">
            {score.rawScore} / {score.maxScore}
          </span>{' '}
          ({totalScore.toFixed(1)}%)
        </p>

        <Button
          type="button"
          className="sm:self-auto self-end"
          onClick={onSaveProducts}
          disabled={isSavingProducts}
        >
          <Save className="h-4 w-4 mr-1" />
          {isSavingProducts ? 'Guardando...' : 'Finalizar Evaluación'}
        </Button>
      </div>

      {/*
        Sin filtro de rol: el acceso a la evaluación ya está restringido antes,
        a un admin o al responsable asignado.
      */}
      <RequiredPartsCard issues={issues} onOpenIssue={setOpenIssueId} />

      <ValuationForm
        inputs={valuationInputs}
        isEvaluating={isCalculatingPricing}
        onChange={(patch) =>
          setValuationInputs((current) => ({ ...current, ...patch }))
        }
        onEvaluate={onEvaluate}
      />
      <ValuationResults
        result={pricing ?? null}
        isLoading={isCalculatingPricing}
        isError={isErrorPricing}
      />

      <PriceNegotiation
        markers={priceMarkers}
        offeredPrice={offeredPrice}
        isAlreadyApproved={isAlreadyApproved}
        onOfferedPriceChange={handleOfferedPriceChange}
        onDecision={setDecision}
      />

      <DecisionModal
        decision={decision}
        askedPrice={askedPrice}
        offeredPrice={offeredPrice}
        issues={issues}
        products={summaryProducts}
        pricing={pricing ?? null}
        margin={margin}
        isLoading={isDecisionLoading}
        onOpenChange={(open) => {
          if (!open) setDecision(undefined);
        }}
        onConfirm={async (inNumber, paymentMethod) => {
          if (!decision) return;
          await onDecision(decision, {
            offeredPrice,
            inNumber,
            paymentMethod,
            margin,
          });
          setDecision(undefined);
        }}
      />

      <ProductAssignmentModal
        issue={openIssue}
        onOpenChange={(open) => {
          if (!open) setOpenIssueId(undefined);
        }}
        onAssign={(product) => {
          if (!openIssue) return;
          onAssignProduct(openIssue.questionId, product);
        }}
        onRemove={(productId) => {
          if (!openIssue) return;
          onRemoveProduct(openIssue.questionId, productId);
        }}
        onUpdatePrice={(productId, price) => {
          if (!openIssue) return;
          onUpdatePrice(openIssue.questionId, productId, price);
        }}
        onUpdateQuantity={(productId, quantity) => {
          if (!openIssue) return;
          onUpdateQuantity(openIssue.questionId, productId, quantity);
        }}
      />
    </div>
  );
}
