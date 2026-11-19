import { useQuery } from '@tanstack/react-query';
import { SurveyService } from '@/services/surveys/surveys.service';

const surveyService = new SurveyService();

/**
 * Hook para el detalle de una encuesta junto con una versión para renderizar
 * @param token - Token de autenticación
 * @param surveyId - Id de la encuesta
 * @param versionNumber - Número de versión; sin él resuelve la publicada actual
 * @returns Detalle de la encuesta y estados de la consulta
 */
export function useSurvey(
  token: string | undefined,
  surveyId: number | undefined,
  versionNumber?: number
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['survey', token, surveyId, versionNumber ?? null],
    queryFn: () =>
      surveyService.getSurveyById(
        token as string,
        surveyId as number,
        versionNumber
      ),
    enabled: !!token && !!surveyId,
    refetchOnWindowFocus: false,
  });

  return {
    survey: data,
    version: data?.version ?? null,
    isLoadingSurvey: isLoading,
    isErrorSurvey: isError,
    surveyError: error,
    refetchSurvey: refetch,
  };
}
