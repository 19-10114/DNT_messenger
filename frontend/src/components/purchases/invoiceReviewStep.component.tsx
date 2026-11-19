'use client';

import { AlertTriangle, ArrowRight, FileWarning } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox.component';
import { Input } from '@/components/ui/input.component';
import { cn } from '@/lib/utils';
import {
  InvoicePageIssue,
  InvoiceReview,
  InvoiceReviewDecision,
  InvoiceReviewItem,
} from '@/utils/invoiceCart.utils';

interface InvoiceReviewStepProps {
  review: InvoiceReview;
  decisions: Record<string, InvoiceReviewDecision>;
  onChange: (key: string, decision: InvoiceReviewDecision) => void;
  /** page → vista previa, para abrir la imagen de una línea dudosa */
  previews: Record<number, string | null>;
}

export function PagePreview({
  url,
  page,
  className,
}: {
  url: string | null;
  page: number;
  className?: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={`Abrir página ${page} en grande`}
      className={cn(
        'block shrink-0 overflow-hidden rounded border bg-white hover:ring-2 hover:ring-primary',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- blob: local, next/image no lo optimiza */}
      <img
        src={url}
        alt={`Página ${page}`}
        className="h-full w-full object-cover object-top"
      />
    </a>
  );
}

export function PageIssueCard({ issue }: { issue: InvoicePageIssue }) {
  return (
    <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-2 dark:border-amber-900 dark:bg-amber-950/20">
      <PagePreview
        url={issue.previewUrl}
        page={issue.page}
        className="h-24 w-[68px]"
      />
      <div className="min-w-0 text-sm">
        <p className="font-medium">
          Página {issue.page}
          {issue.invoiceNumber && (
            <span className="font-normal text-muted-foreground">
              {' '}
              · Factura {issue.invoiceNumber}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{issue.message}</p>
        {issue.kind !== 'review' && (
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
            Esta página no aporta líneas. Si es una factura, cargá sus repuestos
            a mano.
          </p>
        )}
      </div>
    </div>
  );
}

const KIND_LABELS: Record<InvoiceReviewItem['kind'], string> = {
  suggested: 'SKU corregido',
  mismatch: 'Nombre distinto en el catálogo',
  line_check: 'Cantidad sin confirmar',
};

function ReviewItemRow({
  item,
  decision,
  onChange,
  previewUrl,
}: {
  item: InvoiceReviewItem;
  decision: InvoiceReviewDecision;
  onChange: (decision: InvoiceReviewDecision) => void;
  previewUrl: string | null;
}) {
  const { line, product } = item;
  const id = `invoice-review-${item.key}`;
  return (
    <div
      className={cn(
        'flex gap-3 rounded-md border p-3 text-sm',
        decision.include ? 'bg-background' : 'bg-muted/40 opacity-70'
      )}
    >
      <Checkbox
        id={id}
        checked={decision.include}
        onCheckedChange={(checked) =>
          onChange({ ...decision, include: checked === true })
        }
        className="mt-0.5"
        aria-label="Incluir en el carrito"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <label
          htmlFor={id}
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[11px] font-medium',
              'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            )}
          >
            {KIND_LABELS[item.kind]}
          </span>
          <span className="text-xs text-muted-foreground">
            Pág. {item.page}
            {item.invoiceNumber && ` · Fact. ${item.invoiceNumber}`} · fila{' '}
            {line.row}
          </span>
        </label>

        <p className="text-xs text-muted-foreground">
          Factura: <span className="font-mono text-foreground">{line.sku}</span>{' '}
          {line.description} {line.model && `· ${line.model}`}
        </p>
        {item.kind === 'suggested' ? (
          <p className="flex flex-wrap items-center gap-1 text-xs">
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono font-medium">{product.sku}</span>
            <span>
              {product.name} · {product.model}
            </span>
          </p>
        ) : (
          <p className="text-xs">
            Catálogo:{' '}
            <span className="font-medium">
              {product.name} · {product.model}
            </span>
          </p>
        )}
        {item.kind === 'line_check' && (
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Leído: {line.quantity ?? '—'} × {line.unitPriceBs ?? '—'} Bs ={' '}
            {line.totalBs ?? '—'} Bs. Revisá la cantidad en la imagen.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Cant.</span>
          <Input
            type="number"
            min={1}
            step={1}
            value={decision.quantity}
            disabled={!decision.include}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              onChange({ ...decision, quantity: Number(e.target.value) })
            }
            className="h-8 w-16 text-right"
          />
        </div>
        <PagePreview
          url={previewUrl}
          page={item.page}
          className="h-12 w-[34px]"
        />
      </div>
    </div>
  );
}

/**
 * Revisión de "Subir Factura": solo lo que el lector no pudo dar por bueno.
 * Las líneas que cuadraron y tienen el sku exacto ya entran solas y no se
 * muestran acá.
 */
export function InvoiceReviewStep({
  review,
  decisions,
  onChange,
  previews,
}: InvoiceReviewStepProps) {
  return (
    <div className="space-y-4">
      {review.pageIssues.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <FileWarning className="h-4 w-4 text-amber-600" />
            Páginas para revisar ({review.pageIssues.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Sus líneas leídas sí entran. Tocá la imagen para verla en grande y
            compará: si falta un repuesto, agregalo después desde el buscador.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {review.pageIssues.map((issue) => (
              <PageIssueCard key={issue.page} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {review.items.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Líneas para confirmar ({review.items.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Las marcadas entran al carrito; las desmarcadas quedan en la lista
            de las que no entraron.
          </p>
          <div className="space-y-2">
            {review.items.map((item) => (
              <ReviewItemRow
                key={item.key}
                item={item}
                decision={decisions[item.key]}
                onChange={(decision) => onChange(item.key, decision)}
                previewUrl={previews[item.page] ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
