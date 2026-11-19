'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import { useTopParts } from '@/hooks/useTopSellerProducts';
import { formatDate } from '@/lib/utils';

interface TopPartsTableProps {
  startDate?: string;
  endDate?: string;
  title?: string;
  className?: string;
  defaultPageSize?: number;
}

export default function TopPartsTable({
  startDate,
  endDate,
  title,
  className = '',
  defaultPageSize = 10,
}: TopPartsTableProps) {
  const todayStr = formatDate(new Date());

  const [queryParams, setQueryParams] = useState({
    start: startDate || todayStr,
    finish: endDate || todayStr,
    page: '1',
    pageSize: defaultPageSize.toString(),
  });

  const { isLoading, isError, results, pagination, refetch } =
    useTopParts(queryParams);

  // Actualizar cuando cambien las props de fechas
  useEffect(() => {
    if (startDate && endDate) {
      setQueryParams((prev) => ({
        ...prev,
        start: startDate,
        finish: endDate,
        page: '1',
      }));
    }
  }, [startDate, endDate]);

  // Disparar refetch cuando cambien los parámetros
  useEffect(() => {
    refetch();
  }, [
    queryParams.start,
    queryParams.finish,
    queryParams.page,
    queryParams.pageSize,
    refetch,
  ]);

  // Sin rango seleccionado se consulta el día actual
  const handleDateChange = (start?: string, finish?: string) => {
    setQueryParams((prev) => ({
      ...prev,
      start: start ?? todayStr,
      finish: finish ?? todayStr,
      page: '1',
    }));
  };

  const columns: GenericTableColumn<(typeof results)[number]>[] = [
    { key: 'sku', header: 'SKU', className: 'font-mono' },
    { key: 'name', header: 'Producto' },
    {
      key: 'totalQuantity',
      header: 'Cantidad Vendida',
      className: 'font-semibold',
      render: (item) => item.totalQuantity.toLocaleString(),
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros de fecha */}
        {!startDate && !endDate && (
          <div className="mb-6 flex items-center">
            <FilterDate onChange={handleDateChange} />
          </div>
        )}

        {isError ? (
          <p className="text-sm text-red-600 text-center py-8">
            Ocurrió un error al cargar los productos más vendidos.
          </p>
        ) : (
          <GenericTable
            columns={columns}
            data={results}
            getRowKey={(item) => `top-part-${item.id}`}
            isLoading={isLoading}
            emptyMessage="No hay datos para mostrar."
            pagination={{
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              totalElements: pagination.totalElements,
              pageSize: Number(queryParams.pageSize),
              onPageChange: (page) =>
                setQueryParams((prev) => ({ ...prev, page: String(page) })),
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
