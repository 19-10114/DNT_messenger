'use client';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { useInventoryDeliveryNotes } from '@/hooks/useOrders';

interface ConsolidadoFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  model?: string;
  branch?: string;
  seller?: string;
}

interface ConsolidadoModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: number; // 1 = bikes, 2 = parts
  filters?: ConsolidadoFilters;
}

export function ConsolidadoModal({
  open,
  onClose,
  categoryId,
  filters = {},
}: ConsolidadoModalProps) {
  const [page, setPage] = useState(1);
  const isBikes = categoryId === 1;

  useEffect(() => {
    if (open) setPage(1);
  }, [open, categoryId, filters]);

  const {
    data: response,
    isLoading,
    isError,
  } = useInventoryDeliveryNotes(categoryId, open, page, 10, filters);

  const inventoryData = response?.data;
  const results = inventoryData?.results ?? [];
  const totalPages = inventoryData?.totalPages ?? 1;
  const totalElements = inventoryData?.totalElements ?? 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-start p-5 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">
              Consolidado — {isBikes ? 'Motos' : 'Repuestos'}
            </h2>
            {!isLoading && !isError && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalElements} producto{totalElements !== 1 ? 's' : ''} en pre
                órdenes
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="-mr-1 -mt-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-auto flex-1">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {isError && (
            <p className="text-sm text-destructive text-center py-12">
              Error al cargar los datos.
            </p>
          )}

          {!isLoading && !isError && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No hay productos en pre órdenes.
            </p>
          )}

          {!isLoading && !isError && results.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-200">
                  <TableHead className="w-[140px] text-gray-800">SKU</TableHead>
                  <TableHead className="text-gray-800">Nombre</TableHead>
                  {isBikes ? (
                    <TableHead className="text-gray-800">Color</TableHead>
                  ) : (
                    <TableHead className="hidden sm:table-cell w-[140px] text-gray-800">
                      Modelo
                    </TableHead>
                  )}
                  <TableHead className="text-right w-[80px] text-gray-800">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((item) => (
                  <React.Fragment key={item.productId}>
                    <TableRow>
                      <TableCell className="font-mono text-xs text-muted-foreground align-center pt-3">
                        {item.sku}
                      </TableCell>
                      <TableCell className="align-center pt-3">
                        <p className="font-medium text-sm leading-tight">
                          {item.name}
                        </p>
                      </TableCell>
                      {isBikes ? (
                        <TableCell className="align-center pt-3">
                          {item.colors && item.colors.length > 0 ? (
                            <div className="flex flex-col gap-y-0.5">
                              {item.colors.map((c, i) => (
                                <span key={i} className="text-sm">
                                  {c.color || 'Sin color'} ({c.quantity})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      ) : (
                        <TableCell className="hidden sm:table-cell align-center pt-3">
                          <p className="text-sm">{item.model}</p>
                          {!isBikes && item.brand && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.brand}
                            </p>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-semibold align-center pt-3">
                        {item.totalQuantity}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="border-t p-4 flex justify-center shrink-0">
            <PaginationComponent
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
