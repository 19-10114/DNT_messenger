'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
  Save,
  Undo2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { useToast } from '@/components/ui/use-toast';
import { PAGES } from '@/constants/routes';
import { usePage, usePageMutations } from '@/hooks/pages';
import { useIsSuperAdmin, useToken } from '@/stores/auth/auth.store';
import {
  pageEditorDraft,
  usePageEditorActions,
  usePageEditorBlocks,
  usePageEditorDirty,
  usePageEditorMeta,
  usePageEditorPanel,
  usePageEditorSelectedChrome,
  usePageEditorSelectedKey,
  usePageEditorStore,
} from '@/stores/pages/pageEditor.store';
import { PageDetail, UpdatePageMetaPayload } from '@/services/pages/types';
import { validateBlock } from '../blocks/blockSchemas';
import {
  STATUS_TONE_CLASSES,
  getBlockErrors,
  getPagesErrorMessage,
  pageStatusInfo,
  publicPagePath,
  publicPageUrl,
} from '../pages.utils';
import { BlockList } from './blockList.component';
import { BlockPanel } from './blockPanel.component';
import { BlockPicker } from './blockPicker.component';
import { ChromePanel } from './chromePanel.component';
import { PageSettingsPanel } from './pageSettingsPanel.component';
import { PreviewFrame } from './previewFrame.component';

const DRAFT_SAVE_MS = 600;

/** Solo lo que cambió respecto de lo guardado */
function metaChanges(page: PageDetail): UpdatePageMetaPayload {
  const { meta } = usePageEditorStore.getState();
  const changes: UpdatePageMetaPayload = {};
  if (meta.title.trim() !== page.title) changes.title = meta.title.trim();
  if (meta.slug && meta.slug !== page.slug) changes.slug = meta.slug;
  if (meta.theme !== page.theme) changes.theme = meta.theme;
  if (meta.accentColor !== (page.accentColor ?? '')) {
    changes.accentColor = meta.accentColor;
  }
  if (meta.seoTitle !== page.seoTitle) changes.seoTitle = meta.seoTitle;
  if (meta.seoDescription !== page.seoDescription) {
    changes.seoDescription = meta.seoDescription;
  }
  if (meta.expiresAt !== page.expiresAt) changes.expiresAt = meta.expiresAt;
  if (meta.ogImageId !== page.ogImageId) changes.ogImageId = meta.ogImageId;
  if (meta.showLogo !== page.showLogo) changes.showLogo = meta.showLogo;
  if (meta.headerStyle !== (page.headerStyle ?? 'logo')) {
    changes.headerStyle = meta.headerStyle;
  }
  if (meta.logoImageId !== page.logoImageId) {
    changes.logoImageId = meta.logoImageId;
  }
  if (meta.showFooter !== page.showFooter) changes.showFooter = meta.showFooter;
  if (meta.footerStyle !== (page.footerStyle ?? 'simple')) {
    changes.footerStyle = meta.footerStyle;
  }
  if (meta.footerText !== page.footerText) changes.footerText = meta.footerText;
  if (JSON.stringify(meta.socialLinks) !== JSON.stringify(page.socialLinks)) {
    changes.socialLinks = meta.socialLinks;
  }
  return changes;
}

function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(publicPageUrl(slug));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-gray-100 px-3 py-1 font-mono text-xs text-gray-600 hover:bg-gray-200"
      title="Copiar link"
    >
      {publicPagePath(slug)}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/**
 * Editor de una página: bloques y ajustes a la izquierda, vista previa en
 * vivo a la derecha. El borrador vive en `pageEditor.store` y se respalda en
 * `localStorage`; guardar es explícito.
 */
