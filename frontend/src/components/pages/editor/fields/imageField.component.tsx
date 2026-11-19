'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, GalleryThumbnails } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import { Label } from '@/components/ui/label.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import { useToast } from '@/components/ui/use-toast';
import { usePageMutations } from '@/hooks/pages';
import { useToken } from '@/stores/auth/auth.store';
import {
  usePageEditorActions,
  usePageEditorImages,
  usePageEditorStore,
} from '@/stores/pages/pageEditor.store';
import { PageImage } from '@/services/pages/types';
import { getPagesErrorMessage } from '../../pages.utils';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 10 * 1024 * 1024;

/** Subida de fotos de la página, con la validación del backend adelantada */
export function useImageUpload() {
  const token = useToken();
  const pageId = usePageEditorStore((state) => state.pageId);
  const { addImage } = usePageEditorActions();
  const { uploadPageImage } = usePageMutations(token);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(0);

  const upload = async (files: File[]): Promise<PageImage[]> => {
    const valid = files.filter((file) => {
      if (!ACCEPT.split(',').includes(file.type)) {
        toast({
          title: `${file.name}: usa JPG, PNG o WebP`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > MAX_BYTES) {
        toast({
          title: `${file.name}: pesa más de 10 MB`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });
    const uploaded: PageImage[] = [];
    setUploading((count) => count + valid.length);
    for (const file of valid) {
      try {
        const image = await uploadPageImage({ pageId, file });
        addImage(image);
        uploaded.push(image);
      } catch (error) {
        toast({
          title: `No se pudo subir ${file.name}`,
          description: getPagesErrorMessage(error, 'Intenta de nuevo.'),
          variant: 'destructive',
        });
      } finally {
        setUploading((count) => count - 1);
      }
    }
    return uploaded;
  };

  return { upload, isUploading: uploading > 0 };
}

interface ImagePickerGridProps {
  onPick: (image: PageImage) => void;
  selectedId?: number | null;
}

/** Fotos ya subidas a esta página, para reutilizarlas */
export function ImagePickerGrid({ onPick, selectedId }: ImagePickerGridProps) {
  const images = Object.values(usePageEditorImages());
  if (images.length === 0) {
    return (
      <p className="p-2 text-sm text-gray-500">
        Todavía no hay fotos en esta página.
      </p>
    );
  }
  return (
    <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto p-1">
      {images.map((image) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onPick(image)}
          className={cn(
            'aspect-square overflow-hidden rounded-md ring-2 ring-offset-1',
            selectedId === image.id
              ? 'ring-[#ff8635]'
              : 'ring-transparent hover:ring-gray-300'
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}

interface ImageFieldProps {
  label: string;
  hint?: string;
  value: number | null | undefined;
  onChange: (imageId: number | null) => void;
}

/** Una foto: subir, elegir de las de la página o quitar */
export function ImageField({ label, hint, value, onChange }: ImageFieldProps) {
  const images = usePageEditorImages();
  const input = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload();
  const [pickerOpen, setPickerOpen] = useState(false);
  const current = value ? images[value] : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex gap-3">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border bg-gray-50">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => input.current?.click()}
          >
            <ImagePlus className="mr-1.5 h-4 w-4" />
            Subir foto
          </Button>
          <div className="flex gap-1.5">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" size="sm" variant="ghost">
                  <GalleryThumbnails className="mr-1.5 h-4 w-4" />
                  Elegir
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <ImagePickerGrid
                  selectedId={value}
                  onPick={(image) => {
                    onChange(image.id);
                    setPickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            {current && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange(null)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Quitar</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          const [image] = await upload(files.slice(0, 1));
          if (image) onChange(image.id);
        }}
      />
    </div>
  );
}
