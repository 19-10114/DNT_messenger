'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Send,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.component';
import { Button } from '@/components/ui/button.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { cn } from '@/lib/utils';

/**
 * GenericTable — the single table shell for the whole dashboard.
 *
 * Rules of engagement (see ARCHITECTURE.md):
 * - Every new table must be built with this component.
 * - If a table needs behaviour that does not exist here yet, EXTEND this
 *   component (new prop / new variant) instead of writing another table.
 *
 * Note: it renders its own `<table>` element instead of the `Table` atom
 * because that atom hardcodes an `overflow-auto` wrapper, which breaks the
 * sticky header when the page (and not the table) is the scrolling element.
 * All the other atoms (`TableHeader`, `TableRow`, `TableHead`, ...) are reused.
 */

export type GenericTableAlign = 'left' | 'center' | 'right';

export type GenericTableDensity = 'comfortable' | 'compact';

export type GenericTableHeaderVariant = 'muted' | 'transparent';

/** Shorthand names so callers do not need to import lucide icons. */
export type GenericTableIconName =
  | 'edit'
  | 'view'
  | 'delete'
  | 'download'
  | 'upload'
  | 'add'
  | 'print'
  | 'copy'
  | 'send'
  | 'document'
  | 'link'
  | 'check'
  | 'close'
  | 'more';

const ACTION_ICONS: Record<GenericTableIconName, LucideIcon> = {
  edit: Pencil,
  view: Eye,
  delete: Trash2,
  download: Download,
  upload: Upload,
  add: Plus,
  print: Printer,
  copy: Copy,
  send: Send,
  document: FileText,
  link: ExternalLink,
  check: Check,
  close: X,
  more: MoreHorizontal,
};

export interface GenericTableColumn<T> {
  /** Unique id of the column; also the default accessor into the row object. */
  key: string;
  /** Header label (rendered uppercase by the design). */
  header: React.ReactNode;
  /** Custom cell renderer — use it for badges, color circles, currency, ... */
  render?: (row: T, rowIndex: number) => React.ReactNode;
  align?: GenericTableAlign;
  /** CSS width, e.g. `'120px'` or `'20%'`. */
  width?: string;
  className?: string;
  headerClassName?: string;
  /** Per-row classes — conditional highlights (missing data, alerts, ...). */
  cellClassName?: (row: T, rowIndex: number) => string | undefined;
  /** Skip the column entirely (conditional columns, permissions, ...). */
  hidden?: boolean;
  /** Pins the column to the left while the table scrolls horizontally. */
  sticky?: boolean;
  /**
   * Value for this column in the totals row rendered under the header. The
   * row only exists when at least one column defines it.
   */
  summary?: React.ReactNode;
  /**
   * Igual que `summary` pero al pie de la tabla (`<tfoot>`): el total de la
   * columna después de las filas. También aparece solo si alguna lo define.
   */
  footer?: React.ReactNode;
  /**
   * Makes the cell content clickable: it is rendered underlined and fires this
   * callback (e.g. click on the id → open a details modal).
   */
  onCellClick?: (row: T, rowIndex: number) => void;
  /** Same as `onCellClick` but navigates to another page instead. */
  href?: (row: T, rowIndex: number) => string;
}

export interface GenericTableAction<T> {
  /**
   * Visible text, and the hover tooltip when the action is icon-only.
   * Puede depender de la fila (un botón que alterna "Ver" / "Ocultar").
   */
  label: string | ((row: T, rowIndex: number) => string);
  onClick?: (row: T, rowIndex: number) => void;
  /** Navigates instead of calling back (e.g. "Editar" → edit page). */
  href?: (row: T, rowIndex: number) => string;
  /**
   * Icon shorthand (`'edit'`, `'delete'`, ...) or any lucide icon component.
   * With an icon the action becomes icon-only and shows `label` on hover;
   * set `showLabel` to render icon + text.
   */
  icon?: GenericTableIconName | LucideIcon;
  showLabel?: boolean;
  variant?:
    | 'default'
    | 'outline'
    | 'ghost'
    | 'secondary'
    | 'destructive'
    | 'link';
  hidden?: (row: T, rowIndex: number) => boolean;
  disabled?: (row: T, rowIndex: number) => boolean;
  className?: string;
}

