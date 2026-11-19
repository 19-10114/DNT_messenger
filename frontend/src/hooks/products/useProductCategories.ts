import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/**
 * Hook para obtener todas las categorías de productos
 * @returns JSON response con toda la información de categorías
 */
export function useProductCategories() {
  const token = useToken();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['productCategories', token],
    queryFn: () => productsService.getAllCategories(token as string),
    enabled: !!token,
  });

  return {
    data,
    isLoading,
    isError,
    refetch,
  };
}
