'use client';
import React, { useState } from 'react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import TransactionDetailsDialog from '@/components/modals/TransactionDetailsDialog.component';
import { formatDate, usdFormatCurrency, getParsedAmount } from '@/lib/utils';
import { Transaction } from '@/services/orders/types/Order.type';
import { useTransaction } from '@/hooks/useTransactions';
import { useToken } from '@/stores/auth/auth.store';

interface Props {
  transactions: Transaction[];
  isLoading: boolean;
  isError: boolean;
}

export default function TransactionsTable({
  transactions,
  isLoading,
  isError,
}: Props) {
  const token = useToken();

  /**
   * Ficha de una transacción sobre el modal de la orden. Se guarda solo el id:
   * la fila trae la forma reducida que viene anidada en la orden, así que el
   * detalle completo se pide aparte.
   */
  const [selectedTransactionId, setSelectedTransactionId] = useState<number>();
  const {
    transaction: selectedTransaction,
    isLoadingTransaction,
    isErrorTransaction,
  } = useTransaction(token, selectedTransactionId);

  const hasColor = transactions.some((transaction) => transaction.color);
  const hasSerialOrPlate = transactions.some(
    (transaction) => transaction.serialNumber || transaction.plate
  );

  const columns: GenericTableColumn<Transaction>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '6rem',
      className: 'font-medium',
      // Al hacer click en el ID se abre la ficha de la transacción
      onCellClick: (transaction) => setSelectedTransactionId(transaction.id),
      render: (transaction) => `${transaction.id}`,
    },
    {
      key: 'product',
      header: 'Producto',
      render: (transaction) => (
        <div className="flex flex-col">
          <span>{transaction.product?.name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">
            {transaction.product?.model}
          </span>
        </div>
      ),
    },
    {
      key: 'color',
      header: 'Color',
      hidden: !hasColor,
      render: (transaction) => transaction.color || '-',
    },
    {
      key: 'serialOrPlate',
      header: 'Serial / Placa',
      hidden: !hasSerialOrPlate,
      render: (transaction) =>
        `${transaction.serialNumber || '-'} / ${transaction.plate || '-'}`,
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (transaction) => transaction.product?.sku || '-',
    },
    {
      key: 'originBranch',
      header: 'Origen',
      render: (transaction) => transaction.originBranch?.name || '-',
    },
    {
      key: 'targetBranch',
      header: 'Destino',
      render: (transaction) => transaction.targetBranch?.name || '-',
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (transaction) =>
        usdFormatCurrency(getParsedAmount(transaction.amount)),
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      render: (transaction) => getParsedAmount(transaction.quantity) || '-',
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (transaction) =>
        transaction.createdAt ? formatDate(transaction.createdAt) : '-',
    },
  ];

  if (isError) {
    return (
      <div className="py-4 text-sm text-destructive">
        Error al cargar las transacciones.
      </div>
    );
  }

  return (
    <>
      <GenericTable<Transaction>
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        density="compact"
        emptyMessage="No hay transacciones registradas para esta orden."
      />

      {/*
        Modal sobre modal: este se monta después que el de la orden, así que
        queda encima, y al cerrarlo solo se limpia su propio id — el de la
        orden nunca se desmonta y queda a la vista otra vez.
      */}
      <TransactionDetailsDialog
        isOpen={selectedTransactionId !== undefined}
        onClose={() => setSelectedTransactionId(undefined)}
        transaction={selectedTransaction}
        isLoading={isLoadingTransaction}
        isError={isErrorTransaction}
      />
    </>
  );
}
