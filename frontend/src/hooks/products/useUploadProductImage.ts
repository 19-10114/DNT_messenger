import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import {
  CreateNewProductErrorResponse,
  CreateNewProductSuccessfullyResponse,
} from '@/services/products/types/CreateNewProduct.type';

const productsService = new ProductsService();

/**
 * Hook para subir la imagen de un producto
 * @returns Mutación de react-query
 */
export function useUploadProductImage() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation<
    CreateNewProductSuccessfullyResponse | CreateNewProductErrorResponse,
    Error,
    { image: File; productId: string }
  >({
    mutationFn: ({ image, productId }) =>
      productsService.postImage(token as string, image, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
