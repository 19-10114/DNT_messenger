import { useQuery } from '@tanstack/react-query';

import { PagesService } from '@/services/pages/pages.service';

const pagesService = new PagesService();

/**
 * Productos del catálogo para el selector del editor de Páginas
 * @param token - Token de autenticación
 * @param search - Texto a buscar (nombre, marca, modelo o SKU)
 * @param category - 1 = motos, 2 = repuestos
 */
export function usePageProducts(
  token: string | undefined,
  search: string,
  category: 1 | 2
) {
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['pageProducts', token, search, category],
    queryFn: () =>
      pagesService.searchProducts(token as string, search, category),
    enabled: !!token,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  return {
    pageProducts: data ?? [],
    isLoadingPageProducts: isLoading,
    isFetchingPageProducts: isFetching,
    isErrorPageProducts: isError,
  };
}
