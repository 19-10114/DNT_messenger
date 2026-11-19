'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { formatDate, getParsedAmount } from '@/lib/utils';
import OrderDetailsModal from './orderDetailsModal';
import { useBranchOrdersList } from '@/hooks/useOrders';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { OrderData } from '@/services/orders/types/Order.type';

interface Props {
  search?: string;
  category?: 'finance' | 'mfb' | 'bikes' | 'parts' | 'services';
  startDate?: string;
  endDate?: string;
  branchId?: string;
  modelId?: string;
}

export default function OrdersTable({
  search = '',
  category,
  startDate,
  endDate,
  branchId,
  modelId,
}: Props) {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const currentBranchId = useCurrentBranchId();

  // Resetear a la primera página cuando cambia cualquier filtro
  useEffect(() => {
    setPage(1);
  }, [search, category, startDate, endDate, branchId, modelId]);

  const { data, isLoading, isError, isFetching } = useBranchOrdersList(
    undefined,
    {
      search,
      page: String(page),
      pageSize: String(pageSize),
      category: category || undefined,
      start: startDate || undefined,
      finish: endDate || undefined,
      branch: branchId || undefined,
      model: modelId || undefined,
    }
  );
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [open, setOpen] = useState(false);

  const orders = useMemo(() => data?.results ?? [], [data]);

  const handleOpenDetails = (order: OrderData) => {
    setSelectedOrder(order);
    setOpen(true);
  };

  const columns: GenericTableColumn<OrderData>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '6rem',
      // Al hacer click en el ID se abren los detalles de la orden
      onCellClick: handleOpenDetails,
      render: (order) => `#${order.id}`,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (order) => (order.createdAt ? formatDate(order.createdAt) : '-'),
    },
    {
      key: 'originBranch',
      header: 'Sucursal de origen',
      align: 'center',
      hidden: currentBranchId !== 0,
      render: (order) =>
        typeof order.originBranch === 'object'
          ? order.originBranch?.name || '-'
          : '-',
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (order) => `${order.client?.firstName} ${order.client?.lastName}`,
    },
    {
      key: 'total',
      header: 'Total',
      render: (order) =>
        `$ ${getParsedAmount(order.totalInvoiceUsd).toFixed(2)}`,
    },
  ];

  if (isError) {
    return <div className="py-4 text-destructive">Error cargando órdenes.</div>;
  }

  return (
    <div>
      <GenericTable<OrderData>
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="No hay órdenes para esta sucursal."
        toolbar={
          isFetching ? (
            <span className="text-sm text-muted-foreground">
              Actualizando...
            </span>
          ) : null
        }
        actions={[
          {
            label: 'Ver detalles',
            icon: 'view',
            onClick: handleOpenDetails,
          },
        ]}
        pagination={{
          currentPage: data?.currentPage ?? page,
          totalPages: data?.totalPages ?? 1,
          totalElements: data?.totalElements,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          },
        }}
      />

      <OrderDetailsModal
        order={selectedOrder}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
