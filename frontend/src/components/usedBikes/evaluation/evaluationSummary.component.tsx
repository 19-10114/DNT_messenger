'use client';

import React, { useMemo } from 'react';

import { useProductsByIds } from '@/hooks/products';
import { useSurveyResponse } from '@/hooks/surveys';
import { UsedBike } from '@/services/products/types/UsedBike.type';
import { useToken } from '@/stores/auth/auth.store';
import {
  attachSavedProducts,
  evaluationFromResponse,
} from './evaluationResponse.utils';
import { RequiredPartsCard } from './requiredPartsCard.component';

interface EvaluationSummaryProps {
  usedBike: UsedBike;
}

/**
 * Resultado de la evaluación en modo lectura: puntaje y repuestos necesarios.
 *
 * Se arma desde la respuesta ya enviada (la misma que abre la evaluación) y no
 * desde el store, que es del asistente de dos etapas: así la ficha se puede
 * abrir sin tocar una evaluación en curso.
 */
export function EvaluationSummary({ usedBike }: EvaluationSummaryProps) {
  const token = useToken();

  const { response, isLoadingResponse, isErrorResponse } = useSurveyResponse(
    token,
    usedBike.surveyResponse ?? undefined
  );

  // De `productPrices` solo vuelve el id: los nombres se resuelven aparte
  const savedProductPrices = useMemo(
    () => usedBike.productPrices ?? [],
    [usedBike.productPrices]
  );
  const { productsById } = useProductsByIds(
    savedProductPrices.map((entry) => entry.productId)
  );

  const { issues, score } = useMemo(() => {
    const evaluation = evaluationFromResponse(response);

    return {
      issues: attachSavedProducts(
        evaluation.issues,
        savedProductPrices,
        productsById
      ),
      score: evaluation.score,
    };
  }, [response, savedProductPrices, productsById]);

  // Misma fórmula que el backend: 0 si la versión no tiene preguntas puntuadas
  const totalScore = score.maxScore
    ? (score.rawScore / score.maxScore) * 100
    : 0;

  if (!usedBike.surveyResponse) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta unidad todavía no tiene una evaluación registrada.
      </p>
    );
  }

  if (isLoadingResponse) {
    return (
      <p className="text-sm text-muted-foreground">Cargando evaluación...</p>
    );
  }

  if (isErrorResponse) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar el resultado de la evaluación.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Puntuación:{' '}
        <span className="font-semibold text-foreground">
          {score.rawScore} / {score.maxScore}
        </span>{' '}
        ({totalScore.toFixed(1)}%)
      </p>

      {/* Sin `onOpenIssue` la tabla no abre nada: la ficha es de solo lectura */}
      <RequiredPartsCard issues={issues} />
    </div>
  );
}
