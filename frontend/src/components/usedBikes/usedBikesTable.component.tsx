'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import {
  USED_BIKE_STATUS_LABELS,
  UsedBike,
} from '@/services/products/types/UsedBike.type';
import {
  formatDate,
  formatPrice,
  fullName,
  statusVariant,
} from './usedBike.utils';
import { cn } from '@/lib/utils';

interface UsedBikesTableProps {
  usedBikes: UsedBike[];
  isLoading: boolean;
  onSelect: (usedBike: UsedBike) => void;
}

/** Columnas que se esconden en pantallas chicas: el `th` y el `td` van juntos */
const HIDE_UNDER_MD = 'hidden md:table-cell';
const HIDE_UNDER_LG = 'hidden lg:table-cell';

/** Listado de motos usadas registradas */
export function UsedBikesTable({
  usedBikes,
  isLoading,
  onSelect,
}: UsedBikesTableProps) {
  const columns: GenericTableColumn<UsedBike>[] = [
    {
      key: 'model',
      header: 'Modelo',
      className: 'font-medium',
      render: (bike) => bike.product.name,
    },
    { key: 'plate', header: 'Placa', className: 'uppercase' },
    { key: 'owner', header: 'Dueño', render: (bike) => fullName(bike.owner) },
    {
      key: 'branch',
      header: 'Sucursal',
      className: cn(HIDE_UNDER_MD, 'text-muted-foreground'),
      headerClassName: HIDE_UNDER_MD,
      render: (bike) => bike.branch.name,
    },
    {
      key: 'askedPrice',
      header: 'Monto pedido',
      render: (bike) => formatPrice(bike.askedPrice),
    },
    {
      key: 'reviewer',
      header: 'Mecánico',
      className: cn(HIDE_UNDER_LG, 'text-muted-foreground'),
      headerClassName: HIDE_UNDER_LG,
      render: (bike) => fullName(bike.reviewer),
    },
    {
      key: 'responsible',
      header: 'Responsable',
      className: cn(HIDE_UNDER_LG, 'text-muted-foreground'),
      headerClassName: HIDE_UNDER_LG,
      render: (bike) => fullName(bike.responsible),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (bike) => (
        <Badge variant={statusVariant(bike.status)}>
          {USED_BIKE_STATUS_LABELS[bike.status] ?? bike.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registrada',
      className: cn(HIDE_UNDER_LG, 'text-muted-foreground'),
      headerClassName: HIDE_UNDER_LG,
      render: (bike) => formatDate(bike.createdAt),
    },
  ];

  return (
    <GenericTable<UsedBike>
      columns={columns}
      data={usedBikes}
      isLoading={isLoading}
      emptyMessage="Aún no hay motos usadas registradas."
      onRowClick={onSelect}
    />
  );
}
