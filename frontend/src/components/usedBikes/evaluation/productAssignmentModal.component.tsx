'use client';

import React, { useState } from 'react';
import { Check, Minus, Pencil, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Input } from '@/components/ui/input.component';
import { cn } from '@/lib/utils';
import {
  AssignedProduct,
  EvaluationIssue,
} from '@/stores/usedBikeEvaluation/usedBikeEvaluation.store';
import { optionStyle } from './evaluationOptions';
import { ProductAssignmentPanel } from './productAssignmentPanel.component';

interface ProductAssignmentModalProps {
  /** Hallazgo en edición; `undefined` mantiene el modal cerrado */
  issue?: EvaluationIssue;
  onOpenChange: (open: boolean) => void;
  onAssign: (product: AssignedProduct) => void;
  onRemove: (productId: string) => void;
  onUpdatePrice: (productId: string, price: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

interface AssignedRowProps {
  product: AssignedProduct;
  onRemove: () => void;
  onUpdatePrice: (price: number) => void;
  onUpdateQuantity: (quantity: number) => void;
}

/** Producto ya asignado: precio unitario, cantidad y opción de quitarlo */
function AssignedRow({
  product,
  onRemove,
  onUpdatePrice,
  onUpdateQuantity,
}: AssignedRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftPrice, setDraftPrice] = useState(String(product.price));

  const startEditing = () => {
    setDraftPrice(String(product.price));
    setIsEditing(true);
  };

  const confirmEditing = () => {
    const parsed = Number(draftPrice);
    if (!Number.isNaN(parsed) && parsed >= 0) onUpdatePrice(parsed);
    setIsEditing(false);
  };

  const isDiscounted = product.price !== product.listPrice;

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            {product.sku} ·{' '}
            {product.source === 'part' ? 'Repuesto' : 'Servicio'}
            {isDiscounted ? (
              <>
                {' · '}
                <span className="line-through">
                  ${product.listPrice.toFixed(2)}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <Input
                type="number"
                value={draftPrice}
                onChange={(event) => setDraftPrice(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') confirmEditing();
                  if (event.key === 'Escape') setIsEditing(false);
                }}
                className="h-8 w-24"
                step="0.01"
                min="0"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={confirmEditing}
                title="Guardar precio"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(false)}
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">
                ${product.price.toFixed(2)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={startEditing}
                title="Editar precio"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={onRemove}
                title="Quitar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* La cantidad viaja como `quantity`; el precio de arriba es unitario */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(product.quantity - 1)}
            disabled={product.quantity <= 1}
            title="Quitar una unidad"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={String(product.quantity)}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (!Number.isNaN(parsed)) onUpdateQuantity(parsed);
            }}
            className="h-8 w-16 text-center"
            min="1"
            step="1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(product.quantity + 1)}
            title="Agregar una unidad"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <span className="text-xs text-muted-foreground">
          Subtotal:{' '}
          <span className="font-medium text-foreground">
            ${(product.price * product.quantity).toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * Asignación de repuestos y servicios a un hallazgo: buscador a la izquierda,
 * lo ya seleccionado a la derecha.
 */
export function ProductAssignmentModal({
  issue,
  onOpenChange,
  onAssign,
  onRemove,
  onUpdatePrice,
  onUpdateQuantity,
}: ProductAssignmentModalProps) {
  const style = optionStyle(issue?.optionLabel ?? '');
  const total =
    issue?.products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    ) ?? 0;

  return (
    <Dialog open={!!issue} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={cn(
                'h-7 min-w-[1.75rem] rounded-md border px-2 flex items-center justify-center text-xs font-semibold',
                style.badge
              )}
            >
              {issue?.optionLabel}
            </span>
            {issue?.questionText}
          </DialogTitle>
          <DialogDescription>
            {issue?.section} · Selecciona los repuestos o servicios necesarios
          </DialogDescription>
        </DialogHeader>

        {issue ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* La evaluación no descuenta stock: se puede asignar sin existencias */}
            <ProductAssignmentPanel onAssign={onAssign} allowUnavailable />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Asignados</h3>
                <span className="text-sm font-semibold">
                  ${total.toFixed(2)}
                </span>
              </div>

              {issue.products.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-6 text-center">
                  Todavía no has asignado nada.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                  {issue.products.map((product) => (
                    <AssignedRow
                      key={product.id}
                      product={product}
                      onRemove={() => onRemove(product.id)}
                      onUpdatePrice={(price) =>
                        onUpdatePrice(product.id, price)
                      }
                      onUpdateQuantity={(quantity) =>
                        onUpdateQuantity(product.id, quantity)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {/* La asignación ya quedó guardada; el botón solo cierra */}
          <Button type="button" onClick={() => onOpenChange(false)}>
            <Check className="h-4 w-4 mr-1" />
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
