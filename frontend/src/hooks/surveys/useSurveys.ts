import { useQuery } from '@tanstack/react-query';
import { SurveyService } from '@/services/surveys/surveys.service';
import { GetSurveysQueryParams } from '@/services/surveys/types';

const surveyService = new SurveyService();

/**
 * Hook para el listado paginado de encuestas
 * @param token - Token de autenticación
 * @param queryParameters - Paginación y búsqueda
 * @returns Página de encuestas y estados de la consulta
 */
export function useSurveys(
  token: string | undefined,
  queryParameters: GetSurveysQueryParams = {}
) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['surveys', token, queryParameters],
    queryFn: () => surveyService.getSurveys(token as string, queryParameters),
    enabled: !!token,
    keepPreviousData: true,
    // El listado se recarga con el botón de actualizar, no al recuperar el foco
    refetchOnWindowFocus: false,
  });

  return {
    surveys: data?.results ?? [],
    pagination: data,
    isLoadingSurveys: isLoading,
    isFetchingSurveys: isFetching,
    isErrorSurveys: isError,
    surveysError: error,
    refetchSurveys: refetch,
  };
}
