'use client';

import { Pagination } from '@/models/pagination.model';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';
import { formatDate, usdFormatCurrency } from '@/lib/utils';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { useState } from 'react';
import TransactionDetailsDialog from '@/components/modals/TransactionDetailsDialog.component';
import { useRouter } from 'next/navigation';
import { useSuperuser } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';

interface TransactionListProps {
  paginatedPayments?: Pagination<TransactionDataResult>;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
}

/** Valor anidado por ruta (`responsible.username`) */
const getNestedValue = (obj: any, path: string) =>
  path.split('.').reduce((current, key) => current?.[key], obj);

export function TransactionList({
  paginatedPayments,
  isLoading = false,
  onPageChange,
}: TransactionListProps) {
  const router = useRouter();
  const isSuperuser = useSuperuser();
  const currentBranchId = useCurrentBranchId();

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDataResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  let transactions: TransactionDataResult[] = [];
  if (paginatedPayments) {
    if (paginatedPayments.results) {
      // Si tiene la estructura esperada con 'results'
      transactions = paginatedPayments.results;
    } else if (
      typeof paginatedPayments === 'object' &&
      Object.keys(paginatedPayments).length > 0
    ) {
      // Si es un objeto con índices numéricos, convertirlo a array
      transactions = Object.values(paginatedPayments);
    }
  }

  const exportData =
    transactions?.map((transacciones) => ({
      ...transacciones,
    })) || [];

  const handleOpenDetails = (transaction: TransactionDataResult) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  /**
   * Una columna vacía en todas las filas no se muestra: según el tipo de
   * transacción hay campos que nunca vienen y ensuciarían la tabla.
   */
  const isColumnEmpty = (fieldName: string) => {
    if (transactions.length === 0) return true;
    return transactions.every((transaction) => {
      const value = getNestedValue(transaction, fieldName);
      return !value || value === '' || value === null || value === undefined;
    });
  };

  const columns: GenericTableColumn<TransactionDataResult>[] = [
    { key: 'id', header: 'ID', width: '5rem', hidden: isColumnEmpty('id') },
    {
      key: 'orderId',
      header: 'Nro. aprobación',
      hidden: isColumnEmpty('orderId'),
    },
    {
      key: 'responsible',
      header: 'Responsable',
      hidden: isColumnEmpty('responsible.username'),
      render: (transaction) => transaction?.responsible?.username,
    },
    {
      key: 'client',
      header: 'Cliente',
      hidden: isColumnEmpty('client.firstName'),
      render: (transaction) =>
        transaction.client
          ? `${transaction.client.firstName} ${transaction.client.lastName}`
          : '',
    },
    {
      key: 'createdAt',
      header: 'creación',
      hidden: isColumnEmpty('createdAt'),
      render: (transaction) => formatDate(transaction.createdAt),
    },
    {
      key: 'originBranch',
      header: 'Sede de Origen',
      hidden: isColumnEmpty('originBranch.name'),
      render: (transaction) => transaction.originBranch?.name,
    },
    {
      key: 'targetBranch',
      header: 'Sede de Destino',
      hidden: isColumnEmpty('targetBranch.name'),
      render: (transaction) => transaction.targetBranch?.name,
    },
    {
      // `quantity`/`amount` are typed as { source, parsedValue } but this
      // endpoint actually returns plain numbers — same mismatch already
      // worked around with `as any` in CashObjectDetailsDialog and
      // DebtObjectDetailsDialog.
      key: 'quantity',
      header: 'Cantidad',
      hidden: isColumnEmpty('quantity'),
      render: (transaction) => Number((transaction as any)?.quantity ?? 0),
    },
    {
      key: 'totalAmount',
      header: 'Monto Total',
      hidden: isColumnEmpty('amount'),
      render: (transaction) => {
        const unitAmount = Number((transaction as any)?.amount ?? 0);
        const quantity = Number((transaction as any)?.quantity ?? 1);
        return usdFormatCurrency(unitAmount * quantity);
      },
    },
    {
      key: 'product',
      header: 'Producto',
      hidden: isColumnEmpty('product.name'),
      render: (transaction) => transaction.product?.name,
    },
    {
      key: 'type',
      header: 'Tipo',
      hidden: isColumnEmpty('type'),
      render: (transaction) => {
        // Lo que entra a la sucursal activa se lee como compra
        const isIncomingToCurrentBranch =
          transaction?.targetBranch?.id &&
          `${transaction.targetBranch.id}` === `${currentBranchId}`;
        return isIncomingToCurrentBranch ? 'purchase' : transaction.type;
      },
    },
  ];

  return (
    <>
      <GenericTable<TransactionDataResult>
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        emptyMessage="No hay Transacciones que mostrar."
        actions={[
          {
            label: 'Ver detalles',
            icon: 'view',
            onClick: handleOpenDetails,
          },
          {
            label: 'Editar',
            icon: 'edit',
            hidden: () => !isSuperuser,
            onClick: (transaction) =>
              router.push(`/dashboard/transactions/edit?id=${transaction.id}`),
          },
        ]}
        pagination={
          paginatedPayments && onPageChange
            ? {
                currentPage: paginatedPayments.currentPage,
                totalPages: paginatedPayments.totalPages,
                totalElements: paginatedPayments.totalElements,
                pageSize: paginatedPayments.pageSize,
                onPageChange,
              }
            : undefined
        }
        footer={
          transactions.length > 0 ? (
            <ExportButton data={exportData} title="Descargar Transacciones" />
          ) : null
        }
      />

      {selectedTransaction && (
        <TransactionDetailsDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          transaction={selectedTransaction}
        />
      )}
    </>
  );
}
