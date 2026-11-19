import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import {
  ApproveUsedBikePayload,
  CreateUsedBikePayload,
  UpdateUsedBikePayload,
} from '@/services/products/types/UsedBike.type';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/**
 * Hook con las mutaciones de motos usadas
 * @returns Funciones y estados para registrar, actualizar y eliminar
 */
export function useUsedBikeMutations() {
  const token = useToken();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['usedBikes'] });
    queryClient.invalidateQueries({ queryKey: ['usedBike'] });
  };

  const createUsedBikeMutation = useMutation({
    mutationFn: (payload: CreateUsedBikePayload) =>
      productsService.createUsedBike(token as string, payload),
    onSuccess: invalidate,
  });

  const updateUsedBikeMutation = useMutation({
    mutationFn: ({
      usedBikeId,
      payload,
    }: {
      usedBikeId: number;
      payload: UpdateUsedBikePayload;
    }) => productsService.updateUsedBike(token as string, usedBikeId, payload),
    onSuccess: invalidate,
  });

  /**
   * Aprueba la compra: el backend guarda `cost`, deriva `price`, crea la
   * transacción y pone el estado en `approved`. No hay que parchear nada aparte.
   */
  const approveUsedBikeMutation = useMutation({
    mutationFn: ({
      usedBikeId,
      payload,
      branchId,
    }: {
      usedBikeId: number;
      payload: ApproveUsedBikePayload;
      branchId?: number;
    }) =>
      productsService.approveUsedBike(
        token as string,
        usedBikeId,
        payload,
        branchId
      ),
    onSuccess: invalidate,
  });

  const deleteUsedBikeMutation = useMutation({
    mutationFn: (usedBikeId: number) =>
      productsService.deleteUsedBike(token as string, usedBikeId),
    onSuccess: invalidate,
  });

  return {
    createUsedBike: createUsedBikeMutation.mutateAsync,
    isCreatingUsedBike: createUsedBikeMutation.isLoading,
    createUsedBikeError: createUsedBikeMutation.error,

    updateUsedBike: updateUsedBikeMutation.mutateAsync,
    isUpdatingUsedBike: updateUsedBikeMutation.isLoading,
    updateUsedBikeError: updateUsedBikeMutation.error,

    approveUsedBike: approveUsedBikeMutation.mutateAsync,
    isApprovingUsedBike: approveUsedBikeMutation.isLoading,
    approveUsedBikeError: approveUsedBikeMutation.error,

    deleteUsedBike: deleteUsedBikeMutation.mutateAsync,
    isDeletingUsedBike: deleteUsedBikeMutation.isLoading,
    deleteUsedBikeError: deleteUsedBikeMutation.error,
  };
}
