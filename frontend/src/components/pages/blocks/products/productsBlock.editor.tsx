'use client';

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Package, Plus, Trash2 } from 'lucide-react';

import { usdFormatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import {
  usePageEditorActions,
  usePageEditorProducts,
} from '@/stores/pages/pageEditor.store';
import { BLOCK_CATALOG } from '../catalog';
import { BlockEditorProps } from '../editorProps';
import {
  ChoiceGroup,
  TextField,
  ToggleField,
} from '../../editor/fields/editorFields.component';
import {
  ProductPicker,
  toProductRef,
} from '../../editor/fields/productPicker.component';

const MAX_PRODUCTS = 6;

export function ProductsBlockEditor({
  blockKey,
  block,
  onChange,
}: BlockEditorProps<'products'>) {
  const { config } = block;
  const products = usePageEditorProducts();
  const { addProduct } = usePageEditorActions();
  const [pickerOpen, setPickerOpen] = useState(false);
  const items = config.products;
  const setItems = (next: typeof items) =>
    onChange({ ...block, config: { ...config, products: next } });
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setItems(next);
  };

  return (
    <div className="flex flex-col gap-5">
      <ChoiceGroup
        label="Diseño"
        value={block.variant}
        options={BLOCK_CATALOG.products.variants}
        onChange={(variant) => onChange({ ...block, variant })}
      />
      <TextField
        id={`${blockKey}-heading`}
        label="Título (opcional)"
        max={80}
        value={config.heading ?? ''}
        onChange={(heading) =>
          onChange({ ...block, config: { ...config, heading } })
        }
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <Label>Productos</Label>
          <span className="text-xs text-gray-400">
            {items.length}/{MAX_PRODUCTS} · mínimo 2
          </span>
        </div>
        {items.map((item, index) => {
          const product = products[item.productId];
          return (
            <div
              key={`${item.productId}-${index}`}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
                {product?.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-gray-300" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-xs text-gray-500">
                  {product ? (
                    <>
                      {product.name}
                      {product.price !== null &&
                        ` · ${usdFormatCurrency(product.price)}`}
                    </>
                  ) : (
                    <span className="text-red-600">Producto no disponible</span>
                  )}
                </span>
                <Input
                  className="h-8"
                  placeholder="Nombre a mostrar (opcional)"
                  maxLength={80}
                  value={item.caption ?? ''}
                  onChange={(event) =>
                    setItems(
                      items.map((entry, i) =>
                        i === index
                          ? { ...entry, caption: event.target.value }
                          : entry
                      )
                    )
                  }
                />
              </div>
              <div className="flex shrink-0">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Subir</span>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                  <span className="sr-only">Bajar</span>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Quitar</span>
                </Button>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-start"
          disabled={items.length >= MAX_PRODUCTS}
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar producto
        </Button>
      </div>
      <ToggleField
        label="Mostrar precio"
        hint="El del catálogo, siempre actualizado"
        checked={config.showPrice ?? true}
        onChange={(showPrice) =>
          onChange({ ...block, config: { ...config, showPrice } })
        }
      />
      <ProductPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Agregar producto"
        selectedIds={items.map((item) => item.productId)}
        onPick={(product) => {
          addProduct(toProductRef(product));
          if (!items.some((item) => item.productId === product.id)) {
            setItems([...items, { productId: product.id }]);
          }
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
