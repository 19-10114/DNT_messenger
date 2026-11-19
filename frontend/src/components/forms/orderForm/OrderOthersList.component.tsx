'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useDebounce } from 'use-debounce';
import { Card } from '@/components/ui/card.component';
import { Button } from '@/components/ui/button.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { Plus } from 'lucide-react';
import { OtherProductsResponse } from '@/services/products/types';
import Link from 'next/link';
import { GASTO_LEGACY_PRODUCT_ID } from '@/constants/products';
import { EXPENSES } from '@/constants/routes';

type OtherItem = {
  id: string;
  sku: string;
  name: string;
  model: string;
  brand: string;
  price: number;
  quantity: number;
  available: boolean;
};

interface OrderOthersListProps {
  searchTerm: string;
  onAddOther: (other: OtherItem) => void;
  branchId?: number | null;
}

const productsService = new ProductsService();

export function OrderOthersList({
  searchTerm,
  onAddOther,
  branchId,
}: OrderOthersListProps) {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const effectiveBranchId = branchId ?? currentBranchId;
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  // Nota: getOtherProducts no soporta paginación en service. Simulamos paginación en el cliente.
  const othersQuery = useQuery({
    queryKey: [
      'orderForm_otherProducts',
      token,
      effectiveBranchId,
      debouncedSearch,
    ],
    queryFn: async () => {
      const resp = await productsService.getOtherProducts(token as string);
      return resp;
    },
    enabled: !!token && !!effectiveBranchId,
  });

  const filteredOthers = useMemo(() => {
    const data = othersQuery.data?.data as
      | OtherProductsResponse['data']
      | undefined;
    const list = Array.isArray(data?.results) ? (data?.results as any[]) : [];
    return (
      list
        .filter((item: any) => item?.id !== 11277)
        // Los gastos ya no se venden como producto: van al Módulo de Gastos.
        .filter((item: any) => item?.id !== GASTO_LEGACY_PRODUCT_ID)
        .filter((item: any) => {
          if (!debouncedSearch) return true;
          const t = debouncedSearch.toLowerCase();
          return (
            item?.name?.toLowerCase().includes(t) ||
            item?.sku?.toLowerCase?.().includes(t)
          );
        })
    );
  }, [othersQuery.data?.data, debouncedSearch]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredOthers.length / pageSize));
  }, [filteredOthers.length, pageSize]);

  const visibleOthers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOthers.slice(start, start + pageSize).map((item: any) => {
      const price =
        typeof item.cost === 'number'
          ? item.cost
          : item.cost &&
              typeof item.cost === 'object' &&
              'parsedValue' in item.cost
            ? item.cost.parsedValue
            : 0;
      const pkgQty =
        typeof item.packageQuantity === 'number' ? item.packageQuantity : 1;
      return {
        id: item.id?.toString() || Math.random().toString(),
        sku: item.sku || '',
        name: item.name || '',
        model: item.model || '',
        brand: item.brand || '',
        price,
        quantity: pkgQty,
        available: true,
      };
    });
  }, [filteredOthers, page, pageSize]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Los gastos se registran en el{' '}
        <Link href={EXPENSES} className="text-primary underline">
          módulo Gastos
        </Link>
        , con su comprobante.
      </p>
      {othersQuery.isLoading ? (
        <p>Cargando otros productos...</p>
      ) : visibleOthers.length === 0 ? (
        <p>No se encontraron otros productos</p>
      ) : (
        <>
          {visibleOthers.map((other) => (
            <Card
              key={other.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${!other.available ? 'opacity-50' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-medium">{other.name}</h3>
                  <p className="text-sm text-gray-600">
                    Stock: {other.quantity}
                  </p>
                  <p className="text-sm font-medium">
                    ${other.price.toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={() => onAddOther(other)}
                  disabled={!other.available}
                  size="sm"
                  className="w-full sm:w-auto mt-2 sm:mt-0"
                >
                  <Plus className="h-4 w-4 sm:mr-0 mr-2" />
                  <span className="sm:hidden">Agregar</span>
                </Button>
              </div>
            </Card>
          ))}

          {totalPages > 1 && (
            <PaginationComponent
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </>
      )}
    </div>
  );
}
