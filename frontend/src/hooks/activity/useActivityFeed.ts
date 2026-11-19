import { useQuery } from '@tanstack/react-query';

import { ActivityService } from '@/services/activity/activity.service';
import { GetActivityFeedQueryParams } from '@/services/activity/types';
import { useToken } from '@/stores/auth/auth.store';
import { ACTIVITY_FEED_QUERY_KEY } from './activityQueryKeys';

const activityService = new ActivityService();

/**
 * Feed paginado del registro de actividad ("quién hizo qué").
 *
 * Los filtros viajan tal cual al backend, que es quien pagina: el feed crece
 * todos los días y no tiene sentido traerlo entero al cliente.
 *
 * @param queryParameters - Paginación y filtros
 * @returns Eventos, paginación, opciones de actor y estados de la consulta
 */
export function useActivityFeed(queryParameters: GetActivityFeedQueryParams) {
  const token = useToken();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [ACTIVITY_FEED_QUERY_KEY, token, queryParameters],
    queryFn: () =>
      activityService.getActivityFeed(token as string, queryParameters),
    enabled: !!token,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    // Siempre fresco al abrirse: la acción que se quiere ver suele ser la que
    // se acaba de hacer (editar en "Información" y pasar a "Historial"), y
    // ningún guardado del resto de la app invalida esta caché.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return {
    activityEvents: data?.results ?? [],
    activityCurrentPage: data?.currentPage ?? 1,
    activityTotalPages: data?.totalPages ?? 0,
    activityTotalElements: data?.totalElements ?? 0,
    activityActors: data?.staticData?.actors ?? [],
    isLoadingActivity: isLoading,
    isFetchingActivity: isFetching,
    isErrorActivity: isError,
    refetchActivity: refetch,
  };
}
