'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Info,
  RefreshCw,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import { Input } from '@/components/ui/input.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { normalizeApprovalNumber } from '@/components/approvals/approvals.utils';
import { BIKES_COLORS } from '@/constants/products';
import { APPROVALS_NEW } from '@/constants/routes';
import { cn } from '@/lib/utils';
import {
  ApprovalLookupState,
  BIKE_ISSUE_LABELS,
  BikeInvoiceReview,
  BikeReviewPage,
  BikeReviewItem,
  BikeUnitDraft,
  plateLooksRight,
  vinIsValid,
  vinYear,
} from '@/utils/invoiceBikeCart.utils';
import { PageIssueCard, PagePreview } from './invoiceReviewStep.component';

interface BikeInvoiceReviewStepProps {
  review: BikeInvoiceReview;
  drafts: Record<string, BikeUnitDraft>;
  onChange: (key: string, draft: BikeUnitDraft) => void;
  /** Motos incluidas cuya placa se repite (entre sí o con el carrito) */
  duplicated: Set<string>;
  /** Por moto, lo que falta para poder agregarla */
  problems: Record<string, string | null>;
  previews: Record<number, string | null>;
  /** Número de aprobación por página: el leído, corregible */
  pageApprovals: Record<number, string>;
  onChangeApproval: (page: number, value: string) => void;
  /** Por número normalizado, qué se sabe de la aprobación */
  lookups: Record<string, ApprovalLookupState | undefined>;
  /** Por moto, por qué no cuenta para su aprobación (null si cuenta) */
  approvalIssues: Record<string, string | null>;
  targetBranchId?: number;
  targetBranchName: string;
  onRefetchApprovals: () => void;
  isRefetchingApprovals: boolean;
}

