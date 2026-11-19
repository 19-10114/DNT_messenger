'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { BlockType, PageBlockPayload } from '@/services/pages/types';
import {
  EditorBlock,
  usePageEditorActions,
  usePageEditorMeta,
  usePageEditorServerErrors,
} from '@/stores/pages/pageEditor.store';
import { StyleField } from './fields/styleField.component';
import { BLOCK_CATALOG } from '../blocks/catalog';
import { validateBlock } from '../blocks/blockSchemas';
import { BlockEditorProps } from '../blocks/editorProps';
import { BLOCK_EDITORS } from './blockEditors';

function Editor<T extends BlockType>({
  item,
  onChange,
}: {
  item: EditorBlock;
  onChange: (block: PageBlockPayload) => void;
}) {
  const Component = BLOCK_EDITORS[item.block.type as T] as React.ComponentType<
    BlockEditorProps<T>
  >;
  return (
    <Component
      blockKey={item.key}
      block={item.block as BlockEditorProps<T>['block']}
      onChange={onChange as BlockEditorProps<T>['onChange']}
    />
  );
}

/** Formulario del bloque seleccionado, con sus acciones */
export function BlockPanel({ item }: { item: EditorBlock }) {
  const { select, updateBlock, removeBlock, duplicateBlock } =
    usePageEditorActions();
  const serverErrors = usePageEditorServerErrors()[item.key] ?? [];
  const meta = usePageEditorMeta();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const entry = BLOCK_CATALOG[item.block.type];
  const errors = Array.from(
    new Set([...validateBlock(item.block), ...serverErrors])
  );
  const isFloatingCta =
    item.block.type === 'cta' && item.block.variant === 'floating';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => select(null)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Bloques
        </Button>
        <span className="flex-1 truncate text-sm font-semibold">
          {entry.label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={item.block.isVisible ? 'Ocultar' : 'Mostrar'}
          onClick={() =>
            updateBlock(item.key, {
              ...item.block,
              isVisible: !item.block.isVisible,
            })
          }
        >
          {item.block.isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Duplicar"
          disabled={isFloatingCta}
          onClick={() => duplicateBlock(item.key)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700"
          title="Eliminar"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {!item.block.isVisible && (
        <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
          Bloque oculto: no aparece en la página publicada.
        </p>
      )}
      {errors.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-md bg-red-50 p-3 text-xs text-red-700">
          {errors.map((error) => (
            <li key={error} className="flex gap-1.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </li>
          ))}
        </ul>
      )}
      <Editor item={item} onChange={(block) => updateBlock(item.key, block)} />
      {!isFloatingCta && (
        <div className="flex flex-col gap-3 border-t pt-5">
          <h3 className="text-sm font-semibold">Estilo</h3>
          <StyleField
            value={item.block.style}
            theme={meta.theme}
            accentColor={meta.accentColor}
            withTone={
              (item.block.type === 'hero' && item.block.variant === 'full') ||
              (item.block.type === 'media' && item.block.variant === 'overlay')
            }
            textParts={
              ['hero', 'text', 'media'].includes(item.block.type)
                ? ['heading', 'body']
                : ['gallery', 'products'].includes(item.block.type)
                  ? ['heading']
                  : []
            }
            onChange={(style) =>
              updateBlock(item.key, { ...item.block, style })
            }
          />
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar este bloque?"
        description="Se quita de la página al guardar. Las fotos que solo usaba este bloque se borran."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          removeBlock(item.key);
          setConfirmDelete(false);
        }}
      />
    </div>
  );
}
