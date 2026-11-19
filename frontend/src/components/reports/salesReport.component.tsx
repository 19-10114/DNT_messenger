'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import {
  formatDate,
  usdFormatCurrency,
  formatCurrencyBolivares,
} from '@/lib/utils';
import { FilterDate } from '@/components/ui/filterDate.component';
import { useSalesReport } from '@/hooks/useSalesReport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge.component';
import TransactionDetailsDialog from '@/components/modals/TransactionDetailsDialog.component';
import { TransactionService } from '@/services/transactions/transactions.service';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import { useBranchOrdersList } from '@/hooks/useOrders';
import { useToken } from '@/stores/auth/auth.store';
import { OrderData } from '@/services/orders/types/Order.type';
import { useRoles } from '@/stores/auth/auth.store';

// Componente genérico de Reporte de Ventas con rango de fechas y tablas
export default function SalesReport() {
  const todayStr = formatDate(new Date());
  const [queryParams, setQueryParams] = useState({
    start: todayStr,
    finish: todayStr,
    dp: false,
    page: '1',
    pageSize: '10',
  });
  const roles = useRoles();
  const isPartsAdmin = roles.includes('parts_admin');
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Order Details Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderBranchId, setSelectedOrderBranchId] = useState<
    string | undefined
  >(undefined);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Transaction Details Modal State
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDataResult | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const token = useToken();

  const { data: ordersData, isLoading: isLoadingOrderById } =
    useBranchOrdersList(
      selectedOrderBranchId,
      { search: selectedOrderId ?? '', page: '1', pageSize: '50' },
      { enabled: !!selectedOrderId && !!selectedOrderBranchId }
    );

  const orderById =
    ordersData?.results?.find(
      (o) => String(o.id) === String(selectedOrderId)
    ) ?? null;

  const transactionService = new TransactionService();

  const formatQuantityWithDp = (quantity: number, dpQuantity: number) => {
    if (queryParams.dp) {
      return quantity;
    } else {
      if (dpQuantity > 0) {
        return `${quantity}(${dpQuantity})`;
      }
      return quantity;
    }
  };

  const handleDetailClick = async (
    id: number,
    type: string,
    branchId?: number
  ) => {
    if (type === 'order') {
      setSelectedOrderId(String(id));
      setSelectedOrderBranchId(branchId ? String(branchId) : undefined);
      setIsOrderModalOpen(true);
    } else {
      try {
        const tx = await transactionService.getTransactionById(
          token,
          String(id)
        );
        setSelectedTransaction(tx);
        setIsTransactionModalOpen(true);
      } catch (error) {
        console.error('Error fetching transaction:', error);
      }
    }
  };

  const handleRowClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const {
    isLoading,
    isError,
    summary,
    vehicleRows,
    spareRows,
    vehiclesPagination,
    partsPagination,
  } = useSalesReport(queryParams, fetchEnabled);

  useEffect(() => {
    const hasAnyData = vehicleRows.length > 0 || spareRows.length > 0;
    setHasData(hasAnyData);
  }, [vehicleRows, spareRows]);

  useEffect(() => {
    if (!isLoading && fetchEnabled) {
      setFetchEnabled(false);
    }
  }, [isLoading]);

  // El FilterDate ya acota el rango a fechas pasadas, se aplica al instante
  const handleDateChange = (start?: string, finish?: string) => {
    setQueryParams((prev) => ({
      ...prev,
      start: start ?? todayStr,
      finish: finish ?? todayStr,
      page: '1',
    }));
    setFetchEnabled(true);
  };

  const handleDpChange = (checked: boolean) => {
    setQueryParams((prev) => ({
      ...prev,
      dp: checked,
      page: '1',
    }));
    setFetchEnabled(true);
  };

  const goToPage = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page: String(page) }));
    setFetchEnabled(true);
  };

  // Las variantes de color de un modelo, con su cantidad
  const renderVariants = (row: any) => {
    if (!row.variants || row.variants.length === 0) {
      return <span className="text-muted-foreground">-</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {row.variants.map((v: any, idx: number) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-1">
              {v.hexColor && (
                <span
                  className="h-3 w-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: v.hexColor }}
                />
              )}
              <span>{v.color}</span>
            </div>
            <span className="font-semibold">
              {formatQuantityWithDp(v.quantity, v.dpQuantity)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const dpSuffix = !queryParams.dp ? '(DP)' : '';

  const vehicleColumns: GenericTableColumn<any>[] = [
    { key: 'id', header: 'ID', width: '5rem' },
    { key: 'modelo', header: 'Modelo' },
    { key: 'variants', header: `Color${dpSuffix}`, render: renderVariants },
    {
      key: 'cantidad',
      header: `Cantidad${dpSuffix}`,
      render: (row) => formatQuantityWithDp(row.cantidad, row.dpCantidad),
    },
    {
      key: 'usd',
      header: 'Total USD',
      render: (row) => usdFormatCurrency(row.usd),
    },
    {
      key: 'receivedUsd',
      header: 'Recibido USD',
      render: (row) => usdFormatCurrency(row.receivedUsd),
    },
    {
      key: 'receivedBs',
      header: 'Recibido BS',
      render: (row) => formatCurrencyBolivares(row.receivedBs),
    },
  ];

  const spareColumns: GenericTableColumn<any>[] = [
    { key: 'id', header: 'ID', width: '5rem' },
    { key: 'producto', header: 'Producto' },
    {
      key: 'cantidad',
      header: `Cantidad${dpSuffix}`,
      render: (row) => formatQuantityWithDp(row.cantidad, row.dpCantidad),
    },
    {
      key: 'usd',
      header: 'Total USD',
      render: (row) => usdFormatCurrency(row.usd),
    },
    {
      key: 'receivedUsd',
      header: 'Recibido USD',
      render: (row) => usdFormatCurrency(row.receivedUsd),
    },
    {
      key: 'receivedBs',
      header: 'Recibido BS',
      render: (row) => formatCurrencyBolivares(row.receivedBs),
    },
  ];

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FilterDate onChange={handleDateChange} />

            {!isPartsAdmin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dpCheckbox"
                  checked={queryParams.dp}
                  onChange={(e) => handleDpChange(e.target.checked)}
                  disabled={!hasData && !isLoading}
                  className="h-4 w-4"
                />

                <label htmlFor="dpCheckbox" className="text-sm font-medium">
                  Dale Play
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!isPartsAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Venta total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{usdFormatCurrency(summary.totalSales)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recibido USD</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {usdFormatCurrency(summary.receivedUsd)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recibido BS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {formatCurrencyBolivares(summary.receivedBs)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!isPartsAdmin && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Motos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span>Cantidad:</span>
                  <span className="font-semibold">{summary.motosQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span className="font-semibold">
                    {usdFormatCurrency(summary.motosAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>MFB</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span>Cantidad:</span>
                  <span className="font-semibold">{summary.mfbQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span className="font-semibold">
                    {usdFormatCurrency(summary.mfbAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Repuestos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span>Cantidad:</span>
              <span className="font-semibold">{summary.repuestosQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Monto:</span>
              <span className="font-semibold">
                {usdFormatCurrency(summary.repuestosAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isPartsAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Vehículos</CardTitle>
          </CardHeader>
          <CardContent>
            <GenericTable<any>
              columns={vehicleColumns}
              data={vehicleRows}
              getRowKey={(row) => `veh-${row.id}`}
              isLoading={isLoading}
              emptyMessage="No hay datos para mostrar."
              onRowClick={handleRowClick}
              pagination={{
                currentPage:
                  vehiclesPagination.currentPage || Number(queryParams.page),
                totalPages: vehiclesPagination.totalPages || 1,
                onPageChange: goToPage,
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Repuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericTable<any>
            columns={spareColumns}
            data={spareRows}
            getRowKey={(row) => `sp-${row.id}`}
            isLoading={isLoading}
            emptyMessage="No hay datos para mostrar."
            onRowClick={handleRowClick}
            pagination={{
              currentPage:
                partsPagination.currentPage || Number(queryParams.page),
              totalPages: partsPagination.totalPages || 1,
              onPageChange: goToPage,
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent width="800px">
          <DialogHeader>
            <DialogTitle>
              Detalle de Ventas -{' '}
              {selectedItem?.modelo || selectedItem?.producto}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Sucursal Origen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedItem?.items?.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge
                        variant={
                          item.type === 'order' ? 'default' : 'secondary'
                        }
                      >
                        {item.type === 'order' ? 'Orden' : 'Transacción'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          handleDetailClick(item.id, item.type, item.branchId)
                        }
                        className="text-blue-600 hover:underline"
                      >
                        #{item.id}
                      </button>
                    </TableCell>
                    <TableCell>{item.sourceBranch || '-'}</TableCell>
                  </TableRow>
                ))}
                {(!selectedItem?.items || selectedItem.items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No hay detalles disponibles.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <OrderDetailsModal
        order={orderById as unknown as OrderData}
        open={isOrderModalOpen}
        onOpenChange={(open) => {
          setIsOrderModalOpen(open);
          if (!open) {
            setSelectedOrderId(null);
            setSelectedOrderBranchId(undefined);
          }
        }}
      />

      <TransactionDetailsDialog
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transaction={selectedTransaction as TransactionDataResult}
      />
    </section>
  );
}
