'use client';

import React from 'react';
import { ImagePlus } from 'lucide-react';

interface PhotoUploadBoxProps {
  label: string;
}

/**
 * Recuadro para una foto de ingreso.
 * Por ahora es solo maquetado: no sube nada todavía.
 */
export function PhotoUploadBox({ label }: PhotoUploadBoxProps) {
  return (
    <button
      type="button"
      disabled
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-muted/20 p-6 text-muted-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed aspect-[4/3]"
    >
      <ImagePlus className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs">Próximamente</span>
    </button>
  );
}
