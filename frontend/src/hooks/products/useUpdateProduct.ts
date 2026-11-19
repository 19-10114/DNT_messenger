import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/**
 * Hook para actualizar la información de un producto existente
 * @returns Mutación de react-query
 */
export function useUpdateProduct() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Partial<any>>({
    mutationFn: (productData: Partial<any>) =>
      productsService.patchProduct(token, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['partInventory'] });
      queryClient.invalidateQueries({ queryKey: ['bikeInventory'] });
      queryClient.invalidateQueries({ queryKey: ['allParts'] });
      queryClient.invalidateQueries({ queryKey: ['allBikes'] });
      queryClient.invalidateQueries({ queryKey: ['globalPartInventory'] });
    },
  });
}
