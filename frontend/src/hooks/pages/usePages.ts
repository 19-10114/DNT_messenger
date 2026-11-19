import { useQuery } from '@tanstack/react-query';

import { PagesService } from '@/services/pages/pages.service';
import { GetPagesQueryParams } from '@/services/pages/types';

const pagesService = new PagesService();

/**
 * Listado paginado de páginas públicas
 * @param token - Token de autenticación
 * @param queryParameters - Paginación, estado y búsqueda
 */
export function usePages(
  token: string | undefined,
  queryParameters: GetPagesQueryParams = {}
) {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['pages', token, queryParameters],
    queryFn: () => pagesService.getPages(token as string, queryParameters),
    enabled: !!token,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return {
    pages: data?.results ?? [],
    pagination: data,
    isLoadingPages: isLoading,
    isFetchingPages: isFetching,
    isErrorPages: isError,
    refetchPages: refetch,
  };
}
