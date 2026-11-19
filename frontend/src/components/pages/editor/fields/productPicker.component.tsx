'use client';

import React, { useState } from 'react';
import { Check, Loader2, Package } from 'lucide-react';

import { cn, usdFormatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import { usePageProducts } from '@/hooks/pages';
import { useToken } from '@/stores/auth/auth.store';
import { PageProductSearchItem } from '@/services/pages/types';

interface ProductPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (product: PageProductSearchItem) => void;
  /** Ya elegidos: se marcan (y en modo múltiple se pueden quitar) */
  selectedIds?: number[];
  title?: string;
}

/** Buscador de motos y repuestos del catálogo para poner en una página */
export function ProductPicker({
  open,
  onOpenChange,
  onPick,
  selectedIds = [],
  title = 'Elegir del catálogo',
}: ProductPickerProps) {
  const token = useToken();
  const [category, setCategory] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const { pageProducts, isLoadingPageProducts, isFetchingPageProducts } =
    usePageProducts(open ? token : undefined, search, category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" width="min(36rem, 95vw)">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            La página muestra la foto y el precio vigentes del producto. Al
            tocarlo, el visitante ve su ficha con WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {([1, 2] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                category === value ? 'bg-white shadow-sm' : 'text-gray-600'
              )}
            >
              {value === 1 ? 'Motos' : 'Repuestos'}
            </button>
          ))}
        </div>
        <SearchInput
          placeholder="Nombre, marca, modelo o SKU"
          onSearch={setSearch}
          initialValue={search}
          debounceMs={400}
        />
        <div className="flex max-h-[50vh] min-h-[200px] flex-col gap-1.5 overflow-y-auto">
          {isLoadingPageProducts ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : pageProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              No hay productos con ese nombre.
            </p>
          ) : (
            pageProducts.map((product) => {
              const active = selectedIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onPick(product)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-2 text-left transition-colors',
                    active
                      ? 'border-[#ff8635] bg-orange-50'
                      : 'border-transparent hover:bg-gray-50'
                  )}
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {product.name}
                    </span>
                    <span className="truncate text-xs text-gray-500">
                      {product.brand} · {product.sku}
                      {product.imageUrl ? '' : ' · sin foto'}
                    </span>
                  </span>
                  {product.price !== null && (
                    <span className="shrink-0 text-sm font-semibold">
                      {usdFormatCurrency(product.price)}
                    </span>
                  )}
                  {active && (
                    <Check className="h-4 w-4 shrink-0 text-[#ff8635]" />
                  )}
                </button>
              );
            })
          )}
          {isFetchingPageProducts && !isLoadingPageProducts && (
            <p className="text-center text-xs text-gray-400">Buscando…</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Lo que se guarda en el store a partir de un resultado del buscador */
export function toProductRef(product: PageProductSearchItem) {
  const { imageUrl: _imageUrl, ...ref } = product;
  return ref;
}
