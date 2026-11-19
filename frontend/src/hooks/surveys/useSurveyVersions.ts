import { useQuery } from '@tanstack/react-query';
import { SurveyService } from '@/services/surveys/surveys.service';

const surveyService = new SurveyService();

/**
 * Hook para el historial de versiones de una encuesta
 * @param token - Token de autenticación
 * @param surveyId - Id de la encuesta
 * @returns Versiones ordenadas de más reciente a más antigua
 */
export function useSurveyVersions(
  token: string | undefined,
  surveyId: number | undefined
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['surveyVersions', token, surveyId],
    queryFn: () =>
      surveyService.getVersions(token as string, surveyId as number),
    enabled: !!token && !!surveyId,
    refetchOnWindowFocus: false,
  });

  const versions = [...(data ?? [])].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  return {
    versions,
    isLoadingVersions: isLoading,
    isErrorVersions: isError,
    versionsError: error,
    refetchVersions: refetch,
  };
}

/**
 * Hook para una versión concreta con todas sus preguntas.
 *
 * Es la vía para conocer las preguntas de staff: la respuesta enviada solo
 * trae las que ya tienen answer, así que el revisor necesita la versión para
 * ver las que quedan pendientes.
 *
 * @param token - Token de autenticación
 * @param surveyId - Id de la encuesta
 * @param versionNumber - Número de versión (no el id de la versión)
 * @returns Versión con sus secciones y estados de la consulta
 */
export function useSurveyVersion(
  token: string | undefined,
  surveyId: number | undefined,
  versionNumber: number | undefined
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['surveyVersion', token, surveyId, versionNumber],
    queryFn: () =>
      surveyService.getVersion(
        token as string,
        surveyId as number,
        versionNumber as number
      ),
    enabled: !!token && !!surveyId && !!versionNumber,
    refetchOnWindowFocus: false,
  });

  return {
    version: data ?? null,
    isLoadingVersion: isLoading,
    isErrorVersion: isError,
    versionError: error,
    refetchVersion: refetch,
  };
}
