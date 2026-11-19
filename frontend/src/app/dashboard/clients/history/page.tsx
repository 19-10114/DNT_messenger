'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { ClientsTable } from '@/components/tables/clientsTable.component';
import { useAllClients } from '@/hooks/useClients';
import { useMappedConstants } from '@/hooks/useMappedConstants';
import { useToken } from '@/stores/auth/auth.store';

export default function ClientsHistoryPage() {
  const token = useToken();
  const { roles } = useMappedConstants();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    clients,
    currentPage,
    totalPages,
    totalElements,
    isLoadingClients,
    isErrorClients,
  } = useAllClients(token, {
    search: search || undefined,
    role: role || undefined,
    page: String(page),
    pageSize: String(pageSize),
  });

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2 text-primary font-serif">
          Historial de Clientes
        </h1>
        <p className="text-sm text-muted-foreground">
          Busca un cliente por nombre o cédula para ver su información, órdenes
          y productos comprados.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre o cédula..."
          onSearch={(term) => {
            setSearch(term);
            setPage(1);
          }}
          initialValue={search}
          className="max-w-md"
        />
        <Select
          value={role || 'all'}
          onValueChange={(value) => {
            setRole(value === 'all' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Rol..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="none">Sin rol</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isErrorClients && (
        <div className="text-red-500">Error al cargar los clientes.</div>
      )}

      <ClientsTable
        clients={clients}
        isLoading={isLoadingClients}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </section>
  );
}
