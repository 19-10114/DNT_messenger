import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

type BulkBikePrice = {
  product: number;
  cost: number;
  ep_price: number;
  dp_price: number;
  price: number;
  bulk_price: number;
};

/**
 * Hook para actualizar de forma masiva los precios de motos
 * @returns Mutación de react-query
 */
export function useBulkUpdateBikePrices() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation<any, Error, BulkBikePrice[]>({
    mutationFn: (products: BulkBikePrice[]) =>
      productsService.bulkUpdateBikePrices(token as string, products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBikes'] });
    },
  });
}
