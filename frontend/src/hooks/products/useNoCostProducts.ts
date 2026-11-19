import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/**
 * Hook para obtener los productos sin costo
 * @returns JSON response con toda la información de productos sin costo
 */
export function useNoCostProducts() {
  const token = useToken();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['noCostProducts', token],
    queryFn: () => productsService.getNoCostProducts(token as string),
    enabled: !!token,
  });

  return {
    data: data?.data,
    isLoading,
    isError,
    refetch,
  };
}
