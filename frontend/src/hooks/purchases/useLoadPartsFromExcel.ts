import { useMutation } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { parsePartsTemplate } from '@/utils/partsTemplate.utils';
import {
  PartsFromExcelResult,
  resolvePartsTemplateRows,
} from '@/utils/purchaseCartExcel.utils';

const productsService = new ProductsService();

/**
 * Lee la plantilla de repuestos subida y la convierte en líneas para el
 * carrito de preorden de compra (ver `resolvePartsTemplateRows` para las
 * reglas). Es un `useMutation` porque es una acción puntual sobre un archivo,
 * no una lectura que valga la pena cachear.
 */
export function useLoadPartsFromExcel() {
  const token = useToken();

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<PartsFromExcelResult> =>
      resolvePartsTemplateRows(
        await parsePartsTemplate(file),
        async (ids, skus) =>
          (await productsService.getProductsByIds(token as string, ids, skus))
            .products
      ),
  });

  return {
    loadPartsFromExcel: mutation.mutateAsync,
    isLoadingPartsFromExcel: mutation.isLoading,
    loadPartsFromExcelError: mutation.error as Error | null,
    resetLoadPartsFromExcel: mutation.reset,
  };
}
