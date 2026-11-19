'use client';

import { useState } from 'react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { usdFormatCurrency } from '@/lib/utils';
import { ClientData } from '@/services/clients/types/Client.type';
import { ClientDetailModal } from '../modals/clientDetailModal.component';

interface ClientsTableProps {
  clients: ClientData[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function ClientsTable({
  clients,
  isLoading,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ClientsTableProps): JSX.Element {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns: GenericTableColumn<ClientData>[] = [
    {
      key: 'name',
      header: 'Nombre',
      // Al hacer click en el nombre se abre la ficha del cliente
      onCellClick: (client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
      },
      render: (client) => `${client.firstName} ${client.lastName}`,
    },
    { key: 'countryId', header: 'Cédula' },
    {
      key: 'totalSpent',
      header: 'Monto Gastado',
      render: (client) => usdFormatCurrency(client.totalSpent ?? 0),
    },
    { key: 'phoneNumber', header: 'Teléfono' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Rol', render: (client) => client.role ?? '-' },
  ];

  return (
    <div>
      <GenericTable<ClientData>
        columns={columns}
        data={clients}
        isLoading={isLoading}
        emptyMessage="No hay clientes para mostrar"
        pagination={{
          currentPage,
          totalPages,
          totalElements,
          pageSize,
          onPageChange,
          onPageSizeChange,
        }}
      />

      <ClientDetailModal
        client={selectedClient}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
