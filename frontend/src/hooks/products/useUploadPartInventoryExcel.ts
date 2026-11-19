import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/**
 * Hook para cargar un archivo Excel y actualizar el inventario de repuestos
 * @returns Mutación de react-query
 */
export function useUploadPartInventoryExcel() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation<any, Error, { file: File; searchParam?: string }>({
    mutationFn: ({ file, searchParam }) =>
      productsService.uploadPartInventoryExcel(
        token as string,
        file,
        searchParam
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partInventory'] });
      queryClient.invalidateQueries({ queryKey: ['allParts'] });
    },
  });
}
