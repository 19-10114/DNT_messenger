'use client';

import React from 'react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { usdFormatCurrency } from '@/lib/utils';
import { DebtObjectItem } from '@/services/transactions/types/DebtObjects.type';
import {
  canViewTransactionDetails,
  normalizeTypeLabel,
  parsePriceNumber,
} from '@/utils/debtObjects.utils';

interface DebtObjectsTableProps {
  items: DebtObjectItem[];
  totalDebt: number;
  currentPage: number;
  totalPages: number;
  pageSize: string | number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onChangePageSize: (size: string) => void;
  onView: (obj: DebtObjectItem) => void;
}

export const DebtObjectsTable: React.FC<DebtObjectsTableProps> = ({
  items,
  totalDebt,
  currentPage,
  totalPages,
  pageSize,
  isLoading = false,
  onPageChange,
  onChangePageSize,
  onView,
}) => {
  /** Lo que suma deuda va en rojo; lo que la resta, en verde */
  const amountTone = (obj: DebtObjectItem) =>
    obj.adds ? 'text-red-600' : 'text-green-600';

  const columns: GenericTableColumn<DebtObjectItem>[] = [
    {
      key: 'date',
      header: 'Fecha',
      render: (obj) => new Date(obj.date).toLocaleString(),
    },
    { key: 'product', header: 'Producto', footer: 'Total deuda:' },
    {
      key: 'amount',
      header: 'Monto',
      cellClassName: amountTone,
      render: (obj) => usdFormatCurrency(parsePriceNumber((obj as any).amount)),
      footer: usdFormatCurrency(totalDebt),
    },
    {
      key: 'adds',
      header: 'Acción',
      cellClassName: amountTone,
      render: (obj) => (obj.adds ? 'Suma' : 'Resta'),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (obj) => normalizeTypeLabel(obj.type),
    },
  ];

  return (
    <GenericTable<DebtObjectItem>
      columns={columns}
      data={items}
      isLoading={isLoading}
      emptyMessage="No hay objetos de deuda para mostrar."
      actionsHeader="Detalle"
      actions={[
        {
          // Los tipos que todavía no tienen ficha quedan deshabilitados
          label: 'Ver',
          icon: 'view',
          onClick: onView,
          disabled: (obj) => !canViewTransactionDetails(obj.type),
        },
      ]}
      pagination={{
        currentPage,
        totalPages,
        pageSize: Number(pageSize),
        onPageChange,
        onPageSizeChange: (size) => onChangePageSize(String(size)),
      }}
    />
  );
};
