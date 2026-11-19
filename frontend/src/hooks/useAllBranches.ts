import { useQuery } from '@tanstack/react-query';
import { BranchService } from '@/services/branches/branch.service';
import { useToken } from '@/stores/auth/auth.store';
import { applyQueryConfig } from '@/config/queryOptimization.config';

const branchService = new BranchService();

/**
 * Hook para obtener todas las sucursales MC
 * @returns Objeto con datos, estados y función de refetch para todas las sucursales
 */
export function useAllBranches() {
  const token = useToken();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['allMcBranches', token],
    queryFn: () => branchService.getAllMcBranches(token as string),
    enabled: !!token,
    ...applyQueryConfig('BRANCHES'),
  });

  return {
    data: data?.data,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Todas las sucursales sin exclusión de rol -- incluye "empire" (proveedor),
 * "Ventas" y "Dale Play" (cuentas de venta), que useAllBranches oculta a
 * propósito. Para filtros de origen/destino, donde esos son valores válidos.
 */
export function useAllBranchesUnfiltered() {
  const token = useToken();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['allBranchesUnfiltered', token],
    queryFn: () => branchService.getAllBranchesUnfiltered(token as string),
    enabled: !!token,
    ...applyQueryConfig('BRANCHES'),
  });

  return {
    data: data?.data,
    isLoading,
    isError,
    refetch,
  };
}
