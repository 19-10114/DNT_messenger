import { useQuery } from '@tanstack/react-query';
import { PurchasesService } from '@/services/purchases/purchases.service';
import { ProductBranchBreakdownData } from '@/services/purchases/types/ProcurementAnalysis.type';
import { useToken } from '@/stores/auth/auth.store';

const purchasesService = new PurchasesService();

/**
 * "Ver detalle" — desglose por sucursal de un repuesto. Ver ARCHITECTURE.md
 * (ProcurementProductBranchesView / GET
 * /purchases/procurement-analysis/product/<productId>). Solo se activa
 * cuando el modal está abierto (`enabled`), para no pedir esto de más.
 */
export function useProductBranchBreakdown(
  productId: number | undefined,
  enabled: boolean
) {
  const token = useToken();

  const { data, isLoading, isError, error } = useQuery<
    ProductBranchBreakdownData,
    Error
  >({
    queryKey: ['productBranchBreakdown', token, productId],
    queryFn: () =>
      purchasesService.getProductBranchBreakdown(token, productId as number),
    enabled: !!token && !!productId && enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading, isError, error };
}
