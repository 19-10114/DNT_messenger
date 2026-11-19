'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.component';
import { Input } from '@/components/ui/input.component';
import { Textarea } from '@/components/ui/textarea.component';
import {
  AttachmentDropzone,
  AttachmentDropzoneHandle,
  getClipboardFiles,
} from '@/components/ui/attachmentDropzone.component';
import { SUPPORT_TICKET } from '@/constants/routes';
import { captureViewport } from '@/lib/screenshot';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCreateSupportTicket, useSupportContext } from '@/hooks/support';
import {
  SupportTicketFormValues,
  supportTicketSchema,
} from '@/schemas/supportTicket.schema';
import {
  SupportContext,
  SupportTicketImpact,
  SupportTicketKind,
} from '@/services/support/types';
import { ContextChips } from './contextChips.component';
import {
  ACCEPTED_TYPES,
  IMPACT_LABELS,
  KIND_CONFIG,
  KIND_ORDER,
  MAX_FILES,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  formatTicketNumber,
  getSupportErrorMessage,
} from './support.utils';

const DRAFT_KEY = 'support-ticket-draft';

const DEFAULT_VALUES: SupportTicketFormValues = {
  kind: 'bug',
  title: '',
  description: '',
  impact: 'can_work',
};

const IMPACT_ORDER: SupportTicketImpact[] = [
  'can_work',
  'workaround',
  'blocked',
];

function readDraft(): SupportTicketFormValues | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = supportTicketSchema.partial().safeParse(JSON.parse(raw));
    return parsed.success ? { ...DEFAULT_VALUES, ...parsed.data } : null;
  } catch {
    return null;
  }
}

function writeDraft(values: SupportTicketFormValues) {
  try {
    if (!values.title && !values.description) {
      localStorage.removeItem(DRAFT_KEY);
    } else {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    }
  } catch {
    // Sin almacenamiento (modo privado): el borrador simplemente no se guarda
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ídem
  }
}

/** Botones tipo "segmented control" con semántica de radio */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: {
    value: T;
    label: string;
    icon?: React.ReactNode;
    activeClass?: string;
  }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? (option.activeClass ??
                    'border-primary bg-primary/10 text-primary font-medium')
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface ReportTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Reportar a soporte": se abre sobre la pantalla actual, sin navegar, y pide
 * solo tipo, título y descripción. Capturas pegadas con Ctrl+V, contexto
 * técnico automático y borrador que sobrevive a un cierre accidental.
 */
