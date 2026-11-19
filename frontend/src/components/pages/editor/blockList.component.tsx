'use client';

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  ChevronRight,
  EyeOff,
  GripVertical,
  PanelBottom,
  PanelTop,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  EditorBlock,
  usePageEditorActions,
  usePageEditorBlocks,
  usePageEditorMeta,
  usePageEditorProducts,
  usePageEditorSelectedChrome,
  usePageEditorServerErrors,
  usePageEditorSurveys,
} from '@/stores/pages/pageEditor.store';
import { BLOCK_CATALOG, blockSummary } from '../blocks/catalog';
import { validateBlock } from '../blocks/blockSchemas';

function BlockRow({ item }: { item: EditorBlock }) {
  const { select } = usePageEditorActions();
  const surveys = usePageEditorSurveys();
  const products = usePageEditorProducts();
  const serverErrors = usePageEditorServerErrors();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });
  const entry = BLOCK_CATALOG[item.block.type];
  const Icon = entry.icon;
  const hasErrors =
    validateBlock(item.block).length > 0 || !!serverErrors[item.key]?.length;
  const surveyTitle =
    item.block.type === 'survey'
      ? surveys[item.block.config.surveyId]?.title
      : undefined;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-2 rounded-xl border bg-white pr-2 shadow-sm transition-shadow',
        isDragging && 'relative z-10 shadow-lg ring-2 ring-[#ff8635]/40',
        !item.block.isVisible && 'opacity-60'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
        className="cursor-grab touch-none self-stretch rounded-l-xl px-2 text-gray-300 hover:text-gray-600 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => select(item.key)}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff8635]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold">{entry.label}</span>
          <span className="truncate text-xs text-gray-500">
            {blockSummary(item.block, surveyTitle, (id) => products[id]?.name)}
          </span>
        </span>
        {!item.block.isVisible && (
          <EyeOff className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        {hasErrors && <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />}
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-gray-500" />
      </button>
    </li>
  );
}

/**
 * Cabecera y pie: no son bloques (enmarcan toda la página y no se mueven),
 * pero se listan junto a ellos para que se vea que se pueden editar.
 */
function ChromeRow({ part }: { part: 'header' | 'footer' }) {
  const meta = usePageEditorMeta();
  const { selectChrome } = usePageEditorActions();
  const active = usePageEditorSelectedChrome() === part;
  const isHeader = part === 'header';
  const Icon = isHeader ? PanelTop : PanelBottom;
  const hidden = isHeader ? !meta.showLogo : !meta.showFooter;
  const summary = isHeader
    ? hidden
      ? 'Sin logo'
      : meta.headerStyle === 'site'
        ? 'Barra de Moto Candela'
        : meta.logoImageId
          ? 'Logo propio'
          : 'Logo de Moto Candela'
    : hidden
      ? 'Oculto'
      : meta.footerStyle === 'site'
        ? 'Pie de Moto Candela'
        : meta.footerText.trim() || 'Logo, redes y año';
  return (
    <button
      type="button"
      onClick={() => selectChrome(part)}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border border-dashed bg-gray-50/70 py-2.5 pl-4 pr-2 text-left transition-colors hover:bg-gray-100',
        active && 'border-[#ff8635] bg-orange-50',
        hidden && 'opacity-60'
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 ring-1 ring-gray-200">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-gray-700">
          {isHeader ? 'Cabecera' : 'Pie de página'}
        </span>
        <span className="truncate text-xs text-gray-500">{summary}</span>
      </span>
      {hidden && <EyeOff className="h-4 w-4 shrink-0 text-gray-400" />}
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-gray-500" />
    </button>
  );
}

/** Bloques de la página, reordenables arrastrando (o con el teclado) */
export function BlockList() {
  const blocks = usePageEditorBlocks();
  const { moveBlock } = usePageEditorActions();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id)
      moveBlock(String(active.id), String(over.id));
  };

  return (
    <div className="flex flex-col gap-2">
      <ChromeRow part="header" />
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-gray-500">
          La página está vacía. Agrega tu primer bloque.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={blocks.map((item) => item.key)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {blocks.map((item) => (
                <BlockRow key={item.key} item={item} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <ChromeRow part="footer" />
    </div>
  );
}
