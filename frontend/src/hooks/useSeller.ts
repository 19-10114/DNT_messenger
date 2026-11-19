// hooks/users/useSellers.ts
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { UsersService } from '@/services/users/users.service';
import { UserItem } from '@/services/users/types/usersBackendResponse.types';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';

interface UseSellersProps {
  enabled?: boolean;
}

export const useSellers = ({ enabled = true }: UseSellersProps = {}) => {
  const token = useToken();
  const usersService = useMemo(() => new UsersService(), []);
  const branchId = useCurrentBranchId();
  const branchIdString =
    branchId !== undefined && branchId !== null
      ? branchId.toString()
      : undefined;

  const {
    data: sellersData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['sellers', { token, branchIdString }],
    queryFn: () =>
      usersService.getUsers(token as string, 'seller', branchIdString, {
        page: '1',
        pageSize: '1000',
      }),
    enabled: !!token && enabled,
  });

  const sellers = useMemo(() => {
    if (!sellersData?.results) return [];
    return sellersData.results.map((seller: UserItem) => ({
      id: String(seller.id),
      name: `${seller.firstName} ${seller.lastName}`.trim(),
      ci: seller.documentId || '',
    }));
  }, [sellersData]);

  return {
    sellers,
    isLoading,
    isError,
    refetch,
  };
};
