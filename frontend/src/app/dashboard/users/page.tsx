'use client';
import { useAuthService, useToken, useRoles } from '@/stores/auth/auth.store';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Button } from '@/components/ui/button.component';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { UserList } from '@/components/user/userList.component';
import {
  useBranches,
  useBranchActions,
  useCurrentBranchId,
} from '@/stores/branch/branch.store';
import { useMappedConstants } from '@/hooks/useMappedConstants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';

export type PageInfo = { page: string; pageSize: string };

export default function UsersPage() {
  const authService = useAuthService();
  const searchParams = useSearchParams();
  const token = useToken() || '';
  const roles = useRoles();
  const isAdmin = roles.includes('admin');
  const isPartsAdmin = roles.includes('parts_admin');
  const currentBranchId = useCurrentBranchId();

  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(
    currentBranchId ? currentBranchId.toString() : '0'
  );
  const [selectedRole, setSelectedRole] = useState('');
  const [pageInfo, setPageInfo] = useState({ page: '1', pageSize: '10' });

  const branches = useBranches();
  const { fetchBranches } = useBranchActions();
  const { getAllowedRoles, isLoading: rolesLoading } = useMappedConstants();

  const filteredBranches = branches.filter(
    (branch) =>
      !['ventas', 'utilidades', 'ganancias', 'ingresos', 'dale play'].includes(
        branch.name.toLowerCase()
      ) &&
      !['ventas', 'utilidades', 'ganancias', 'ingresos', 'dale play'].includes(
        branch.type.toLowerCase()
      )
  );

  const allowedRoles = isAdmin
    ? getAllowedRoles('admin')
    : isPartsAdmin
      ? getAllowedRoles('parts_admin')
      : null;

  const showBranchColumn = selectedBranch === '0';
  const showRoleColumn = selectedRole === '';

  useEffect(() => {
    if (token && branches.length === 0) {
      fetchBranches(token);
    }
  }, [token, branches.length, fetchBranches]);

  const debouncedSearchTerm = useDebouncedCallback((value: string) => {
    if (value.length >= 3 || value.length === 0) {
      setSearchTerm(value);
      setPageInfo((prev) => ({ ...prev, page: '1' }));
    }
  }, 1000);

  const usersQuery = useQuery({
    queryKey: [
      'user',
      token,
      pageInfo,
      searchTerm,
      selectedBranch,
      selectedRole,
    ],
    queryFn: async () => {
      const params = {
        ...pageInfo,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch &&
          selectedBranch !== '0' && { branch: selectedBranch }),
        ...(selectedRole && { role: selectedRole }),
      };
      return authService.getUsers(token, params);
    },
    refetchOnWindowFocus: false,
  });

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
    setPageInfo((prev) => ({ ...prev, page: '1' }));
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value === 'all' ? '' : value);
    setPageInfo((prev) => ({ ...prev, page: '1' }));
  };

  useEffect(() => {
    const initialSearch = searchParams.get('search');
    if (initialSearch) {
      setInputValue(initialSearch);
      setSearchTerm(initialSearch);
    }
  }, [searchParams, debouncedSearchTerm]);

  return (
    <>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Usuarios
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización, Gestión y Administración de Usuarios
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-end md:gap-4">
        {/* Filtros — izquierda */}
        {(isAdmin || isPartsAdmin) && allowedRoles !== null && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-600">
                Sucursal
              </span>
              <Select value={selectedBranch} onValueChange={handleBranchChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sucursal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todas</SelectItem>
                  {filteredBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-600">Rol</span>
              <Select
                value={selectedRole || 'all'}
                onValueChange={handleRoleChange}
                disabled={rolesLoading}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Rol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {allowedRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Actualizar */}
        <button
          onClick={() => usersQuery.refetch()}
          disabled={usersQuery.isFetching}
          title="Actualizar tabla"
          className="self-start p-2 rounded-md text-gray-500 transition-all duration-200 hover:text-gray-900 hover:bg-gray-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed md:self-end"
        >
          <RefreshCw
            size={16}
            className={usersQuery.isFetching ? 'animate-spin' : ''}
          />
        </button>

        {/* Acciones — derecha */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:ml-auto">
          <Link href="/dashboard/users/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Crear usuario</Button>
          </Link>
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              debouncedSearchTerm(e.target.value);
            }}
            className="w-full sm:w-auto px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <UserList
        paginatedUsers={usersQuery.data}
        isLoading={usersQuery.isLoading}
        showBranchColumn={showBranchColumn}
        showRoleColumn={showRoleColumn}
        onPageChange={(page) =>
          setPageInfo((prev) => ({ ...prev, page: String(page) }))
        }
      />
    </>
  );
}
