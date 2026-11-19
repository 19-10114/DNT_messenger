import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { UsersService } from '@/services/users/users.service';
import { UserItem } from '@/services/users/types/usersBackendResponse.types';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';

interface UseMechanicsProps {
  enabled?: boolean;
}

/**
 * Hook con los mecánicos de la sucursal activa.
 * Mismo listado que `useSellers`, pero con el rol `mechanic`. Trae la sucursal
 * entera de una vez; para un selector con buscador usa `useUsers`.
 */
export const useMechanics = ({ enabled = true }: UseMechanicsProps = {}) => {
  const token = useToken();
  const usersService = useMemo(() => new UsersService(), []);
  const branchId = useCurrentBranchId();
  const branchIdString =
    branchId !== undefined && branchId !== null
      ? branchId.toString()
      : undefined;

  const {
    data: mechanicsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['mechanics', { token, branchIdString }],
    queryFn: () =>
      usersService.getUsers(token as string, 'mechanic', branchIdString, {
        page: '1',
        pageSize: '1000',
      }),
    enabled: !!token && enabled,
  });

  const mechanics = useMemo(() => {
    if (!mechanicsData?.results) return [];
    return mechanicsData.results.map((mechanic: UserItem) => ({
      id: String(mechanic.id),
      name: `${mechanic.firstName} ${mechanic.lastName}`.trim(),
      ci: mechanic.documentId || '',
    }));
  }, [mechanicsData]);

  return {
    mechanics,
    isLoading,
    isError,
    refetch,
  };
};
