import { useInfiniteQuery } from '@tanstack/react-query';

import { ActivityService } from '@/services/activity/activity.service';
import { ActivityTargetModel } from '@/services/activity/types';
import { useToken } from '@/stores/auth/auth.store';
import { ENTITY_ACTIVITY_QUERY_KEY } from './activityQueryKeys';

const activityService = new ActivityService();

/** Eventos por tanda: suficiente para ver lo reciente sin cargar todo */
export const ENTITY_ACTIVITY_PAGE_SIZE = 20;

/**
 * Historial de una entidad (una moto usada, una orden, un producto…), de lo
 * más reciente a lo más antiguo. Se carga por tandas: `loadMoreEntityActivity`
 * trae la siguiente, así un historial largo nunca se pide entero.
 *
 * @param targetModel - Tipo de entidad
 * @param targetId - Id de la entidad; sin id no se consulta
 * @param enabled - Permite no consultar cuando el usuario no tiene acceso
 */
export function useEntityActivity(
  targetModel: ActivityTargetModel,
  targetId: number | undefined,
  enabled = true
) {
  const token = useToken();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [ENTITY_ACTIVITY_QUERY_KEY, token, targetModel, targetId],
    queryFn: ({ pageParam = 1 }) =>
      activityService.getEntityActivity(
        token as string,
        targetModel,
        targetId as number,
        pageParam,
        ENTITY_ACTIVITY_PAGE_SIZE
      ),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined,
    enabled: enabled && !!token && targetId !== undefined,
    refetchOnWindowFocus: false,
    // Siempre fresco al abrirse: la acción que se quiere ver suele ser la que
    // se acaba de hacer (editar en "Información" y pasar a "Historial"), y
    // ningún guardado del resto de la app invalida esta caché.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return {
    entityActivity: data?.pages.flatMap((page) => page.results) ?? [],
    totalEntityActivity: data?.pages[0]?.totalElements ?? 0,
    hasMoreEntityActivity: !!hasNextPage,
    loadMoreEntityActivity: fetchNextPage,
    isLoadingMoreEntityActivity: isFetchingNextPage,
    isLoadingEntityActivity: isLoading,
    isErrorEntityActivity: isError,
  };
}