export interface GenericTablePagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total de registros: habilita el "Mostrando X-Y de Z". */
  totalElements?: number;
  pageSize?: number;
  /** Habilita el selector de registros por página. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface GenericTableProps<T> {
  columns: GenericTableColumn<T>[];
  data: T[];
  /** Defaults to `row.id` and falls back to the row index. */
  getRowKey?: (row: T, index: number) => React.Key;
  /** Renders the "Acciones" column. */
  actions?: GenericTableAction<T>[];
  actionsHeader?: React.ReactNode;
  actionsAlign?: GenericTableAlign;
  title?: React.ReactNode;
  /** Right side of the title bar: search, filters, export button, ... */
  toolbar?: React.ReactNode;
  /** Rendered under the table (and under the pagination). */
  footer?: React.ReactNode;
  caption?: React.ReactNode;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyMessage?: React.ReactNode;
  onRowClick?: (row: T, rowIndex: number) => void;
  rowClassName?: (row: T, rowIndex: number) => string | undefined;
  /** Alternating row background. Default `true`. */
  striped?: boolean;
  density?: GenericTableDensity;
  headerVariant?: GenericTableHeaderVariant;
  /** Header stays visible while scrolling. Default `true`. */
  stickyHeader?: boolean;
  /** CSS max height (e.g. `'60vh'`) to scroll inside the table itself. */
  maxHeight?: string;
  pagination?: GenericTablePagination;
  className?: string;
  tableClassName?: string;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50];

const ALIGN_CELL: Record<GenericTableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const ALIGN_FLEX: Record<GenericTableAlign, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

/**
 * El tooltip vive dentro del contenedor con scroll, así que se recorta contra
 * su borde. Como la columna de acciones es siempre la última, se ancla al
 * borde derecho del botón y crece hacia la izquierda: es la única dirección
 * que garantiza quedar dentro de la tabla, sin importar la alineación.
 */
const TOOLTIP_ANCHOR = 'right-0';

const DENSITY_CELL: Record<GenericTableDensity, string> = {
  comfortable: 'px-4 py-3',
  compact: 'px-3 py-2',
};

const DENSITY_HEAD: Record<GenericTableDensity, string> = {
  comfortable: 'h-11 px-4',
  compact: 'h-9 px-3',
};

/** Sticky headers must stay opaque so rows do not bleed through them. */
const HEADER_BACKGROUND: Record<GenericTableHeaderVariant, string> = {
  muted: 'bg-gray-100',
  transparent: 'bg-background',
};

const SUMMARY_BACKGROUND: Record<GenericTableHeaderVariant, string> = {
  muted: 'bg-gray-50',
  transparent: 'bg-background',
};

/** Vertical offset of the totals row, i.e. the height of the header row. */
const SUMMARY_STICKY_TOP: Record<GenericTableDensity, string> = {
  comfortable: 'top-11',
  compact: 'top-9',
};

/**
 * Scrollbar fina y sin flechas: `scrollbar-*` cubre Firefox y las reglas
 * `::-webkit-scrollbar` el resto. El pulgar es gris claro y se oscurece al
 * pasar el mouse por encima, así no compite con los datos.
 */
const SCROLLBAR_CLASS = cn(
  '[scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent]',
  '[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-corner]:bg-transparent',
  // El borde transparente + `bg-clip-content` es lo que deja el pulgar
  // flotando dentro del riel en lugar de tocar los bordes
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:border-2',
  '[&::-webkit-scrollbar-thumb]:border-solid',
  '[&::-webkit-scrollbar-thumb]:border-transparent',
  '[&::-webkit-scrollbar-thumb]:bg-gray-300',
  '[&::-webkit-scrollbar-thumb]:bg-clip-content',
  'hover:[&::-webkit-scrollbar-thumb]:bg-gray-400'
);

/**
 * Escala de apilado interna de la tabla. Se mantiene **por debajo del `z-10`
 * del `<aside>` de `MenuLayout`**: ese menú es `fixed` y en móvil se desliza
 * por encima del contenido, así que un header sticky con un z mayor se le
 * montaba encima. Acá solo hace falta que las celdas fijas queden sobre las
 * filas, no sobre el resto de la aplicación.
 */
