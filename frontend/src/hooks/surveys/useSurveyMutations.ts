import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SurveyService } from '@/services/surveys/surveys.service';
import {
  BulkEditSurveyPayload,
  CreateSurveyPayload,
} from '@/services/surveys/types';

const surveyService = new SurveyService();

/**
 * Hook con las mutaciones de administración de encuestas
 * @param token - Token de autenticación
 * @returns Funciones y estados para crear, editar, publicar y archivar
 */
export function useSurveyMutations(token: string | undefined) {
  const queryClient = useQueryClient();

  const invalidateSurvey = (surveyId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['surveys'] });
    queryClient.invalidateQueries({ queryKey: ['survey'] });
    if (surveyId) {
      queryClient.invalidateQueries({ queryKey: ['surveyVersions'] });
    }
  };

  const createSurveyMutation = useMutation({
    mutationFn: (payload: CreateSurveyPayload) =>
      surveyService.createSurvey(token as string, payload),
    onSuccess: (survey) => invalidateSurvey(survey.id),
  });

  const bulkEditSurveyMutation = useMutation({
    mutationFn: ({
      surveyId,
      payload,
    }: {
      surveyId: number;
      payload: BulkEditSurveyPayload;
    }) => surveyService.bulkEditSurvey(token as string, surveyId, payload),
    onSuccess: (survey) => invalidateSurvey(survey.id),
  });

  const publishVersionMutation = useMutation({
    mutationFn: ({
      surveyId,
      versionNumber,
    }: {
      surveyId: number;
      versionNumber: number;
    }) =>
      surveyService.publishVersion(token as string, surveyId, versionNumber),
    onSuccess: (_data, variables) => invalidateSurvey(variables.surveyId),
  });

  const archiveSurveyMutation = useMutation({
    mutationFn: (surveyId: number) =>
      surveyService.archiveSurvey(token as string, surveyId),
    onSuccess: () => invalidateSurvey(),
  });

  return {
    createSurvey: createSurveyMutation.mutateAsync,
    isCreatingSurvey: createSurveyMutation.isLoading,
    createSurveyError: createSurveyMutation.error,

    bulkEditSurvey: bulkEditSurveyMutation.mutateAsync,
    isEditingSurvey: bulkEditSurveyMutation.isLoading,
    editSurveyError: bulkEditSurveyMutation.error,

    publishVersion: publishVersionMutation.mutateAsync,
    isPublishingVersion: publishVersionMutation.isLoading,
    publishVersionError: publishVersionMutation.error,

    archiveSurvey: archiveSurveyMutation.mutateAsync,
    isArchivingSurvey: archiveSurveyMutation.isLoading,
    archiveSurveyError: archiveSurveyMutation.error,
  };
}
