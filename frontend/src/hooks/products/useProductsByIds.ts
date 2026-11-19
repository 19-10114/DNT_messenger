import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { applyQueryConfig } from '@/config/queryOptimization.config';
import { ProductsService } from '@/services/products/products.service';
import { ProductByIdsItem } from '@/services/products/types/ProductsByIds.type';
import { useToken } from '@/stores/auth/auth.store';

const productsService = new ProductsService();

/**
 * Hook para resolver varios productos por id en una sola llamada.
 *
 * Pensado para listados que solo guardan ids (los `productPrices` de una moto
 * usada, las líneas de una orden) y necesitan el nombre o el precio para
 * pintarse. Se consulta con los ids únicos y ordenados, así el mismo conjunto
 * reusa la caché aunque llegue en otro orden o repetido.
 *
 * @param ids - Ids de producto; con la lista vacía no se consulta nada
 * @returns Productos, el índice por id, los ids sin coincidencia y los estados
 */
export function useProductsByIds(ids: number[]) {
  const token = useToken();

  // Sin ordenar y sin deduplicar, el mismo conjunto generaría claves distintas.
  // No hace falta memoizarlo: React Query serializa la clave, no la compara por
  // referencia.
  const uniqueIds = Array.from(new Set(ids)).sort((a, b) => a - b);

  const { data, isInitialLoading, isError, error, refetch } = useQuery({
    queryKey: ['productsByIds', token, uniqueIds],
    queryFn: () => productsService.getProductsByIds(token as string, uniqueIds),
    enabled: !!token && uniqueIds.length > 0,
    ...applyQueryConfig('PRODUCTS'),
  });

  /** El backend responde en orden de base de datos: hay que indexar por id */
  const productsById = useMemo(
    () =>
      new Map<number, ProductByIdsItem>(
        (data?.products ?? []).map((product) => [product.id, product])
      ),
    [data]
  );

  return {
    products: data?.products ?? [],
    productsById,
    /** Ids que ya no existen: el borrado de productos es definitivo */
    missingProductIds: data?.missingIds ?? [],
    isLoadingProductsByIds: isInitialLoading,
    isErrorProductsByIds: isError,
    productsByIdsError: error,
    refetchProductsByIds: refetch,
  };
}
