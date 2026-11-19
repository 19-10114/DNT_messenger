import { useQuery } from '@tanstack/react-query';

import { PagesService } from '@/services/pages/pages.service';

const pagesService = new PagesService();

/**
 * Una página con todos sus bloques, para el editor
 * @param token - Token de autenticación
 * @param pageId - Id de la página
 */
export function usePage(token: string | undefined, pageId: number | undefined) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['page', token, pageId],
    queryFn: () => pagesService.getPage(token as string, pageId as number),
    enabled: !!token && !!pageId,
    // El editor trabaja sobre un borrador local: no se recarga solo
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  return {
    page: data,
    isLoadingPage: isLoading,
    isErrorPage: isError,
    pageError: error,
    refetchPage: refetch,
  };
}
