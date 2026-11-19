import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SurveyService } from '@/services/surveys/surveys.service';
import {
  GetResponsesQueryParams,
  SubmitAnswerPayload,
  SurveyResponseSource,
} from '@/services/surveys/types';

const surveyService = new SurveyService();

/**
 * Hook para el listado paginado de respuestas de una encuesta
 * @param token - Token de autenticación
 * @param surveyId - Id de la encuesta
 * @param queryParameters - Paginación y filtro por versión
 * @returns Página de respuestas y estados de la consulta
 */
export function useSurveyResponses(
  token: string | undefined,
  surveyId: number | undefined,
  queryParameters: GetResponsesQueryParams = {}
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['surveyResponses', token, surveyId, queryParameters],
    queryFn: () =>
      surveyService.getSurveyResponses(
        token as string,
        surveyId as number,
        queryParameters
      ),
    enabled: !!token && !!surveyId,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return {
    responses: data?.results ?? [],
    pagination: data,
    isLoadingResponses: isLoading,
    isErrorResponses: isError,
    responsesError: error,
    refetchResponses: refetch,
  };
}

/**
 * Hook para el detalle de una respuesta
 * @param token - Token de autenticación
 * @param responseId - Id de la respuesta
 * @returns Respuesta con sus answers y estados de la consulta
 */
export function useSurveyResponse(
  token: string | undefined,
  responseId: number | undefined
) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['surveyResponse', token, responseId],
    queryFn: () =>
      surveyService.getResponseById(token as string, responseId as number),
    enabled: !!token && !!responseId,
    refetchOnWindowFocus: false,
  });

  return {
    response: data,
    isLoadingResponse: isLoading,
    isErrorResponse: isError,
    responseError: error,
  };
}

/**
 * Hook para enviar respuestas contra la versión publicada actual
 * @param token - Token de autenticación
 * @returns Función y estados del envío
 */
export function useSubmitSurveyResponse(token: string | undefined) {
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: ({
      surveyId,
      answers,
      source,
    }: {
      surveyId: number;
      answers: SubmitAnswerPayload[];
      source?: SurveyResponseSource;
    }) =>
      surveyService.submitResponse(token as string, surveyId, answers, source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyResponses'] });
    },
  });

  return {
    submitResponse: submitMutation.mutateAsync,
    isSubmittingResponse: submitMutation.isLoading,
    submitResponseError: submitMutation.error,
  };
}

/**
 * Hook para la revisión de staff de una respuesta ya enviada.
 *
 * El PATCH es un upsert y devuelve la respuesta recalculada, así que se siembra
 * en la caché del detalle antes de invalidar los listados.
 *
 * @param token - Token de autenticación (el usuario debe ser staff)
 * @returns Función y estados de la actualización
 */
export function useUpdateSurveyResponse(token: string | undefined) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({
      responseId,
      answers,
    }: {
      responseId: number;
      answers: SubmitAnswerPayload[];
    }) => surveyService.updateResponse(token as string, responseId, answers),
    onSuccess: (response) => {
      queryClient.setQueryData(
        ['surveyResponse', token, response.id],
        response
      );
      queryClient.invalidateQueries({ queryKey: ['surveyResponses'] });
    },
  });

  return {
    updateResponse: updateMutation.mutateAsync,
    isUpdatingResponse: updateMutation.isLoading,
    updateResponseError: updateMutation.error,
  };
}