const Z_STICKY_COLUMN = 'z-[1]';
const Z_STICKY_HEADER = 'z-[2]';
const Z_STICKY_CORNER = 'z-[3]'; // cruce de header sticky + columna fija
const Z_ACTION_TOOLTIP = 'z-[4]';

const INTERACTIVE_CELL_CLASS =
  'rounded-sm font-medium text-primary underline underline-offset-2 decoration-gray-300 transition-colors hover:text-secondary hover:decoration-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

function resolveIcon(
  icon: GenericTableIconName | LucideIcon | undefined
): LucideIcon | undefined {
  if (!icon) return undefined;
  return typeof icon === 'string' ? ACTION_ICONS[icon] : icon;
}

/** Turns a raw row value into something React can render. */
function toCellNode(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    React.isValidElement(value)
  ) {
    return value;
  }
  return String(value);
}

function readValue<T>(row: T, key: string): unknown {
  return (row as unknown as Record<string, unknown>)[key];
}

export function GenericTable<T>({
  columns,
  data,
  getRowKey,
  actions,
  actionsHeader = 'Acciones',
  // Como el resto de las columnas: el contenido arranca a la izquierda
  actionsAlign = 'left',
  title,
  toolbar,
  footer,
  caption,
  isLoading = false,
  skeletonRows = 5,
  emptyMessage = 'No hay datos para mostrar.',
  onRowClick,
  rowClassName,
  striped = true,
  density = 'comfortable',
  headerVariant = 'muted',
  stickyHeader = true,
  maxHeight,
  pagination,
  className,
  tableClassName,
}: GenericTableProps<T>): JSX.Element {
  const visibleColumns = columns.filter((column) => !column.hidden);
  const hasActions = Boolean(actions && actions.length > 0);
  const columnCount = visibleColumns.length + (hasActions ? 1 : 0);
  const hasSummaryRow = visibleColumns.some(
    (column) => column.summary !== undefined
  );
  const hasFooterRow = visibleColumns.some(
    (column) => column.footer !== undefined
  );

  const headCellClass = cn(
    DENSITY_HEAD[density],
    'whitespace-nowrap border-b border-border text-[11px] font-semibold uppercase tracking-wider text-gray-500',
    HEADER_BACKGROUND[headerVariant],
    stickyHeader && cn('sticky top-0', Z_STICKY_HEADER)
  );
  const summaryCellClass = cn(
    DENSITY_HEAD[density],
    'whitespace-nowrap border-b border-border text-xs font-semibold text-gray-700',
    SUMMARY_BACKGROUND[headerVariant],
    stickyHeader && cn('sticky', Z_STICKY_HEADER, SUMMARY_STICKY_TOP[density])
  );
  // The table uses `border-separate`, so row separators live on the cells:
  // in the separated-borders model a `<tr>` border is never painted.
  const bodyCellClass = cn(
    DENSITY_CELL[density],
    'border-b border-border/60 align-middle text-sm text-gray-700'
  );
  // El fondo va en cada celda, no en el `<tfoot>`, para que una columna fija
  // (que hereda el fondo de su celda) siga siendo opaca al scrollear
  const footerCellClass = cn(
    DENSITY_CELL[density],
    'border-t border-border bg-gray-50 text-sm font-semibold text-gray-700'
  );

  // A pinned cell must be opaque, and `bg-inherit` is what keeps it in sync
  // with the zebra/hover background of its own row.
  const stickyColumnClass = cn('sticky left-0 bg-inherit', Z_STICKY_COLUMN);

  // Every row states its background explicitly (and not just the striped ones)
  // so that a pinned cell always has an opaque colour to inherit.
  const rowBackgroundClass = (rowIndex: number): string =>
    striped && rowIndex % 2 === 1 ? 'bg-gray-100' : 'bg-background';

  // "Mostrando 1-10 de 53": solo si el consumidor pasó el total y el tamaño
  const rangeLabel = (() => {
    if (!pagination?.totalElements || !pagination.pageSize) return null;

    const firstItem = (pagination.currentPage - 1) * pagination.pageSize + 1;
    const lastItem = Math.min(
      pagination.currentPage * pagination.pageSize,
      pagination.totalElements
    );
    return `Mostrando ${firstItem}-${lastItem} de ${pagination.totalElements}`;
  })();

  // Horizontal overflow turns the wrapper into a scroll container on BOTH axes,
  // so a sticky header can only stick against the wrapper — never against the
  // page. Capping its height is what makes the header actually stay visible;
  // shorter tables never reach the cap and render whole.
  const scrollMaxHeight = maxHeight ?? (stickyHeader ? '70vh' : undefined);

  const resolveRowKey = (row: T, index: number): React.Key => {
    if (getRowKey) return getRowKey(row, index);
    const id = readValue(row, 'id');
    return typeof id === 'string' || typeof id === 'number' ? id : index;
  };

  const renderCell = (
    column: GenericTableColumn<T>,
    row: T,
    rowIndex: number
  ): React.ReactNode => {
    const content = column.render
      ? column.render(row, rowIndex)
      : toCellNode(readValue(row, column.key));

    const href = column.href?.(row, rowIndex);
    if (href) {
      return (
        <Link
          href={href}
          className={INTERACTIVE_CELL_CLASS}
          onClick={(event) => event.stopPropagation()}
        >
          {content}
        </Link>
      );
    }

    if (column.onCellClick) {
      return (
        <button
          type="button"
          className={INTERACTIVE_CELL_CLASS}
          onClick={(event) => {
            event.stopPropagation();
            column.onCellClick?.(row, rowIndex);
          }}
        >
          {content}
        </button>
      );
    }

    return content;
  };

  const renderAction = (
    action: GenericTableAction<T>,
    row: T,
    rowIndex: number,
    actionIndex: number
  ): React.ReactNode => {
    const Icon = resolveIcon(action.icon);
    const iconOnly = Boolean(Icon) && !action.showLabel;
    const disabled = action.disabled?.(row, rowIndex) ?? false;
    const href = !disabled ? action.href?.(row, rowIndex) : undefined;
    const variant = action.variant ?? (iconOnly ? 'ghost' : 'outline');
    const label =
      typeof action.label === 'function'
        ? action.label(row, rowIndex)
        : action.label;

    const content = (
      <>
        {Icon ? (
          <Icon
            className={cn('h-4 w-4', !iconOnly && 'mr-1.5')}
            aria-hidden="true"
          />
        ) : null}
        {iconOnly ? <span className="sr-only">{label}</span> : label}
      </>
    );

    const buttonClass = cn(
      iconOnly ? 'h-8 w-8 p-0' : 'h-8 px-3 text-xs',
      action.className
    );

    return (
      <span key={actionIndex} className="group/action relative inline-flex">
        {href ? (
          <Button asChild variant={variant} size="sm" className={buttonClass}>
            <Link
              href={href}
              aria-label={iconOnly ? label : undefined}
              onClick={(event) => event.stopPropagation()}
            >
              {content}
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant={variant}
            size="sm"
            className={buttonClass}
            disabled={disabled}
            aria-label={iconOnly ? label : undefined}
            onClick={(event) => {
              event.stopPropagation();
              action.onClick?.(row, rowIndex);
            }}
          >
            {content}
          </Button>
        )}

        {iconOnly && (
          <span
            role="tooltip"
            className={cn(
              'pointer-events-none absolute bottom-full mb-1 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow-sm transition-opacity group-hover/action:opacity-100',
              TOOLTIP_ANCHOR,
              Z_ACTION_TOOLTIP
            )}
          >
            {label}
          </span>
        )}
      </span>
    );
  };

  const renderBody = (): React.ReactNode => {
    if (isLoading) {
      return Array.from({ length: skeletonRows }).map((_, rowIndex) => (
        <TableRow
          key={`skeleton-${rowIndex}`}
          className={cn(
            'border-0 hover:bg-transparent',
            rowBackgroundClass(rowIndex)
          )}
        >
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className={bodyCellClass}>
              <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (!data.length) {
      return (
        <TableRow className="border-0 hover:bg-transparent">
          <TableCell
            colSpan={columnCount}
            className="px-4 py-10 text-center text-sm text-muted-foreground"
          >
            {emptyMessage}
          </TableCell>
        </TableRow>
      );
    }

    return data.map((row, rowIndex) => (
      <TableRow
        key={resolveRowKey(row, rowIndex)}
        onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
        className={cn(
          'border-0 transition-colors hover:bg-gray-200',
          rowBackgroundClass(rowIndex),
          onRowClick && 'cursor-pointer',
          rowClassName?.(row, rowIndex)
        )}
      >
        {visibleColumns.map((column) => (
          <TableCell
            key={column.key}
            className={cn(
              bodyCellClass,
              ALIGN_CELL[column.align ?? 'left'],
              column.sticky && stickyColumnClass,
              column.className,
              column.cellClassName?.(row, rowIndex)
            )}
          >
            {renderCell(column, row, rowIndex)}
          </TableCell>
        ))}

        {hasActions && (
          <TableCell className={cn(bodyCellClass, ALIGN_CELL[actionsAlign])}>
            <div
              className={cn(
                'flex items-center gap-1',
                ALIGN_FLEX[actionsAlign]
              )}
            >
              {actions?.map((action, actionIndex) =>
                action.hidden?.(row, rowIndex)
                  ? null
                  : renderAction(action, row, rowIndex, actionIndex)
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
    ));
  };

  return (
    <div className={cn('w-full', className)}>
      {(title || toolbar) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          ) : (
            <span />
          )}
          {toolbar ? (
            <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div
          className={cn(
            'w-full overflow-x-auto',
            scrollMaxHeight && 'overflow-y-auto',
            SCROLLBAR_CLASS
          )}
          style={scrollMaxHeight ? { maxHeight: scrollMaxHeight } : undefined}
        >
          <table
            className={cn(
              'w-full caption-bottom border-separate border-spacing-0 text-sm',
              tableClassName
            )}
          >
            {caption && (
              <caption className="px-4 py-3 text-left text-sm text-muted-foreground">
                {caption}
              </caption>
            )}

            <TableHeader className="[&_tr]:border-0">
              <TableRow className="border-0 hover:bg-transparent">
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      headCellClass,
                      ALIGN_CELL[column.align ?? 'left'],
                      column.sticky && cn('sticky left-0', Z_STICKY_CORNER),
                      column.headerClassName
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}

                {hasActions && (
                  <TableHead
                    scope="col"
                    className={cn(headCellClass, ALIGN_CELL[actionsAlign])}
                  >
                    {actionsHeader}
                  </TableHead>
                )}
              </TableRow>

              {hasSummaryRow && (
                <TableRow className="border-0 hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableHead
                      key={`summary-${column.key}`}
                      scope="col"
                      className={cn(
                        summaryCellClass,
                        ALIGN_CELL[column.align ?? 'left'],
                        column.sticky && cn('sticky left-0', Z_STICKY_CORNER)
                      )}
                    >
                      {column.summary}
                    </TableHead>
                  ))}

                  {hasActions && (
                    <TableHead scope="col" className={summaryCellClass} />
                  )}
                </TableRow>
              )}
            </TableHeader>

            <TableBody className="[&_tr:last-child>td]:border-0">
              {renderBody()}
            </TableBody>

            {hasFooterRow && (
              <TableFooter className="border-0 bg-transparent">
                <TableRow className="border-0 hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={`footer-${column.key}`}
                      className={cn(
                        footerCellClass,
                        ALIGN_CELL[column.align ?? 'left'],
                        column.sticky && cn('sticky left-0', Z_STICKY_COLUMN)
                      )}
                    >
                      {column.footer}
                    </TableCell>
                  ))}

                  {hasActions && <TableCell className={footerCellClass} />}
                </TableRow>
              </TableFooter>
            )}
          </table>
        </div>
      </div>

      {pagination && (rangeLabel || pagination.onPageSizeChange) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{rangeLabel}</span>

          {pagination.onPageSizeChange && (
            <label className="flex items-center gap-2">
              Registros por página:
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) =>
                  pagination.onPageSizeChange?.(Number(value))
                }
              >
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZES).map(
                    (option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </label>
          )}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <PaginationComponent
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
