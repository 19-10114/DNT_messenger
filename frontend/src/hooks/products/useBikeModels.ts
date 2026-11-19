import { useMemo } from 'react';
import { useAllBikes } from './useAllBikes';

/** Categoría de productos que corresponde a motos */
const BIKE_CATEGORY = 1;

/** Se pide una página grande para tener el catálogo completo en el selector */
const PAGE_SIZE = '200';

/**
 * Hook con los modelos de moto disponibles para un selector.
 * Reutiliza `getAllBikes` y deja solo los de la categoría de motos.
 * @returns Modelos ordenados por nombre y estados de la consulta
 */
export function useBikeModels() {
  const { data, isLoading, isError, refetch } = useAllBikes({
    pageSize: PAGE_SIZE,
    page: '1',
  });

  const models = useMemo(() => {
    const results = data?.results ?? [];
    return results
      .filter((bike) => bike.category === BIKE_CATEGORY && bike.mfb === false)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  return {
    models,
    isLoadingModels: isLoading,
    isErrorModels: isError,
    refetchModels: refetch,
  };
}
