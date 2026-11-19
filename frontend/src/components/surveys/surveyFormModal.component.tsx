'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Input } from '@/components/ui/input.component';
import { Textarea } from '@/components/ui/textarea.component';

export interface SurveyMeta {
  title: string;
  /** Vacío en creación: el backend lo deriva del título */
  slug: string;
  description: string;
  requiresAuthentication: boolean;
}

/** Deja el texto en una forma apta para una URL (`Evaluación 2` -> `evaluacion-2`) */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      // NFD separa la tilde de la letra y el filtro siguiente se la lleva
      .normalize('NFD')
      .replace(/[^a-z0-9-\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  );
}

interface SurveyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (meta: SurveyMeta) => void;
  /** `edit` reutiliza el mismo formulario para cambiar los datos generales */
  mode?: 'create' | 'edit';
  /** Valores con los que se abre el formulario en modo edición */
  initialMeta?: SurveyMeta;
}

const EMPTY_META: SurveyMeta = {
  title: '',
  slug: '',
  description: '',
  requiresAuthentication: true,
};

/**
 * Datos generales de una encuesta.
 *
 * En creación, al confirmar se abre el constructor y la encuesta recién se crea
 * en el backend al guardar el borrador. En edición, los cambios viajan junto al
 * diff de preguntas del PATCH.
 */
export function SurveyFormModal({
  open,
  onOpenChange,
  onSubmit,
  mode = 'create',
  initialMeta,
}: SurveyFormModalProps) {
  const [meta, setMeta] = useState<SurveyMeta>(initialMeta ?? EMPTY_META);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMeta(initialMeta ?? EMPTY_META);
      setError('');
    }
  }, [open, initialMeta]);

  const handleSubmit = () => {
    if (!meta.title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    onSubmit({ ...meta, title: meta.title.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nueva encuesta' : 'Datos generales'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Define los datos generales. En el siguiente paso armas las preguntas.'
              : 'Los cambios se guardan junto con el cuestionario.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Título</span>
            <Input
              value={meta.title}
              onChange={(event) =>
                setMeta({ ...meta, title: event.target.value })
              }
              placeholder="Ej: Satisfacción del cliente"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">
              Slug{' '}
              <span className="font-normal text-muted-foreground">
                (URL pública)
              </span>
            </span>
            <Input
              value={meta.slug}
              onChange={(event) =>
                setMeta({ ...meta, slug: slugify(event.target.value) })
              }
              placeholder={
                mode === 'create'
                  ? slugify(meta.title) || 'se genera del título'
                  : 'evaluacion-de-moto-usada'
              }
            />
            <span className="text-xs text-muted-foreground">
              {mode === 'create'
                ? 'Déjalo vacío y el backend lo deriva del título; si ya existe le agrega un sufijo.'
                : 'Cambiar el título no cambia el slug. Si lo editas aquí, los enlaces publicados con el slug anterior dejan de funcionar.'}
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Descripción</span>
            <Textarea
              value={meta.description}
              onChange={(event) =>
                setMeta({ ...meta, description: event.target.value })
              }
              placeholder="Contexto de la encuesta"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={meta.requiresAuthentication}
              onCheckedChange={(checked) =>
                setMeta({ ...meta, requiresAuthentication: checked === true })
              }
            />
            <span>Requiere que el respondiente esté autenticado</span>
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {mode === 'create' ? 'Continuar' : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