export function PageEditor({ pageId }: { pageId: number }) {
  const token = useToken();
  const isSuperAdmin = useIsSuperAdmin();
  const { toast } = useToast();
  const { page, isLoadingPage, isErrorPage } = usePage(token, pageId);
  const {
    savePage,
    isSavingPage,
    publishPage,
    isPublishingPage,
    unpublishPage,
    isUnpublishingPage,
  } = usePageMutations(token);
  const actions = usePageEditorActions();
  const meta = usePageEditorMeta();
  const blocks = usePageEditorBlocks();
  const dirty = usePageEditorDirty();
  const selectedKey = usePageEditorSelectedKey();
  const selectedChrome = usePageEditorSelectedChrome();
  const selected = blocks.find((item) => item.key === selectedKey);

  const tab = usePageEditorPanel();
  const setTab = actions.setPanel;
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const initializedFor = useRef<number | null>(null);

  // Primera carga: el borrador local gana si se hizo sobre esta misma versión
  useEffect(() => {
    if (!page || initializedFor.current === page.id) return;
    initializedFor.current = page.id;
    const draft = pageEditorDraft.read(page.id);
    if (draft && draft.baseUpdatedAt === page.updatedAt) {
      actions.restore({
        ...draft,
        // Las URLs firmadas del respaldo ya vencieron: las del servidor mandan
        images: {
          ...draft.images,
          ...Object.fromEntries(page.images.map((image) => [image.id, image])),
        },
        // Igual con las fotos de los productos del catálogo
        products: {
          ...(draft.products ?? {}),
          ...Object.fromEntries(
            (page.products ?? []).map((product) => [product.id, product])
          ),
        },
        // Respaldos de antes del acento o del estilo de cabecera
        meta: {
          ...draft.meta,
          accentColor: draft.meta.accentColor ?? '',
          headerStyle: draft.meta.headerStyle ?? 'logo',
          footerStyle: draft.meta.footerStyle ?? 'simple',
        },
      });
      setRestoredDraft(true);
    } else {
      if (draft) pageEditorDraft.clear(page.id);
      actions.load(page);
    }
  }, [page, actions]);

  // Respaldo del borrador mientras se edita
  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = usePageEditorStore.subscribe((state) => {
      if (!state.dirty || state.pageId !== pageId) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const {
          pageId: id,
          baseUpdatedAt,
          meta: m,
          blocks: b,
          images,
          surveys,
          products,
        } = usePageEditorStore.getState();
        pageEditorDraft.write({
          pageId: id,
          baseUpdatedAt,
          meta: m,
          blocks: b,
          images,
          surveys,
          products,
        });
      }, DRAFT_SAVE_MS);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [pageId]);

  // Aviso del navegador al salir con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!isSuperAdmin) {
    return (
      <p className="py-16 text-center text-gray-600">
        Solo Super Admin puede editar páginas.
      </p>
    );
  }
  if (isLoadingPage || (page && initializedFor.current !== page.id)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (isErrorPage || !page) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-gray-600">
        No se encontró la página.
        <Link href={PAGES} className="text-sm underline">
          Volver a Páginas
        </Link>
      </div>
    );
  }

  const save = async (): Promise<PageDetail | null> => {
    const state = usePageEditorStore.getState();
    if (!state.meta.title.trim()) {
      setTab('settings');
      toast({ title: 'La página necesita un nombre', variant: 'destructive' });
      return null;
    }
    const badLink = (state.meta.socialLinks ?? []).find(
      (link) =>
        !/^(https?:\/\/\S+|mailto:\S+|tel:\+?[0-9]{6,15})$/.test(link.url)
    );
    if (badLink) {
      setTab('settings');
      toast({
        title: 'Revisa las redes del pie',
        description:
          'Cada red necesita un link completo que empiece por https://',
        variant: 'destructive',
      });
      return null;
    }
    const invalid = state.blocks.find(
      (item) => validateBlock(item.block).length > 0
    );
    if (invalid) {
      setTab('blocks');
      actions.select(invalid.key);
      toast({
        title: 'Hay bloques por completar',
        description: 'Revisa los campos marcados en rojo.',
        variant: 'destructive',
      });
      return null;
    }
    try {
      const saved = await savePage({
        pageId,
        meta: metaChanges(page),
        blocks: state.blocks.map((item) => item.block),
      });
      actions.markSaved(saved);
      pageEditorDraft.clear(pageId);
      setRestoredDraft(false);
      return saved;
    } catch (error) {
      const byIndex = getBlockErrors(error);
      const byKey = Object.fromEntries(
        Object.entries(byIndex)
          .map(([index, messages]) => [
            state.blocks[Number(index)]?.key,
            messages,
          ])
          .filter(([key]) => !!key)
      );
      actions.setServerErrors(byKey);
      const firstKey = Object.keys(byKey)[0];
      if (firstKey) {
        setTab('blocks');
        actions.select(firstKey);
      }
      toast({
        title: 'No se pudo guardar',
        description: getPagesErrorMessage(
          error,
          'Intenta de nuevo en un momento.'
        ),
        variant: 'destructive',
      });
      return null;
    }
  };

  const onSave = async () => {
    if (await save()) toast({ title: 'Cambios guardados' });
  };

  const onPublish = async () => {
    if (dirty && !(await save())) return;
    try {
      const published = await publishPage(pageId);
      actions.markSaved(published);
      toast({
        title: '¡Página publicada!',
        description: 'Ya puedes compartir el link.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo publicar',
        description: getPagesErrorMessage(
          error,
          'Intenta de nuevo en un momento.'
        ),
        variant: 'destructive',
      });
    }
  };

  const onUnpublish = async () => {
    try {
      const draft = await unpublishPage(pageId);
      actions.markSaved(draft);
      setConfirmUnpublish(false);
      toast({ title: 'La página dejó de estar en línea' });
    } catch (error) {
      toast({
        title: 'No se pudo despublicar',
        description: getPagesErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    }
  };

  const status = pageStatusInfo(page);
  const isPublished = page.status === 'published';
  const busy = isSavingPage || isPublishingPage || isUnpublishingPage;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-7.5rem)]">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-200 lg:flex-row lg:items-center lg:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href={PAGES}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Volver a Páginas"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-lg font-semibold">
                {meta.title || 'Sin nombre'}
              </h1>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                  STATUS_TONE_CLASSES[status.tone]
                )}
              >
                {status.label}
              </span>
              {dirty && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Sin guardar
                </span>
              )}
            </div>
            <CopyLink slug={page.slug} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {page.isLive && (
            <Button asChild variant="ghost" size="sm">
              <a
                href={publicPagePath(page.slug)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Ver página
              </a>
            </Button>
          )}
          {isPublished && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmUnpublish(true)}
            >
              <Undo2 className="mr-1.5 h-4 w-4" />
              Despublicar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !dirty}
            onClick={onSave}
          >
            {isSavingPage ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Guardar
          </Button>
          {(!isPublished || dirty) && (
            <Button
              size="sm"
              disabled={busy}
              onClick={isPublished ? onSave : onPublish}
              className="bg-[#ff8635] text-white hover:bg-[#f0752a]"
            >
              {isPublishingPage ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-1.5 h-4 w-4" />
              )}
              {isPublished ? 'Guardar y actualizar' : 'Publicar'}
            </Button>
          )}
        </div>
      </div>

      {restoredDraft && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
          Recuperamos los cambios que no habías guardado.
          <button
            type="button"
            className="font-medium underline"
            onClick={() => {
              pageEditorDraft.clear(pageId);
              actions.load(page);
              setRestoredDraft(false);
            }}
          >
            Descartarlos
          </button>
        </div>
      )}
      {isPublished && dirty && (
        <p className="rounded-xl bg-sky-50 px-4 py-2 text-sm text-sky-900 ring-1 ring-sky-200">
          La página está en línea: al guardar, los cambios se ven de inmediato.
        </p>
      )}

      {/* Celular: alternar edición y vista previa */}
      <div className="flex gap-1 self-center rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-200 lg:hidden">
        {(['edit', 'preview'] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setMobileView(view)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm',
              mobileView === view ? 'bg-gray-900 text-white' : 'text-gray-600'
            )}
          >
            {view === 'edit' ? 'Editar' : 'Vista previa'}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[400px_1fr]">
        <aside
          className={cn(
            'flex min-h-0 flex-col rounded-2xl bg-white shadow-sm ring-1 ring-gray-200',
            mobileView === 'preview' && 'hidden lg:flex'
          )}
        >
          <div className="flex gap-1 border-b p-2">
            {(['blocks', 'settings'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                  tab === value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {value === 'blocks' ? 'Bloques' : 'Página'}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'settings' ? (
              <PageSettingsPanel />
            ) : selected ? (
              <BlockPanel key={selected.key} item={selected} />
            ) : selectedChrome ? (
              <ChromePanel key={selectedChrome} part={selectedChrome} />
            ) : (
              <div className="flex flex-col gap-3">
                <BlockList />
                <BlockPicker />
              </div>
            )}
          </div>
        </aside>
        <section
          className={cn(
            'min-h-[640px] rounded-2xl bg-neutral-200/60 p-4 lg:min-h-0',
            mobileView === 'edit' && 'hidden lg:block'
          )}
        >
          <PreviewFrame />
        </section>
      </div>

      <ConfirmDialog
        open={confirmUnpublish}
        onOpenChange={setConfirmUnpublish}
        title="¿Despublicar la página?"
        description="El link deja de funcionar hasta que la vuelvas a publicar. No se borra nada."
        confirmLabel="Despublicar"
        isLoading={isUnpublishingPage}
        onConfirm={onUnpublish}
      />
    </div>
  );
}
