import { useQuery } from '@tanstack/react-query';
import { SurveyService } from '@/services/surveys/surveys.service';

const surveyService = new SurveyService();

/**
 * Hook para resolver una encuesta por su slug (rutas dinámicas del tipo
 * `/encuestas/[slug]`).
 *
 * A diferencia de `useSurvey`, no exige token: la autenticación la decide la
 * propia encuesta con su `requiresAuthentication`, así que una encuesta pública
 * se renderiza para un visitante anónimo.
 *
 * @param slug - Slug de la encuesta
 * @param token - Token de autenticación; solo hace falta si la encuesta es privada
 * @param versionNumber - Número de versión; sin él resuelve la publicada actual
 * @returns Detalle de la encuesta y estados de la consulta
 */
export function useSurveyBySlug(
  slug: string | undefined,
  token?: string,
  versionNumber?: number
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['surveyBySlug', token ?? null, slug, versionNumber ?? null],
    queryFn: () =>
      surveyService.getSurveyBySlug(token, slug as string, versionNumber),
    enabled: !!slug,
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
