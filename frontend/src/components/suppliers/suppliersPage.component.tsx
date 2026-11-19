'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.component';
import { useToast } from '@/components/ui/use-toast';
import { useSetSupplierActive, useSuppliers } from '@/hooks/suppliers';
import { Supplier } from '@/services/suppliers/types/Supplier.type';
import { useIsStaff, useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { SupplierFormModal } from './supplierFormModal.component';
import {
  PERSON_TYPE_LABELS,
  canManageSuppliers,
  getSupplierErrorMessage,
} from './supplier.utils';

/**
 * Proveedores: a quién se le pagan facturas con IVA y retenciones, con su
 * perfil de retención. Se eligen desde el beneficiario de un gasto. Los ve y
 * gestiona la administración (admin, administrador); un proveedor no se
 * borra, se desactiva.
 */
export function SuppliersPage() {
  const { toast } = useToast();
  const canManage = canManageSuppliers(
    useRoles(),
    useSuperuser(),
    useIsStaff()
  );
  const [active, setActive] = useState<'true' | 'false'>('true');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<Supplier>();
  const [isNewOpen, setIsNewOpen] = useState(false);

  const { suppliers, pagination, isLoading, isFetching, isError } =
    useSuppliers({
      active,
      search: search || undefined,
      page: String(page),
      pageSize: String(pageSize),
    });
  const setActiveMutation = useSetSupplierActive();

  const toggleActive = async (supplier: Supplier) => {
    try {
      await setActiveMutation.mutateAsync({
        id: supplier.id,
        active: !supplier.isActive,
      });
      toast({
        title: supplier.isActive
          ? `${supplier.name} desactivado`
          : `${supplier.name} activado`,
      });
    } catch (error) {
      toast({
        title: 'No se pudo cambiar el estado',
        description: getSupplierErrorMessage(error, 'Inténtalo de nuevo.'),
        variant: 'destructive',
      });
    }
  };

  const columns: GenericTableColumn<Supplier>[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'rif', header: 'RIF', width: '130px' },
    {
      key: 'personType',
      header: 'Tipo',
      render: (row) => PERSON_TYPE_LABELS[row.personType],
    },
    {
      key: 'ivaRetentionRate',
      header: 'Ret. IVA',
      align: 'right',
      render: (row) =>
        row.ivaRetentionRate ? `${row.ivaRetentionRate} %` : 'No',
    },
    {
      key: 'islrRetentionRate',
      header: 'Ret. ISLR',
      render: (row) =>
        row.islrRetentionRate ? (
          <div className="flex flex-col">
            <span>{row.islrRetentionRate} %</span>
            {row.islrConcept && (
              <span className="text-xs text-muted-foreground">
                {row.islrConcept}
              </span>
            )}
          </div>
        ) : (
          'No'
        ),
    },
    {
      key: 'expensesCount',
      header: 'Gastos',
      align: 'right',
      width: '80px',
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (row) => (
        <Badge variant={row.isActive ? 'secondary' : 'outline'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Tabs
            value={active}
            onValueChange={(value) => {
              setActive(value as 'true' | 'false');
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="true">Activos</TabsTrigger>
              <TabsTrigger value="false">Inactivos</TabsTrigger>
            </TabsList>
          </Tabs>
          <SearchInput
            placeholder="Buscar por nombre o RIF"
            initialValue={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="min-w-[240px]"
          />
        </div>
        {canManage && (
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo proveedor
          </Button>
        )}
      </div>

      {isError ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los proveedores.
        </p>
      ) : (
        <GenericTable<Supplier>
          columns={columns}
          data={suppliers}
          isLoading={isLoading || (isFetching && suppliers.length === 0)}
          emptyMessage={
            active === 'true'
              ? 'Todavía no hay proveedores.'
              : 'No hay proveedores inactivos.'
          }
          actions={
            canManage
              ? [
                  {
                    label: 'Editar',
                    icon: 'edit',
                    onClick: (row) => setEditing(row),
                  },
                  {
                    label: 'Desactivar',
                    icon: 'close',
                    onClick: (row) => toggleActive(row),
                    hidden: (row) => !row.isActive,
                  },
                  {
                    label: 'Activar',
                    icon: 'check',
                    onClick: (row) => toggleActive(row),
                    hidden: (row) => row.isActive,
                  },
                ]
              : undefined
          }
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalElements: pagination.totalElements,
            pageSize,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        />
      )}

      <SupplierFormModal open={isNewOpen} onOpenChange={setIsNewOpen} />
      <SupplierFormModal
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        supplier={editing}
      />
    </section>
  );
}