/** Cómo queda la aprobación de una página: estado y cupo de sus modelos. */
function PageApprovalCard({
  page,
  value,
  onChange,
  state,
  units,
  targetBranchId,
  targetBranchName,
  onRefetch,
  isRefetching,
}: {
  page: BikeReviewPage;
  value: string;
  onChange: (value: string) => void;
  state: ApprovalLookupState | undefined;
  units: BikeReviewItem[];
  targetBranchId?: number;
  targetBranchName: string;
  onRefetch: () => void;
  isRefetching: boolean;
}) {
  const number = normalizeApprovalNumber(value);
  const branch = targetBranchName || 'esta sucursal';
  const models = Array.from(
    new Map(units.map((unit) => [unit.product.id, unit.product])).values()
  );
  const retry = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      onClick={onRefetch}
      disabled={isRefetching}
    >
      <RefreshCw
        className={cn('mr-1 h-3 w-3', isRefetching && 'animate-spin')}
      />
      Volver a consultar
    </Button>
  );

  let body: React.ReactNode;
  if (!number) {
    body = (
      <p className="text-xs text-red-700 dark:text-red-400">
        No se leyó el número de aprobación en esta página. Escribilo como
        aparece en la factura (&quot;Nro Aprobación&quot;).
      </p>
    );
  } else if (!state || state.status === 'loading') {
    body = <p className="text-xs text-muted-foreground">Consultando...</p>;
  } else if (state.status === 'not_found') {
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-red-700 dark:text-red-400">
          La aprobación {number} no existe en el sistema.{' '}
          <Link
            href={APPROVALS_NEW}
            target="_blank"
            className="font-medium underline"
          >
            Registrarla
          </Link>{' '}
          y después:
        </p>
        {retry}
      </div>
    );
  } else if (state.status === 'error') {
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-red-700 dark:text-red-400">
          No se pudo consultar la aprobación.
        </p>
        {retry}
      </div>
    );
  } else {
    const { lookup } = state;
    body = (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Pedida por {lookup.branch.name}
          {!lookup.acceptsBikes && (
            <span className="ml-1 text-red-700 dark:text-red-400">
              · ya no acepta motos (
              {lookup.status === 'closed' ? 'cerrada' : 'completa'})
            </span>
          )}
        </p>
        {lookup.acceptsBikes && (
          <div className="flex flex-wrap gap-1.5">
            {!targetBranchId && (
              <span className="text-xs text-red-700 dark:text-red-400">
                Elegí la sucursal que recibe para ver el cupo.
              </span>
            )}
            {targetBranchId &&
              models.map((product) => {
                const modelLines = lookup.lines.filter(
                  (line) => line.product.id === product.id
                );
                const line = modelLines.find(
                  (item) => item.branch.id === targetBranchId
                );
                const inPage = units.filter(
                  (unit) => unit.product.id === product.id
                ).length;
                const ok = !!line && line.availableQuantity >= inPage;
                const text = !modelLines.length
                  ? `${product.name}: no está en la aprobación`
                  : !line
                    ? `${product.name}: no va a ${branch} (va a ${modelLines
                        .map((item) => item.branch.name)
                        .join(', ')})`
                    : `${product.name}: ${inPage} en la factura, quedan ${line.availableQuantity} para ${branch}`;
                return (
                  <span
                    key={product.id}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs ring-1 ring-inset',
                      ok
                        ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                        : 'bg-red-50 text-red-800 ring-red-200'
                    )}
                  >
                    {text}
                  </span>
                );
              })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-md border p-2">
      <PagePreview
        url={page.previewUrl}
        page={page.page}
        className="h-24 w-[68px]"
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-medium">
            Página {page.page}
            {page.invoiceNumber && (
              <span className="font-normal text-muted-foreground">
                {' '}
                · Factura {page.invoiceNumber}
              </span>
            )}
            <span className="font-normal text-muted-foreground">
              {' '}
              · {page.unitCount} moto{page.unitCount === 1 ? '' : 's'}
            </span>
          </p>
          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Aprobación</span>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              className={cn(
                'h-7 w-[170px] font-mono text-xs',
                !number && 'border-red-400'
              )}
              aria-label={`Número de aprobación de la página ${page.page}`}
            />
            {state?.status === 'ok' && state.lookup.acceptsBikes && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            )}
          </label>
        </div>
        {body}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  invalid,
}: {
  label: string;
  children: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <label className="space-y-0.5">
      <span
        className={cn(
          'block text-[11px] font-medium',
          invalid ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function BikeUnitRow({
  item,
  draft,
  onChange,
  duplicated,
  problem,
  approvalIssue,
  previewUrl,
}: {
  item: BikeReviewItem;
  draft: BikeUnitDraft;
  onChange: (draft: BikeUnitDraft) => void;
  duplicated: boolean;
  problem: string | null;
  /** Por qué no cuenta para la aprobación de su página; no entra mientras siga */
  approvalIssue: string | null;
  previewUrl: string | null;
}) {
  const { line, product } = item;
  const chassisOk = vinIsValid(draft.chassis);
  const set = (patch: Partial<BikeUnitDraft>) =>
    onChange({ ...draft, ...patch });
  // Al corregir el chasis, el año sale de nuevo del VIN si quedó vacío o era
  // el que daba el VIN anterior.
  const setChassis = (value: string) => {
    const chassis = value.toUpperCase();
    const previousYear = vinIsValid(draft.chassis)
      ? vinYear(draft.chassis)
      : '';
    const year =
      vinIsValid(chassis) && (!draft.year || draft.year === previousYear)
        ? vinYear(chassis)
        : draft.year;
    set({ chassis, year });
  };
  const issues = item.issues.filter(
    (issue) => issue !== 'duplicate_plate' || duplicated
  );
  if (duplicated && !issues.includes('duplicate_plate'))
    issues.push('duplicate_plate');

  return (
    <div
      className={cn(
        'flex gap-3 rounded-md border p-3 text-sm',
        draft.include ? 'bg-background' : 'bg-muted/40 opacity-70',
        draft.include && problem && 'border-red-300 dark:border-red-900'
      )}
    >
      <Checkbox
        checked={draft.include}
        onCheckedChange={(checked) => set({ include: checked === true })}
        className="mt-0.5"
        aria-label="Incluir en el carrito"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {issues.map((issue) => (
            <span
              key={issue}
              className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              {issue === 'chassis' && chassisOk
                ? 'Chasis corregido'
                : BIKE_ISSUE_LABELS[issue]}
            </span>
          ))}
          <span className="text-xs text-muted-foreground">
            Pág. {item.page}
            {item.invoiceNumber && ` · Fact. ${item.invoiceNumber}`} · fila{' '}
            {line.row}
          </span>
        </div>
        <p className="text-xs">
          <span className="text-muted-foreground">Factura: </span>
          {line.description}
          <span className="text-muted-foreground"> → </span>
          <span className="font-medium">{product.name}</span>
          {line.resolution === 'suggested' && (
            <span className="text-amber-800 dark:text-amber-300">
              {' '}
              (¿es este modelo?)
            </span>
          )}
        </p>
        {line.alreadyRegistered && (
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Esta placa o este chasis ya están en el sistema: la aprobación la
            rechazaría. Queda desmarcada.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Field label="Chasis (VIN)" invalid={!chassisOk}>
            <Input
              value={draft.chassis}
              onChange={(e) => setChassis(e.target.value)}
              disabled={!draft.include}
              className={cn(
                'h-8 font-mono text-xs',
                !chassisOk && 'border-red-400'
              )}
            />
          </Field>
          <Field label="Motor" invalid={!draft.motor.trim()}>
            <Input
              value={draft.motor}
              onChange={(e) => set({ motor: e.target.value.toUpperCase() })}
              disabled={!draft.include}
              className={cn(
                'h-8 font-mono text-xs',
                !draft.motor.trim() && 'border-red-400'
              )}
            />
          </Field>
          <Field
            label="Placa"
            invalid={duplicated || !plateLooksRight(draft.plate)}
          >
            <Input
              value={draft.plate}
              onChange={(e) => set({ plate: e.target.value.toUpperCase() })}
              disabled={!draft.include}
              className={cn(
                'h-8 font-mono text-xs',
                (duplicated || !plateLooksRight(draft.plate)) &&
                  'border-red-400'
              )}
            />
          </Field>
          <Field label="Color" invalid={!draft.color}>
            <Select
              value={draft.color || undefined}
              onValueChange={(color) => set({ color })}
              disabled={!draft.include}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Elegir" />
              </SelectTrigger>
              <SelectContent>
                {BIKES_COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Año (del VIN)" invalid={!/^\d{4}$/.test(draft.year)}>
            <Input
              value={draft.year}
              onChange={(e) =>
                set({ year: e.target.value.replace(/\D/g, '').slice(0, 4) })
              }
              disabled={!draft.include}
              inputMode="numeric"
              className="h-8 text-xs"
            />
          </Field>
        </div>

        {line.chassisSuggestion &&
          draft.chassis === line.chassisSuggestion &&
          line.chassisSuggestion !== line.chassis && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wand2 className="h-3 w-3" />
              Se leyó <span className="font-mono">{line.chassis}</span>; se
              corrigió un carácter para que el VIN sea válido. Confirmalo en la
              imagen.
            </p>
          )}
        {draft.include && problem && (
          <p className="text-xs font-medium text-red-700 dark:text-red-400">
            {problem}
          </p>
        )}
        {draft.include && !problem && approvalIssue && (
          <p className="flex items-start gap-1 text-xs font-medium text-amber-800 dark:text-amber-300">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            No entra: {approvalIssue}
          </p>
        )}
      </div>
      <PagePreview
        url={previewUrl}
        page={item.page}
        className="h-16 w-[45px] self-start"
      />
    </div>
  );
}

/**
 * Revisión de "Subir Factura" en el carrito de motos: solo las motos que el
 * lector no pudo dar por buenas, con todo editable. Las repetidas de placa se
 * muestran juntas (una debajo de la otra) para ver cuál está mal leída.
 */
export function BikeInvoiceReviewStep({
  review,
  drafts,
  onChange,
  duplicated,
  problems,
  previews,
  pageApprovals,
  onChangeApproval,
  lookups,
  approvalIssues,
  targetBranchId,
  targetBranchName,
  onRefetchApprovals,
  isRefetchingApprovals,
}: BikeInvoiceReviewStepProps) {
  // Lo dudoso, más cualquier moto que haya quedado con la placa repetida, con
  // un dato por completar al corregir otra o sin aprobación que la cubra
  // (aunque haya entrado sola): todo lo que no entra tiene que tener su fila.
  // Repetidas juntas, ordenadas por placa; el resto, en el orden de la factura.
  const flagged = new Set(review.items.map((item) => item.key));
  const items = review.units
    .filter(
      (unit) =>
        flagged.has(unit.key) ||
        duplicated.has(unit.key) ||
        !!problems[unit.key] ||
        !!approvalIssues[unit.key]
    )
    .sort((a, b) => {
      const aDup = duplicated.has(a.key);
      const bDup = duplicated.has(b.key);
      if (aDup && bDup)
        return drafts[a.key].plate.localeCompare(drafts[b.key].plate);
      if (aDup !== bDup) return aDup ? -1 : 1;
      return 0;
    });

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        El año sale del chasis (posición 10 del VIN), porque la factura no lo
        trae. Revisalo si registran otro año.
      </p>

      {review.pages.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Aprobaciones de Empire ({review.pages.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            El número sale de la factura (&quot;Nro Aprobación&quot;). Cada moto
            cuenta para la aprobación de su página; sin cupo, no entra.
          </p>
          <div className="space-y-2">
            {review.pages.map((page) => (
              <PageApprovalCard
                key={page.page}
                page={page}
                value={pageApprovals[page.page] ?? ''}
                onChange={(value) => onChangeApproval(page.page, value)}
                state={
                  lookups[normalizeApprovalNumber(pageApprovals[page.page])]
                }
                units={review.units.filter((unit) => unit.page === page.page)}
                targetBranchId={targetBranchId}
                targetBranchName={targetBranchName}
                onRefetch={onRefetchApprovals}
                isRefetching={isRefetchingApprovals}
              />
            ))}
          </div>
        </section>
      )}

      {review.pageIssues.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <FileWarning className="h-4 w-4 text-amber-600" />
            Páginas para revisar ({review.pageIssues.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {review.pageIssues.map((issue) => (
              <PageIssueCard key={issue.page} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && review.units.length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Las {review.units.length} motos se leyeron bien y entran con su
          aprobación.
        </p>
      )}

      {items.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Motos para confirmar ({items.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Las marcadas entran al carrito; las desmarcadas quedan en la lista
            de las que no entraron.
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <BikeUnitRow
                key={item.key}
                item={item}
                draft={drafts[item.key]}
                onChange={(draft) => onChange(item.key, draft)}
                duplicated={duplicated.has(item.key)}
                problem={problems[item.key] ?? null}
                approvalIssue={approvalIssues[item.key] ?? null}
                previewUrl={previews[item.page] ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
