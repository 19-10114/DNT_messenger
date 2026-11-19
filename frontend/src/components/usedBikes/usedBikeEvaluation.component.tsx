'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, UserMinus } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import { useToast } from '@/components/ui/use-toast';
import { useProductsByIds, useUsedBikeMutations } from '@/hooks/products';
import {
  useSubmitSurveyResponse,
  useSurvey,
  useSurveyResponse,
  useUpdateSurveyResponse,
} from '@/hooks/surveys';
import { SubmitAnswerPayload, SurveyResponse } from '@/services/surveys/types';
import { UsedBike } from '@/services/products/types/UsedBike.type';
import { useRoles, useToken, useUser } from '@/stores/auth/auth.store';
import { getUsedBikeErrorMessage } from './usedBikeError';
import { approvalMargin } from './usedBike.utils';
import {
  useEvaluationActions,
  useEvaluationIssues,
  useEvaluationScore,
} from '@/stores/usedBikeEvaluation/usedBikeEvaluation.store';
import {
  answersFromResponse,
  changedAnswers,
  resolveStageOne,
  versionFromResponse,
} from './evaluation/evaluationResponse.utils';
import { EvaluationDecision } from './evaluation/decisionModal.component';
import { EvaluationStageOne } from './evaluation/evaluationStageOne.component';
import { EvaluationStageTwo } from './evaluation/evaluationStageTwo.component';

interface UsedBikeEvaluationProps {
  usedBike: UsedBike;
  onBack: () => void;
  /** Se dispara al aprobar o rechazar, con el registro ya actualizado */
  onDecided?: (usedBike: UsedBike) => void;
  /**
   * Se dispara al renunciar a ser el responsable de la evaluación, con el
   * registro ya liberado
   */
  onResigned?: (usedBike: UsedBike) => void;
}

/**
 * Encuesta de evaluación. Se consulta sin número de versión, así que el
 * backend resuelve la versión publicada actual; si no hay ninguna, `version`
 * llega en `null` y la pantalla lo informa.
 */
const EVALUATION_SURVEY_ID = 3;

