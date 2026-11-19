import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/**
 * Hook para actualizar de forma masiva los precios de repuestos mediante un archivo
 * @returns Mutación de react-query
 */
export function useBulkUpdatePartPrices() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation<any, Error, File>({
    mutationFn: (file: File) =>
      productsService.bulkUpdatePartPrices(token as string, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allParts'] });
      queryClient.invalidateQueries({ queryKey: ['partInventory'] });
    },
  });
}
