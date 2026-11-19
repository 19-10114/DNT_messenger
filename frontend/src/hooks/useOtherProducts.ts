import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/**
 * Hook para obtener productos "otros".
 * Excluye el producto con id 11277 (Pago Dale Play) del listado.
 */
export function useOtherProducts() {
  const token = useToken();

  const otherProducts = useQuery({
    queryKey: ['otherProducts', token],
    queryFn: async () => {
      const response = await productsService.getOtherProducts(token as string);
      const results = response.data?.results || [];
      const filtered = results.filter((item: any) => item.id !== 11277);
      return { ...response, data: { ...response.data, results: filtered } };
    },
    enabled: !!token,
  });

  return {
    otherProducts: {
      data: otherProducts.data?.data,
      isLoading: otherProducts.isLoading,
      isError: otherProducts.isError,
      refetch: otherProducts.refetch,
    },
  };
}