/** Evaluación de una moto usada, en dos etapas */
export function UsedBikeEvaluation({
  usedBike,
  onBack,
  onDecided,
  onResigned,
}: UsedBikeEvaluationProps) {
  const token = useToken();
  const roles = useRoles();
  const currentUser = useUser();
  const { toast } = useToast();

  /**
   * La respuesta recién enviada en esta sesión. El registro de la moto que
   * llega por props sigue con `surveyResponse` en `null` hasta que se recargue,
   * así que sin esto la etapa 1 volvería a ofrecerse en blanco y un segundo
   * "Continuar" crearía una respuesta duplicada.
   */
  const [submittedResponse, setSubmittedResponse] = useState<SurveyResponse>();

  const { response, isLoadingResponse, isErrorResponse } = useSurveyResponse(
    token,
    usedBike.surveyResponse ?? undefined
  );

  const currentResponse = response ?? submittedResponse;
  const hasResponse = !!usedBike.surveyResponse || !!submittedResponse;

  // Con la encuesta ya enviada se muestra lo respondido, sin volver a pedir
  // la versión publicada.
  const {
    survey,
    version: publishedVersion,
    isLoadingSurvey,
    isErrorSurvey,
  } = useSurvey(token, hasResponse ? undefined : EVALUATION_SURVEY_ID);

  const { submitResponse, isSubmittingResponse } =
    useSubmitSurveyResponse(token);
  const { updateResponse, isUpdatingResponse } = useUpdateSurveyResponse(token);
  const {
    updateUsedBike,
    isUpdatingUsedBike,
    approveUsedBike,
    isApprovingUsedBike,
  } = useUsedBikeMutations();

  const issues = useEvaluationIssues();
  const score = useEvaluationScore();
  const evaluationActions = useEvaluationActions();

  const [stage, setStage] = useState<1 | 2>(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // De `productPrices` solo vuelve el id del producto: el nombre, el sku y el
  // precio de lista se resuelven contra el catálogo para poder pintarlos.
  const savedProductPrices = useMemo(
    () => usedBike.productPrices ?? [],
    [usedBike.productPrices]
  );
  const { productsById, isLoadingProductsByIds } = useProductsByIds(
    savedProductPrices.map((entry) => entry.productId)
  );

  const answeredVersion = useMemo(
    () => versionFromResponse(currentResponse),
    [currentResponse]
  );

  const version = hasResponse ? answeredVersion : publishedVersion;
  const title = hasResponse ? currentResponse?.meta.surveyName : survey?.title;
  const isLoading = hasResponse ? isLoadingResponse : isLoadingSurvey;
  const isError = hasResponse ? isErrorResponse : isErrorSurvey;

  const isAdmin = roles.includes('admin');
  /**
   * Con la unidad ya aprobada o rechazada la evaluación queda cerrada: la
   * decisión se tomó con esas respuestas y cambiarlas después no la revierte.
   */
  const isDecided =
    usedBike.status === 'approved' || usedBike.status === 'rejected';
  /** Una vez enviada, solo un admin puede corregir lo respondido */
  const canEditAnswers = !isDecided && (!hasResponse || isAdmin);
  /**
   * Soltar la evaluación solo se ofrece en la etapa 1 y mientras el
   * cuestionario no se haya enviado: en cuanto se envía, la unidad ya tiene
   * una evaluación hecha a nombre de su responsable, así que el botón no
   * vuelve a aparecer —ni en la etapa 2, ni al volver a la 1 a consultar lo
   * respondido—.
   */
  const canResign =
    !!onResigned &&
    stage === 1 &&
    !hasResponse &&
    !isDecided &&
    (isAdmin || currentUser?.id === usedBike.responsible?.id);

  useEffect(() => {
    evaluationActions.startEvaluation(usedBike.id);
  }, [usedBike.id, evaluationActions]);

  // Precarga lo que ya se contestó
  useEffect(() => {
    if (!currentResponse) return;
    setAnswers(answersFromResponse(currentResponse));
  }, [currentResponse]);

  /**
   * Repone los repuestos ya guardados al entrar a la etapa 2.
   *
   * Espera a que el catálogo resuelva los nombres: `restoreAssignedProducts`
   * no vuelve a pisar un hallazgo que ya tenga repuestos, así que reponerlos
   * antes los dejaría como "Producto #123" para siempre.
   */
  useEffect(() => {
    if (stage !== 2 || isLoadingProductsByIds) return;
    evaluationActions.restoreAssignedProducts(savedProductPrices, productsById);
  }, [
    stage,
    isLoadingProductsByIds,
    savedProductPrices,
    productsById,
    evaluationActions,
  ]);

  const handleSelect = (questionId: number, optionId: string) => {
    if (!canEditAnswers) return;
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
  };

  /**
   * Suelta la evaluación: se queda sin responsable y vuelve a `pending`, así
   * otro la puede tomar. Solo se ofrece antes de enviar el cuestionario.
   */
  const handleResign = async () => {
    try {
      const released = await updateUsedBike({
        usedBikeId: usedBike.id,
        // `reviewer` (el mecánico) se conserva: solo se suelta la evaluación
        payload: { responsible: null, status: 'pending' },
      });

      toast({
        title: 'Dejaste de ser el responsable de la evaluación',
        description: `${usedBike.product.name} · Placa ${usedBike.plate} vuelve a estar pendiente.`,
      });
      onResigned?.(released);
    } catch (error) {
      toast({
        title: 'No se pudo liberar la evaluación',
        description: getUsedBikeErrorMessage(
          error,
          'Ocurrió un error al quitarte como responsable de la evaluación.'
        ),
        variant: 'destructive',
      });
    }
  };

  /**
   * Cierra la etapa 1: envía las respuestas como una `SurveyResponse` y enlaza
   * su id a la moto usada, pasándola a `in_review`.
   */
  const handleGoToStageTwo = async () => {
    if (!version) return;

    const resolved = resolveStageOne(version, answers);

    // Ya enviada: no se reenvía. Un admin puede corregir lo respondido con el
    // PATCH de la respuesta; para el resto solo se recalculan los hallazgos.
    // Los repuestos guardados los repone el efecto de arriba.
    if (hasResponse) {
      const corrections = currentResponse
        ? changedAnswers(currentResponse, resolved.answers)
        : [];

      if (canEditAnswers && currentResponse && corrections.length) {
        try {
          const updated = await updateResponse({
            responseId: currentResponse.id,
            answers: corrections,
          });
          setSubmittedResponse(updated);

          toast({
            title: 'Evaluación actualizada',
            description: `Se corrigieron ${corrections.length} respuesta(s).`,
          });
        } catch (error) {
          toast({
            title: 'No se pudo actualizar la evaluación',
            description: getUsedBikeErrorMessage(
              error,
              'Ocurrió un error al corregir las respuestas.'
            ),
            variant: 'destructive',
          });
          return;
        }
      }

      evaluationActions.completeStageOne(
        resolved.answers,
        resolved.issues,
        resolved.score
      );
      setStage(2);
      return;
    }

    const payload: SubmitAnswerPayload[] = Object.entries(resolved.answers).map(
      ([questionId, optionId]) => ({
        questionId: Number(questionId),
        value: { selected: optionId },
      })
    );

    try {
      const submitted = await submitResponse({
        surveyId: EVALUATION_SURVEY_ID,
        answers: payload,
      });
      setSubmittedResponse(submitted);

      await updateUsedBike({
        usedBikeId: usedBike.id,
        payload: { surveyResponse: submitted.id, status: 'in_review' },
      });

      evaluationActions.completeStageOne(
        resolved.answers,
        resolved.issues,
        resolved.score
      );
      setStage(2);
    } catch (error) {
      toast({
        title: 'No se pudo guardar la evaluación',
        description: getUsedBikeErrorMessage(
          error,
          'Ocurrió un error al enviar las respuestas.'
        ),
        variant: 'destructive',
      });
    }
  };

  /**
   * Cierra la evaluación.
   *
   * Aprobar llama al endpoint de aprobación, que guarda el `cost`, deriva el
   * precio de reventa con el margen, crea la transacción de compra y pone el
   * estado en `approved` por su cuenta: no hay que parchear nada aparte. La
   * forma de pago es la excepción — no la acepta ese endpoint, así que va en
   * un PATCH previo. Rechazar sí es solo un cambio de estado.
   */
  const handleDecision = async (
    decision: EvaluationDecision,
    {
      offeredPrice,
      inNumber,
      paymentMethod,
      margin,
    }: {
      offeredPrice: number | null;
      inNumber: string;
      paymentMethod: string;
      margin: number | null;
    }
  ) => {
    try {
      if (decision === 'reject') {
        const rejected = await updateUsedBike({
          usedBikeId: usedBike.id,
          payload: { status: 'rejected' },
        });

        toast({
          title: 'Unidad rechazada',
          description: `${usedBike.product.name} · Placa ${usedBike.plate}`,
        });
        onDecided?.(rejected);
        return;
      }

      if (offeredPrice === null && usedBike.cost === null) {
        toast({
          title: 'Falta el precio ofrecido',
          description:
            'Indica cuánto se le pagará al dueño antes de aprobar la compra.',
          variant: 'destructive',
        });
        return;
      }

      // La forma de pago queda en las `notes`. Sin elegir no se parchea nada:
      // mandar `null` borraría lo que ya hubiera anotado.
      if (paymentMethod) {
        await updateUsedBike({
          usedBikeId: usedBike.id,
          payload: { notes: paymentMethod },
        });
      }

      // Fuera del rango que acepta el endpoint se omite y el backend aplica
      // el suyo, en vez de que la aprobación entera falle por el margen.
      const acceptedMargin = approvalMargin(margin);

      const approval = await approveUsedBike({
        usedBikeId: usedBike.id,
        // Sin precio ofrecido el backend usa el `cost` ya guardado
        payload: {
          ...(offeredPrice !== null && { cost: offeredPrice }),
          ...(acceptedMargin !== undefined && { margin: acceptedMargin }),
          // Va en snake_case: es como lo espera este endpoint
          ...(inNumber && { in_number: inNumber }),
        },
      });

      toast({
        title: 'Compra aprobada',
        description: `La unidad entró al inventario con la transacción #${approval.transaction.id}.`,
      });
      onDecided?.(approval.usedBike);
    } catch (error) {
      toast({
        title:
          decision === 'approve'
            ? 'No se pudo aprobar la compra'
            : 'No se pudo rechazar la unidad',
        description: getUsedBikeErrorMessage(
          error,
          'Ocurrió un error al registrar la decisión.'
        ),
        variant: 'destructive',
      });
    }
  };

  /**
   * Guarda los justiprecios recién calculados en el registro de la unidad.
   *
   * La calculadora no persiste nada y el endpoint de aprobación no los acepta,
   * así que viajan por el PATCH de la moto usada apenas se conocen. Van en
   * snake_case, a diferencia del resto del payload.
   */
  const handleSaveOffers = async (offers: {
    offerA?: string;
    offerB?: string;
  }) => {
    if (!offers.offerA && !offers.offerB) return;

    try {
      await updateUsedBike({
        usedBikeId: usedBike.id,
        payload: {
          ...(offers.offerA && { offer_a: offers.offerA }),
          ...(offers.offerB && { offer_b: offers.offerB }),
        },
      });
    } catch (error) {
      // El cálculo ya se mostró: esto solo afecta a la escala de la ficha
      toast({
        title: 'No se pudieron guardar los justiprecios',
        description: getUsedBikeErrorMessage(
          error,
          'El cálculo se muestra igual, pero no quedó guardado en la unidad.'
        ),
        variant: 'destructive',
      });
    }
  };

  /**
   * Guarda el precio de compra acordado apenas se confirma en la escala.
   *
   * Se deja escapar el error para que la etapa 2 lo avise: acá el `cost` es lo
   * único que viaja, y `null` es un borrado deliberado del campo.
   */
  const handleSaveOfferedPrice = async (offeredPrice: number | null) => {
    await updateUsedBike({
      usedBikeId: usedBike.id,
      payload: { cost: offeredPrice },
    });
  };

  /** Guarda el avance: los repuestos asignados hasta ahora */
  const handleSaveProgress = async () => {
    try {
      await updateUsedBike({
        usedBikeId: usedBike.id,
        // `productPrices` se reemplaza entero en cada PATCH: hay que mandar
        // todos los hallazgos, no solo el que se acaba de tocar.
        payload: {
          productPrices: issues.flatMap((issue) =>
            issue.products.map((product) => ({
              productId: product.productId,
              quantity: product.quantity,
              // Unitario: el total de la línea es `price * quantity`
              price: product.price,
              // Relación con la pregunta de la encuesta que este repuesto repara
              questionId: issue.questionId,
            }))
          ),
        },
      });

      toast({
        title: 'Progreso guardado',
        description: 'Se guardaron los repuestos asignados.',
      });
    } catch (error) {
      toast({
        title: 'No se pudieron guardar los repuestos',
        description: getUsedBikeErrorMessage(
          error,
          'Ocurrió un error al guardar los repuestos asignados.'
        ),
        variant: 'destructive',
      });
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions =
    version?.sections.reduce(
      (total, section) => total + section.questions.length,
      0
    ) ?? 0;

  const isSavingStageOne =
    isSubmittingResponse || isUpdatingResponse || isUpdatingUsedBike;

  /** Se repite arriba y al final del cuestionario */
  const stageOneActions = (
    <div className="flex items-center gap-3">
      {totalQuestions > 0 ? (
        <span className="text-sm text-muted-foreground">
          {answeredCount} de {totalQuestions} respondidas
        </span>
      ) : null}
      {usedBike.status !== 'approved' && usedBike.status !== 'rejected' && (
        <Button
          type="button"
          onClick={handleGoToStageTwo}
          disabled={!version || isSavingStageOne}
        >
          {isSavingStageOne ? 'Guardando...' : 'Continuar'}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stage === 1 ? onBack : () => setStage(1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>

          {canResign ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResign}
              disabled={isUpdatingUsedBike}
            >
              <UserMinus className="h-4 w-4 mr-1" />
              Ya no quiero ser el responsable
            </Button>
          ) : null}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{title ?? 'Evaluación'}</h2>
              <Badge variant="secondary">Etapa {stage} de 2</Badge>
              {hasResponse ? (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Enviada
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {usedBike.product.name} · Placa {usedBike.plate}
            </p>
          </div>
        </div>

        {/* En la etapa 2 el guardado vive junto a la puntuación */}
        {stage === 1 ? (
          <div className="flex items-center gap-3">{stageOneActions}</div>
        ) : null}
      </div>

      {stage === 1 ? (
        <>
          <p className="text-xs text-muted-foreground">
            {!hasResponse
              ? 'Las preguntas que no marques se registrarán como B.'
              : canEditAnswers
                ? 'Esta evaluación ya fue enviada. Como administrador puedes corregir lo respondido: los cambios se guardan al continuar.'
                : 'Esta evaluación ya fue enviada, por lo que sus respuestas no se pueden editar.'}
          </p>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Cargando evaluación...
            </p>
          ) : isError ? (
            <p className="text-sm text-destructive py-8 text-center">
              No se pudo cargar la evaluación.
            </p>
          ) : !version ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              La encuesta de evaluación aún no está publicada.
            </p>
          ) : (
            <>
              <EvaluationStageOne
                version={version}
                answers={answers}
                readOnly={!canEditAnswers}
                onSelect={handleSelect}
              />
              <div className="flex justify-end">{stageOneActions}</div>
            </>
          )}
        </>
      ) : (
        <EvaluationStageTwo
          issues={issues}
          score={score}
          savedProductPrices={savedProductPrices}
          askedPrice={usedBike.askedPrice}
          onAssignProduct={evaluationActions.assignProduct}
          onRemoveProduct={evaluationActions.removeProduct}
          onUpdatePrice={evaluationActions.updateProductPrice}
          onUpdateQuantity={evaluationActions.updateProductQuantity}
          onSaveProducts={handleSaveProgress}
          isSavingProducts={isUpdatingUsedBike}
          onSaveOffers={handleSaveOffers}
          onSaveOfferedPrice={handleSaveOfferedPrice}
          onDecision={handleDecision}
          isDecisionLoading={isUpdatingUsedBike || isApprovingUsedBike}
          isAlreadyApproved={!!usedBike.purchaseTransaction}
        />
      )}
    </div>
  );
}
