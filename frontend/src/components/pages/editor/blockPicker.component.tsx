'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { BlockType } from '@/services/pages/types';
import {
  usePageEditorActions,
  usePageEditorBlocks,
} from '@/stores/pages/pageEditor.store';
import { BLOCK_CATALOG, BLOCK_ORDER } from '../blocks/catalog';
import { MAX_BLOCKS } from '../blocks/blockSchemas';

/** Botón "Agregar bloque" con el catálogo */
export function BlockPicker() {
  const [open, setOpen] = useState(false);
  const blocks = usePageEditorBlocks();
  const { addBlock } = usePageEditorActions();
  const hasFloating = blocks.some(
    ({ block }) => block.type === 'cta' && block.variant === 'floating'
  );
  const full = blocks.length >= MAX_BLOCKS;

  const add = (type: BlockType) => {
    addBlock(type);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        disabled={full}
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        {full ? `Máximo ${MAX_BLOCKS} bloques` : 'Agregar bloque'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar bloque</DialogTitle>
            <DialogDescription>
              Se agrega al final; luego puedes arrastrarlo a donde quieras.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            {BLOCK_ORDER.map((type) => {
              const entry = BLOCK_CATALOG[type];
              const Icon = entry.icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  className="flex items-start gap-3 rounded-xl border-2 border-gray-100 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#ff8635] hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff8635]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold">{entry.label}</span>
                    <span className="text-xs text-gray-500">
                      {entry.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {hasFloating && (
            <p className="text-xs text-gray-500">
              Ya hay un botón flotante: un botón nuevo se agrega como botón
              grande.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
