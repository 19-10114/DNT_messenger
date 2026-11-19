'use client';

import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  GalleryThumbnails,
  Loader2,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
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
  usePageEditorStore,
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
import {
  ImagePickerGrid,
  useImageUpload,
} from '../../editor/fields/imageField.component';

const MAX_IMAGES = 12;

export function GalleryBlockEditor({
  blockKey,
  block,
  onChange,
}: BlockEditorProps<'gallery'>) {
  const { config } = block;
  const images = usePageEditorImages();
  const products = usePageEditorProducts();
  const { addProduct } = usePageEditorActions();
  const input = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const thumbnail = (item: (typeof config.images)[number]) =>
    item.imageId
      ? images[item.imageId]?.url
      : item.productId
        ? products[item.productId]?.images[0]
        : undefined;
  const items = config.images;
  const room = MAX_IMAGES - items.length;

  const setItems = (next: typeof items) =>
    onChange({ ...block, config: { ...config, images: next } });

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
        options={BLOCK_CATALOG.gallery.variants}
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
          <Label>Fotos</Label>
          <span className="text-xs text-gray-400">
            {items.length}/{MAX_IMAGES}
          </span>
        </div>
        {items.map((item, index) => (
          <div
            key={`${item.imageId ?? `p${item.productId}`}-${index}`}
            className="flex items-center gap-2 rounded-lg border p-2"
          >
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
              {thumbnail(item) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnail(item)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              {item.productId && (
                <span
                  className="absolute bottom-0.5 left-0.5 rounded bg-black/60 p-0.5 text-white"
                  title="Producto del catálogo"
                >
                  <ShoppingBag className="h-3 w-3" />
                </span>
              )}
            </div>
            <Input
              className="h-9"
              placeholder="Pie de foto (opcional)"
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
        ))}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={room <= 0 || isUploading}
            onClick={() => input.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-1.5 h-4 w-4" />
            )}
            Subir fotos
          </Button>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={room <= 0}
              >
                <GalleryThumbnails className="mr-1.5 h-4 w-4" />
                Elegir de la página
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <ImagePickerGrid
                onPick={(image) => {
                  setItems([...items, { imageId: image.id }]);
                  setPickerOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={room <= 0}
            onClick={() => setCatalogOpen(true)}
          >
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            Del catálogo
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Puedes subir varias a la vez. Los productos del catálogo abren su
          ficha al tocarlos. Sin fotos, la galería no aparece en la página
          publicada.
        </p>
        {items.some((item) => item.productId) && (
          <ToggleField
            label="Mostrar precio de los productos"
            checked={!!config.showPrice}
            onChange={(showPrice) =>
              onChange({ ...block, config: { ...config, showPrice } })
            }
          />
        )}
        <ProductPicker
          open={catalogOpen}
          onOpenChange={setCatalogOpen}
          onPick={(product) => {
            addProduct(toProductRef(product));
            setItems([...items, { productId: product.id }]);
            setCatalogOpen(false);
          }}
        />
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? []).slice(0, room);
          event.target.value = '';
          const uploaded = await upload(files);
          if (!uploaded.length) return;
          // Las subidas tardan: se parte del bloque tal como está ahora en el
          // borrador, no del que había al elegir los archivos
          const latest = usePageEditorStore
            .getState()
            .blocks.find((entry) => entry.key === blockKey)?.block;
          if (latest?.type !== 'gallery') return;
          onChange({
            ...latest,
            config: {
              ...latest.config,
              images: [
                ...latest.config.images,
                ...uploaded.map((image) => ({ imageId: image.id })),
              ].slice(0, MAX_IMAGES),
            },
          });
        }}
      />
    </div>
  );
}
