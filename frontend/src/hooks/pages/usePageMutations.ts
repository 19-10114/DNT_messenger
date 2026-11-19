import { useMutation, useQueryClient } from '@tanstack/react-query';

import { PagesService } from '@/services/pages/pages.service';
import {
  CreatePagePayload,
  PageBlockPayload,
  PageDetail,
  UpdatePageMetaPayload,
} from '@/services/pages/types';

const pagesService = new PagesService();

/**
 * Mutaciones de administración de páginas
 * @param token - Token de autenticación
 */
export function usePageMutations(token: string | undefined) {
  const queryClient = useQueryClient();

  /** El detalle que devuelve el servidor reemplaza la caché del editor */
  const storeDetail = (page: PageDetail) => {
    queryClient.setQueryData(['page', token, page.id], page);
    queryClient.invalidateQueries({ queryKey: ['pages'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreatePagePayload) =>
      pagesService.createPage(token as string, payload),
    onSuccess: storeDetail,
  });

  /**
   * Guardado del editor: primero los datos de la página y después los
   * bloques. En ese orden, la limpieza de imágenes del backend ya ve la
   * imagen para compartir nueva y no borra la recién elegida.
   */
  const saveMutation = useMutation({
    mutationFn: async ({
      pageId,
      meta,
      blocks,
    }: {
      pageId: number;
      meta?: UpdatePageMetaPayload;
      blocks: PageBlockPayload[];
    }) => {
      if (meta && Object.keys(meta).length > 0) {
        await pagesService.updateMeta(token as string, pageId, meta);
      }
      return pagesService.replaceBlocks(token as string, pageId, blocks);
    },
    onSuccess: storeDetail,
  });

  const publishMutation = useMutation({
    mutationFn: (pageId: number) =>
      pagesService.publish(token as string, pageId),
    onSuccess: storeDetail,
  });

  const unpublishMutation = useMutation({
    mutationFn: (pageId: number) =>
      pagesService.unpublish(token as string, pageId),
    onSuccess: storeDetail,
  });

  const duplicateMutation = useMutation({
    mutationFn: (pageId: number) =>
      pagesService.duplicate(token as string, pageId),
    onSuccess: storeDetail,
  });

  const archiveMutation = useMutation({
    mutationFn: (pageId: number) =>
      pagesService.archive(token as string, pageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pages'] }),
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ pageId, file }: { pageId: number; file: File }) =>
      pagesService.uploadImage(token as string, pageId, file),
  });

  return {
    createPage: createMutation.mutateAsync,
    isCreatingPage: createMutation.isLoading,

    savePage: saveMutation.mutateAsync,
    isSavingPage: saveMutation.isLoading,

    publishPage: publishMutation.mutateAsync,
    isPublishingPage: publishMutation.isLoading,

    unpublishPage: unpublishMutation.mutateAsync,
    isUnpublishingPage: unpublishMutation.isLoading,

    duplicatePage: duplicateMutation.mutateAsync,
    isDuplicatingPage: duplicateMutation.isLoading,

    archivePage: archiveMutation.mutateAsync,
    isArchivingPage: archiveMutation.isLoading,

    uploadPageImage: uploadImageMutation.mutateAsync,
    isUploadingPageImage: uploadImageMutation.isLoading,
  };
}
