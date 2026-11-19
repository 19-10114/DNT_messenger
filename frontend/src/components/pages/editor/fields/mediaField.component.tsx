'use client';

import React, { useRef, useState } from 'react';
import {
  GalleryThumbnails,
  ImagePlus,
  Loader2,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Label } from '@/components/ui/label.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import {
  usePageEditorActions,
  usePageEditorImages,
  usePageEditorProducts,
} from '@/stores/pages/pageEditor.store';
import { MediaSlot } from '@/services/pages/types';
import { ToggleField } from './editorFields.component';
import { ImagePickerGrid, useImageUpload } from './imageField.component';
import { ProductPicker, toProductRef } from './productPicker.component';

const ACCEPT = 'image/jpeg,image/png,image/webp';

interface MediaFieldProps {
  label: string;
  hint?: string;
  value: MediaSlot;
  onChange: (slot: MediaSlot) => void;
  /** Interruptor "Mostrar precio" cuando el hueco es un producto */
  showPrice?: boolean;
  onShowPriceChange?: (showPrice: boolean) => void;
}

/**
 * Hueco de imagen de un bloque: subir una foto, elegir una ya subida, o un
 * producto del catálogo (su foto vigente, y al tocarlo se abre su ficha).
 */
export function MediaField({
  label,
  hint,
  value,
  onChange,
  showPrice,
  onShowPriceChange,
}: MediaFieldProps) {
  const images = usePageEditorImages();
  const products = usePageEditorProducts();
  const { addProduct } = usePageEditorActions();
  const input = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const product = value.productId ? products[value.productId] : undefined;
  const image = value.imageId ? images[value.imageId] : undefined;
  const preview = image?.url ?? product?.images[0];
  const empty = !value.imageId && !value.productId;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex gap-3">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border bg-gray-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              {value.productId ? (
                <ShoppingBag className="h-6 w-6" />
              ) : (
                <ImagePlus className="h-6 w-6" />
              )}
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUploading}
              onClick={() => input.current?.click()}
            >
              <ImagePlus className="mr-1.5 h-4 w-4" />
              Subir
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCatalogOpen(true)}
            >
              <ShoppingBag className="mr-1.5 h-4 w-4" />
              Del catálogo
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" size="sm" variant="ghost">
                  <GalleryThumbnails className="mr-1.5 h-4 w-4" />
                  Elegir subida
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <ImagePickerGrid
                  selectedId={value.imageId}
                  onPick={(picked) => {
                    onChange({ imageId: picked.id, productId: null });
                    setPickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            {!empty && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange({ imageId: null, productId: null })}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Quitar</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      {value.productId && (
        <div className="flex flex-col gap-3 rounded-lg bg-orange-50/60 p-3">
          <p className="text-xs text-gray-700">
            <span className="font-medium">Catálogo:</span>{' '}
            {product?.name ?? (
              <span className="text-red-600">producto no disponible</span>
            )}
            {product && product.images.length === 0 && (
              <span className="text-amber-700"> · sin foto en el catálogo</span>
            )}
          </p>
          {onShowPriceChange && (
            <ToggleField
              label="Mostrar precio"
              hint={
                product?.price === null
                  ? 'Este producto no tiene precio de venta'
                  : 'El del catálogo, siempre actualizado'
              }
              checked={!!showPrice}
              onChange={onShowPriceChange}
            />
          )}
        </div>
      )}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          const [uploaded] = await upload(files.slice(0, 1));
          if (uploaded) onChange({ imageId: uploaded.id, productId: null });
        }}
      />
      <ProductPicker
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        selectedIds={value.productId ? [value.productId] : []}
        onPick={(picked) => {
          addProduct(toProductRef(picked));
          onChange({ imageId: null, productId: picked.id });
          setCatalogOpen(false);
        }}
      />
    </div>
  );
}
