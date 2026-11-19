import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { UsersService } from '@/services/users/users.service';
import { GetUsersResponse } from '@/services/users/types/usersBackendResponse.types';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';

interface UseUsersProps {
  role: string;
  page?: string;
  pageSize?: string;
  search?: string;
  enabled?: boolean;
}

export const useUsers = ({
  role,
  page = '1',
  pageSize = '10',
  search = '',
  enabled = true,
}: UseUsersProps) => {
  const token = useToken();
  const usersService = useMemo(() => new UsersService(), []);
  const branchId = useCurrentBranchId();
  const branchIdString =
    branchId !== undefined && branchId !== null
      ? branchId.toString()
      : undefined;

  const {
    data: usersResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery<GetUsersResponse>({
    queryKey: [
      'users',
      { role, page, pageSize, search, token, branchIdString },
    ],
    queryFn: () =>
      usersService.getUsers(token as string, role, branchIdString, {
        page,
        pageSize,
        search: search || undefined,
      }),
    enabled: !!token && !!role && enabled,
  });

  const users = useMemo(() => usersResponse?.results ?? [], [usersResponse]);
  const totalPages = usersResponse?.totalPages ?? 1;
  const currentPage = usersResponse?.currentPage ?? Number(page);
  const totalElements = usersResponse?.totalElements ?? 0;

  return {
    users,
    totalPages,
    currentPage,
    totalElements,
    isLoading,
    isError,
    refetch,
  };
};
