import { useMutation } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import {
  UsedBikePricingCase,
  UsedBikePricingPayload,
} from '@/services/products/types/UsedBikePricing.type';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/** Se piden los dos casos: la UI muestra ambas estrategias lado a lado */
const BOTH_STRATEGIES: UsedBikePricingCase = 3;

/**
 * Hook para calcular el rango de compra de una moto usada.
 * Es cálculo puro en el backend: no persiste nada, se puede llamar a demanda.
 * @returns Función de cálculo, el resultado y los estados de la llamada
 */
export function useUsedBikePricing() {
  const token = useToken();

  const { mutateAsync, data, isLoading, isError, error, reset } = useMutation({
    mutationFn: ({
      payload,
      pricingCase = BOTH_STRATEGIES,
    }: {
      payload: UsedBikePricingPayload;
      pricingCase?: UsedBikePricingCase;
    }) =>
      productsService.calculateUsedBikePricing(
        token as string,
        pricingCase,
        payload
      ),
  });

  return {
    calculatePricing: mutateAsync,
    pricing: data,
    isCalculatingPricing: isLoading,
    isErrorPricing: isError,
    pricingError: error,
    resetPricing: reset,
  };
}