export function ReportTicketDialog({
  open,
  onOpenChange,
}: ReportTicketDialogProps) {
  const isMobile = useIsMobile();
  const buildContext = useSupportContext();
  const { createSupportTicket, isCreatingTicket } = useCreateSupportTicket();
  const dropzoneRef = React.useRef<AttachmentDropzoneHandle>(null);

  const [files, setFiles] = React.useState<File[]>([]);
  const [context, setContext] = React.useState<SupportContext>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [createdId, setCreatedId] = React.useState<number | null>(null);

  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const kind = form.watch('kind');

  // Captura automática de lo que el usuario veía al pedir ayuda. No se le
  // muestra: viaja aparte y el backend solo la devuelve al equipo. Se guarda
  // la promesa porque puede no haber terminado cuando se envía (tarda 1-2 s).
  // Si falla queda en null y el reporte sale sin ella.
  const screenshotRef = React.useRef<Promise<File | null> | null>(null);
  const captureScreen = React.useCallback(() => {
    // El modal ya está en el DOM cuando corre el efecto, pero
    // `captureViewport` lo excluye
    screenshotRef.current = captureViewport();
  }, []);

  // Al abrir: foto del contexto (la página de *ahora*), captura de pantalla y
  // borrador si lo hay
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (open && !wasOpen.current) {
      setContext(buildContext());
      setSubmitError(null);
      captureScreen();
      const draft = readDraft();
      if (draft && !form.formState.isDirty) form.reset(draft);
    }
    wasOpen.current = open;
  }, [open, buildContext, captureScreen, form]);

  // Guardar el borrador mientras se escribe
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (createdId === null) writeDraft({ ...DEFAULT_VALUES, ...values });
    });
    return () => subscription.unsubscribe();
  }, [form, createdId]);

  const resetAll = () => {
    form.reset(DEFAULT_VALUES);
    setFiles([]);
    screenshotRef.current = null;
    setCreatedId(null);
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && createdId !== null) resetAll();
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      // Como mucho 3 s de espera: la captura no puede demorar el envío
      const screenshot = screenshotRef.current
        ? await Promise.race([
            screenshotRef.current,
            new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), 3000)
            ),
          ])
        : null;
      const ticket = await createSupportTicket({
        ...values,
        branchId: context.branchId,
        context,
        files,
        screenshot: screenshot ?? undefined,
      });
      clearDraft();
      setCreatedId(ticket.id);
    } catch (error) {
      setSubmitError(
        getSupportErrorMessage(
          error,
          'No se pudo enviar el reporte. Intenta de nuevo.'
        )
      );
    }
  });

  const onPaste = (event: React.ClipboardEvent) => {
    const pasted = getClipboardFiles(event);
    if (pasted.length === 0) return; // texto: se pega normal
    event.preventDefault();
    dropzoneRef.current?.addFiles(pasted);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void onSubmit();
    }
  };

  const kindConfig = KIND_CONFIG[kind];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        width={isMobile ? '100%' : '640px'}
        maxHeight={isMobile ? '100dvh' : '90vh'}
        className={cn(
          'grid-cols-[minmax(0,1fr)]',
          isMobile && 'h-[100dvh] rounded-none border-0 p-4'
        )}
      >
        {createdId !== null ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden />
            <DialogTitle className="text-xl">
              Reporte {formatTicketNumber(createdId)} enviado
            </DialogTitle>
            <DialogDescription className="max-w-sm">
              El equipo de soporte ya lo tiene. Te avisaremos en el botón de
              soporte cuando haya novedades.
            </DialogDescription>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cerrar
              </Button>
              <Button asChild onClick={() => handleOpenChange(false)}>
                <Link href={SUPPORT_TICKET(createdId)}>Ver reporte</Link>
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={onSubmit}
              onPaste={onPaste}
              onKeyDown={onKeyDown}
              className="flex min-w-0 flex-col gap-4"
              noValidate
            >
              <DialogHeader>
                <DialogTitle>Reportar a soporte</DialogTitle>
                <DialogDescription>
                  Cuéntanos qué pasó. El equipo de desarrollo lo revisa y te
                  responde por aquí.
                </DialogDescription>
              </DialogHeader>

              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Qué quieres reportar?</FormLabel>
                    <Segmented<SupportTicketKind>
                      label="Tipo de reporte"
                      value={field.value}
                      onChange={field.onChange}
                      options={KIND_ORDER.map((value) => {
                        const { label, icon: Icon } = KIND_CONFIG[value];
                        return {
                          value,
                          label,
                          icon: <Icon className="h-4 w-4" aria-hidden />,
                        };
                      })}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoFocus={!isMobile}
                        maxLength={120}
                        placeholder={kindConfig.titlePlaceholder}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={5}
                        placeholder={kindConfig.placeholder}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  Capturas o video{' '}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </span>
                <AttachmentDropzone
                  ref={dropzoneRef}
                  files={files}
                  onFilesChange={setFiles}
                  accept={ACCEPTED_TYPES}
                  maxFiles={MAX_FILES}
                  maxFileSize={MAX_FILE_SIZE}
                  maxTotalSize={MAX_TOTAL_SIZE}
                  disabled={isCreatingTicket}
                  hint={`Imágenes o video · hasta ${MAX_FILES} archivos de 10 MB`}
                />
              </div>

              {kind === 'bug' && (
                <FormField
                  control={form.control}
                  name="impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Puedes seguir trabajando?</FormLabel>
                      <Segmented<SupportTicketImpact>
                        label="Impacto"
                        value={field.value}
                        onChange={field.onChange}
                        options={IMPACT_ORDER.map((value) => ({
                          value,
                          label: IMPACT_LABELS[value],
                          activeClass:
                            value === 'blocked'
                              ? 'border-red-300 bg-red-50 text-red-700 font-medium'
                              : value === 'workaround'
                                ? 'border-amber-300 bg-amber-50 text-amber-800 font-medium'
                                : undefined,
                        }))}
                      />
                    </FormItem>
                  )}
                />
              )}

              <ContextChips
                context={context}
                onRemoveApiError={() =>
                  setContext(({ recentApiErrors: _removed, ...rest }) => rest)
                }
              />

              {submitError && (
                <p
                  className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {submitError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-400">
                  El texto se guarda como borrador; los adjuntos no.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 sm:flex-none"
                    disabled={isCreatingTicket}
                  >
                    {isCreatingTicket && (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden
                      />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
