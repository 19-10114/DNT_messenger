'use client';

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Send,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button.component';
import { Textarea } from '@/components/ui/textarea.component';

const messageSchema = z.object({
  content: z
    .string()
    .max(4000, 'El mensaje supera los 4000 caracteres.'),
});

interface MessageFormValues {
  content: string;
}

interface MessageInputBarProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInputBar({
  onSend,
  disabled = false,
}: MessageInputBarProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const sendingRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
    },
  });

  const contentField = register('content');
  const content = watch('content');
  const isTooLong = (content?.length ?? 0) > 4000;
  const isBusy = disabled || isSubmitting;

  useEffect(() => {
    if (!isSubmitting && !disabled && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      inputRef.current?.focus();
    }
  }, [isSubmitting, disabled]);

  async function sendMessage(values: MessageFormValues) {
    const texto = values.content.trim();
    if (!texto || disabled || sendingRef.current) return;

    sendingRef.current = true;
    restoreFocusRef.current = true;
    setSendError(null);

    try {
      await onSend(texto);
      reset({ content: '' });
    } catch {
      setSendError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      sendingRef.current = false;
    }
  }

  const submitMessage = handleSubmit(sendMessage);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content?.trim() || isBusy || isTooLong) return;
    void submitMessage(e);
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      aria-label="Enviar un mensaje"
      className="shrink-0 border-t border-neutral-200 bg-white p-3 sm:p-4"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <details className="group relative shrink-0">
          <summary
            aria-label="Opciones de adjuntos"
            title="Adjuntar"
            className="flex h-10 w-10 shrink-0 cursor-pointer list-none items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 [&::-webkit-details-marker]:hidden"
          >
            <Paperclip aria-hidden="true" className="h-5 w-5" />
          </summary>

          <div className="absolute bottom-full left-0 z-20 mb-2 w-60 rounded-md border border-neutral-200 bg-white p-1 shadow-lg">
            <p className="px-3 py-2 text-xs text-neutral-400">
              Adjuntos · Próximamente
            </p>

            <Button
              type="button"
              variant="ghost"
              disabled
              title="Próximamente"
              className="w-full justify-start gap-2 text-neutral-600"
            >
              <ImageIcon aria-hidden="true" className="h-4 w-4" />
              Galería (fotos y videos)
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled
              title="Próximamente"
              className="w-full justify-start gap-2 text-neutral-600"
            >
              <FileText aria-hidden="true" className="h-4 w-4" />
              Documentos
            </Button>
          </div>
        </details>

        <Textarea
          {...contentField}
          ref={(element) => {
            contentField.ref(element);
            inputRef.current = element;
          }}
          aria-label="Mensaje"
          aria-invalid={isTooLong || Boolean(errors.content)}
          placeholder="Escribe un mensaje..."
          rows={1}
          disabled={disabled}
          readOnly={isSubmitting}
          className="min-h-[42px] max-h-[140px] flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50/70 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (!isBusy && !isTooLong && content.trim()) {
                void submitMessage();
              }
            }
          }}
        />

        <Button
          type="submit"
          size="icon"
          disabled={isBusy || isTooLong || !content.trim()}
          aria-label={isSubmitting ? 'Enviando mensaje' : 'Enviar mensaje'}
          className="h-10 w-10 shrink-0 rounded-full bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-40"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="h-4 w-4 translate-x-px" />
          )}
        </Button>
      </div>

      {isTooLong && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          El mensaje excede el límite permitido ({content.length}/4000)
        </p>
      )}

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Enter para enviar · Shift+Enter para un salto de línea</span>
      </div>

      {sendError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {sendError}
        </p>
      )}
    </form>
  );
}
