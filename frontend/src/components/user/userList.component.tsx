'use client';
import { Pagination } from '@/models/pagination.model';
import { UserModel } from '@/models/user.model';
import { formatDate } from '@/lib/utils';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { labelsMap } from '@/hooks/useMappedConstants';

interface UserListProps {
  paginatedUsers?: Pagination<UserModel>;
  showBranchColumn?: boolean;
  showRoleColumn?: boolean;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
}

export function UserList({
  paginatedUsers,
  showBranchColumn = false,
  showRoleColumn = false,
  isLoading = false,
  onPageChange,
}: UserListProps) {
  const users = paginatedUsers?.results ?? [];

  const formatRole = (role: string | null | undefined) =>
    role
      ? role
          .split(',')
          .map((r) => labelsMap.roles[r.trim()] ?? r.trim())
          .join(', ')
      : '—';

  const columns: GenericTableColumn<UserModel>[] = [
    { key: 'documentId', header: 'Cédula' },
    { key: 'username', header: 'Nombre de usuario' },
    { key: 'firstName', header: 'Nombre' },
    { key: 'lastName', header: 'Apellido' },
    { key: 'email', header: 'Email' },
    { key: 'phoneNumber', header: 'Número de teléfono' },
    {
      key: 'dateJoined',
      header: 'Fecha de creación',
      render: (user) => formatDate(user.dateJoined),
    },
    {
      key: 'role',
      header: 'Rol',
      hidden: !showRoleColumn,
      render: (user) => formatRole(user.role),
    },
    {
      key: 'branch',
      header: 'Sucursal',
      hidden: !showBranchColumn,
      render: (user) => user.branch?.name ?? '—',
    },
  ];

  return (
    <div className="py-3">
      <GenericTable<UserModel>
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No hay resultados"
        actions={[
          {
            label: 'Modificar usuario',
            icon: 'edit',
            href: (user) => `/dashboard/users/modify?userId=${user.id}`,
          },
        ]}
        pagination={
          paginatedUsers && onPageChange
            ? {
                currentPage: paginatedUsers.currentPage,
                totalPages: paginatedUsers.totalPages,
                totalElements: paginatedUsers.totalElements,
                pageSize: paginatedUsers.pageSize,
                onPageChange,
              }
            : undefined
        }
      />
    </div>
  );
}
