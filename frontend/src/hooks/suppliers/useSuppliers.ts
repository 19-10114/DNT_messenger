import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SuppliersService } from '@/services/suppliers/suppliers.service';
import {
  GetSuppliersQueryParams,
  SupplierPayload,
} from '@/services/suppliers/types/Supplier.type';
import { useToken } from '@/stores/auth/auth.store';

const suppliersService = new SuppliersService();

/** Listado paginado de proveedores (la página Proveedores). */
export function useSuppliers(params: GetSuppliersQueryParams = {}) {
  const token = useToken();

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['suppliers', token, params],
    queryFn: () => suppliersService.getSuppliers(token, params),
    enabled: !!token,
    keepPreviousData: true,
  });

  return {
    suppliers: data?.results ?? [],
    pagination: {
      currentPage: data?.currentPage ?? 1,
      totalPages: data?.totalPages ?? 1,
      totalElements: data?.totalElements ?? 0,
      pageSize: data?.pageSize ?? 10,
    },
    isLoading,
    isFetching,
    isError,
  };
}

/**
 * Proveedores activos que coinciden con `search` (nombre o RIF), para los
 * selectores. Solo se pide mientras el selector está abierto.
 */
export function useSupplierSearch(search: string, enabled: boolean) {
  const token = useToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['suppliers', token, 'search', search],
    queryFn: () =>
      suppliersService.getSuppliers(token, { search, pageSize: '20' }),
    enabled: !!token && enabled,
    keepPreviousData: true,
  });

  return {
    suppliers: data?.results ?? [],
    isLoading: isLoading && enabled,
    isError,
  };
}

/** Crear (sin `id`) o editar (con `id`) un proveedor. */
export function useSaveSupplier() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: SupplierPayload }) =>
      id
        ? suppliersService.updateSupplier(token, id, payload)
        : suppliersService.createSupplier(token, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useSetSupplierActive() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      suppliersService.setSupplierActive(token, id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}
