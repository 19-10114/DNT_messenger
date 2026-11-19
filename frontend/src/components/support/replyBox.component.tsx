'use client';

import React from 'react';
import { Loader2, Lock, Send } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import { Textarea } from '@/components/ui/textarea.component';
import {
  AttachmentDropzone,
  AttachmentDropzoneHandle,
  getClipboardFiles,
} from '@/components/ui/attachmentDropzone.component';
import { useToast } from '@/components/ui/use-toast';
import { useAddSupportComment } from '@/hooks/support';
import {
  ACCEPTED_TYPES,
  MAX_FILES,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  getSupportErrorMessage,
} from './support.utils';

interface ReplyBoxProps {
  ticketId: number;
  /** `agent`: información pública o nota interna. `reporter`: mensaje al equipo. */
  mode: 'agent' | 'reporter';
  /** Quien reporta escribe sobre un ticket resuelto: enviarlo lo reabre */
  reopens?: boolean;
}

/**
 * Caja para escribir en el ticket con adjuntos (clic, arrastrar o pegar).
 * El equipo publica "Información del ticket" (la lee y responde quien reportó)
 * o una nota interna (solo el equipo). Quien reportó escribe al equipo; si el
 * ticket estaba resuelto, su mensaje lo reabre. Ctrl+Enter envía.
 */
export function ReplyBox({ ticketId, mode, reopens = false }: ReplyBoxProps) {
  const isReporter = mode === 'reporter';
  const { toast } = useToast();
  const { addSupportComment, isAddingComment } = useAddSupportComment(ticketId);
  const dropzoneRef = React.useRef<AttachmentDropzoneHandle>(null);
  const [body, setBody] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [internal, setInternal] = React.useState(false);

  const canSend =
    (body.trim().length > 0 || files.length > 0) && !isAddingComment;

  const send = async () => {
    if (!canSend) return;
    try {
      await addSupportComment({
        body: body.trim(),
        files,
        internal: !isReporter && internal,
      });
      toast({
        title: isReporter
          ? reopens
            ? 'Mensaje enviado. El reporte se reabrió.'
            : 'Mensaje enviado'
          : internal
            ? 'Nota interna guardada'
            : 'Información publicada',
      });
      setBody('');
      setFiles([]);
    } catch (error) {
      toast({
        title: 'No se pudo enviar',
        description: getSupportErrorMessage(
          error,
          'Intenta de nuevo en un momento.'
        ),
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 transition-colors',
        !isReporter && internal
          ? 'border-amber-300 bg-amber-50/50'
          : 'border-gray-200'
      )}
      onPaste={(event) => {
        const pasted = getClipboardFiles(event);
        if (pasted.length === 0) return;
        event.preventDefault();
        dropzoneRef.current?.addFiles(pasted);
      }}
    >
      {isReporter ? (
        <p
          className={cn(
            'text-xs',
            reopens ? 'font-medium text-amber-700' : 'text-gray-400'
          )}
        >
          {reopens
            ? 'Si escribes aquí, el reporte se reabre.'
            : 'El equipo de soporte lo leerá.'}
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" className="flex gap-1 text-xs">
            <button
              type="button"
              role="tab"
              aria-selected={!internal}
              onClick={() => setInternal(false)}
              className={cn(
                'rounded-md px-2 py-1 font-medium',
                !internal
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              Información del ticket
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={internal}
              onClick={() => setInternal(true)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium',
                internal
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Lock className="h-3 w-3" aria-hidden />
              Nota interna
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {internal
              ? 'Solo la ve el equipo'
              : 'Quien reportó la puede leer y responder'}
          </span>
        </div>
      )}
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void send();
          }
        }}
        rows={3}
        placeholder={
          isReporter
            ? reopens
              ? '¿Qué sigue pasando?'
              : 'Escribe al equipo de soporte…'
            : internal
              ? 'Solo lo ve el equipo de soporte…'
              : 'Ej.: Ya lo estamos revisando; mientras tanto, usa la sucursal Cabudare.'
        }
        className="resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={isAddingComment}
      />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <AttachmentDropzone
          ref={dropzoneRef}
          variant="compact"
          files={files}
          onFilesChange={setFiles}
          accept={ACCEPTED_TYPES}
          maxFiles={MAX_FILES}
          maxFileSize={MAX_FILE_SIZE}
          maxTotalSize={MAX_TOTAL_SIZE}
          disabled={isAddingComment}
          hint="o pega una captura"
        />
        <Button type="button" size="sm" onClick={send} disabled={!canSend}>
          {isAddingComment ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="mr-2 h-4 w-4" aria-hidden />
          )}
          {isReporter ? 'Enviar' : internal ? 'Guardar nota' : 'Publicar'}
        </Button>
      </div>
    </div>
  );
}
