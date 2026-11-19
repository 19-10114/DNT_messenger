'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Archive,
  Copy,
  CopyPlus,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import { useToast } from '@/components/ui/use-toast';
import { PAGES_NEW, PAGE_EDIT } from '@/constants/routes';
import { usePageMutations, usePages } from '@/hooks/pages';
import { useIsSuperAdmin, useToken } from '@/stores/auth/auth.store';
import { PageListItem, PageListStatusFilter } from '@/services/pages/types';
import {
  STATUS_TONE_CLASSES,
  formatDate,
  getPagesErrorMessage,
  pageStatusInfo,
  publicPagePath,
  publicPageUrl,
} from '../pages.utils';
import { getTheme } from '../themes';

const PAGE_SIZE = 12;

const TABS: { value: PageListStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'live', label: 'En línea' },
  { value: 'draft', label: 'Borradores' },
  { value: 'archived', label: 'Archivadas' },
];

function PageCard({
  page,
  onDuplicate,
  onArchive,
}: {
  page: PageListItem;
  onDuplicate: () => void;
  onArchive: () => void;
}) {
  const { toast } = useToast();
  const status = pageStatusInfo(page);
  const archived = page.status === 'archived';
  const editHref = PAGE_EDIT(page.id);

  const thumbnail = (
    <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
      {page.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{ background: getTheme(page.theme).vars.placeholder }}
        />
      )}
      <span
        className={cn(
          'absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset backdrop-blur',
          STATUS_TONE_CLASSES[status.tone]
        )}
      >
        {status.label}
      </span>
    </div>
  );

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
      {archived ? thumbnail : <Link href={editHref}>{thumbnail}</Link>}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {archived ? (
              <p className="truncate font-semibold">{page.title}</p>
            ) : (
              <Link
                href={editHref}
                className="block truncate font-semibold hover:underline"
              >
                {page.title}
              </Link>
            )}
            <p className="truncate font-mono text-xs text-gray-500">
              {publicPagePath(page.slug)}
            </p>
          </div>
          {!archived && (
            <DropdownMenu
              // Con el modo modal, abrir "Archivar" (un AlertDialog) desde el
              // menú deja `pointer-events: none` en el body y la página deja
              // de responder a los clics
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={editHref}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                {page.isLive && (
                  <DropdownMenuItem asChild>
                    <a
                      href={publicPagePath(page.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver página
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      publicPageUrl(page.slug)
                    );
                    toast({ title: 'Link copiado' });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <CopyPlus className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={onArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="mt-auto text-xs text-gray-400">
          {page.blockCount} bloque{page.blockCount === 1 ? '' : 's'} · Editada{' '}
          {formatDate(page.updatedAt)}
          {page.updatedByName ? ` por ${page.updatedByName}` : ''}
          {page.expiresAt ? ` · Vence ${formatDate(page.expiresAt)}` : ''}
        </p>
      </div>
    </div>
  );
}

/** Listado de Páginas: tarjetas con miniatura, estado y acciones */
export function PagesManagement() {
  const router = useRouter();
  const token = useToken();
  const isSuperAdmin = useIsSuperAdmin();
  const { toast } = useToast();
  const [status, setStatus] = useState<PageListStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toArchive, setToArchive] = useState<PageListItem | null>(null);
  const { pages, pagination, isLoadingPages, isErrorPages, isFetchingPages } =
    usePages(token, {
      page,
      pageSize: PAGE_SIZE,
      status,
      search,
    });
  const { duplicatePage, archivePage, isArchivingPage } =
    usePageMutations(token);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="mb-4 text-2xl font-bold">Acceso denegado</h1>
        <p className="text-gray-600">
          No tienes permisos para acceder a esta página.
        </p>
      </div>
    );
  }

  const duplicate = async (item: PageListItem) => {
    try {
      const copy = await duplicatePage(item.id);
      toast({
        title: 'Página duplicada',
        description: 'Se creó como borrador.',
      });
      router.push(PAGE_EDIT(copy.id));
    } catch (error) {
      toast({
        title: 'No se pudo duplicar',
        description: getPagesErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    }
  };

  const archive = async () => {
    if (!toArchive) return;
    try {
      await archivePage(toArchive.id);
      toast({ title: 'Página archivada' });
      setToArchive(null);
    } catch (error) {
      toast({
        title: 'No se pudo archivar',
        description: getPagesErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="border-l-4 border-primary pl-4">
          <h1 className="font-serif text-2xl font-semibold text-primary">
            Páginas
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Páginas públicas con link propio: promociones, encuestas,
            lanzamientos y eventos.
          </p>
        </div>
        <Button asChild className="bg-[#ff8635] text-white hover:bg-[#f0752a]">
          <Link href={PAGES_NEW}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva página
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" className="flex w-max gap-1 border-b">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
                status === tab.value
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isFetchingPages && !isLoadingPages && (
            <span className="text-xs text-gray-400">Actualizando…</span>
          )}
          <SearchInput
            placeholder="Nombre o link"
            initialValue={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {isLoadingPages ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      ) : isErrorPages ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar las páginas. Intenta de nuevo en un momento.
        </p>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-white py-16 text-center">
          <p className="text-gray-600">
            {search || status !== 'all'
              ? 'No hay páginas con estos filtros.'
              : 'Todavía no hay páginas.'}
          </p>
          {!search && status === 'all' && (
            <Button asChild variant="outline">
              <Link href={PAGES_NEW}>Crear la primera</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((item) => (
            <PageCard
              key={item.id}
              page={item}
              onDuplicate={() => duplicate(item)}
              onArchive={() => setToArchive(item)}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <PaginationComponent
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!toArchive}
        onOpenChange={(open) => !open && setToArchive(null)}
        title="¿Archivar la página?"
        description={
          <>
            “{toArchive?.title}” deja de estar en línea y sale del listado. Su
            link no se reutiliza.
          </>
        }
        confirmLabel="Archivar"
        destructive
        isLoading={isArchivingPage}
        onConfirm={archive}
      />
    </section>
  );
}
