'use client';

import React, { useEffect, useMemo, useState } from 'react';

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
import { Label } from '@/components/ui/label.component';
import { useToast } from '@/components/ui/use-toast';
import { useMoveApprovalBikes } from '@/hooks/approvals';
import { useAllBranches } from '@/hooks/useAllBranches';
import { Approval } from '@/services/approvals/types';
import {
  formatApprovalProduct,
  getApprovalErrorMessage,
} from './approvals.utils';

const SELECT_CLASSES = 'h-10 w-full rounded-md border px-3 text-sm';

/**
 * "Mover motos": pasa motos aún no recibidas de un modelo de una sucursal a
 * otra, para cuando Empire entrega en otro lado. Lo ya recibido no se mueve.
 */
export function ApprovalMoveDialog({
  approval,
  open,
  onOpenChange,
}: {
  approval: Approval;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { data: branches } = useAllBranches();
  const { moveApprovalBikes, isMovingApprovalBikes } = useMoveApprovalBikes();

  // Solo líneas con motos por recibir pueden ceder motos.
  const pendingLines = useMemo(
    () => approval.lines.filter((line) => line.remainingQuantity > 0),
    [approval.lines]
  );
  const models = useMemo(() => {
    const seen = new Map<number, (typeof pendingLines)[number]['product']>();
    pendingLines.forEach((line) => seen.set(line.product.id, line.product));
    return Array.from(seen.values());
  }, [pendingLines]);

  const [productId, setProductId] = useState('');
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setProductId(models.length === 1 ? String(models[0].id) : '');
    setFromBranchId('');
    setToBranchId('');
    setQuantity('1');
    setError('');
  }, [open, models]);

  const sources = pendingLines.filter(
    (line) => String(line.product.id) === productId
  );
  useEffect(() => {
    if (sources.length === 1) setFromBranchId(String(sources[0].branch.id));
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const source = sources.find(
    (line) => String(line.branch.id) === fromBranchId
  );
  const max = source?.remainingQuantity ?? 0;
  const amount = Number(quantity);
  const canMove =
    !!source &&
    !!toBranchId &&
    toBranchId !== fromBranchId &&
    Number.isInteger(amount) &&
    amount >= 1 &&
    amount <= max &&
    !isMovingApprovalBikes;

  const handleMove = async () => {
    if (!canMove) return;
    setError('');
    try {
      await moveApprovalBikes({
        id: approval.id,
        payload: {
          product: Number(productId),
          fromBranch: Number(fromBranchId),
          toBranch: Number(toBranchId),
          quantity: amount,
        },
      });
      toast({ title: 'Motos movidas' });
      onOpenChange(false);
    } catch (moveError) {
      setError(getApprovalErrorMessage(moveError, 'No se pudieron mover.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="min(460px, 95vw)">
        <DialogHeader>
          <DialogTitle>Mover motos de {approval.number}</DialogTitle>
          <DialogDescription>
            Para cuando Empire entrega en otra sucursal. Solo se mueven motos
            que todavía no llegaron.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="moveModel">Modelo</Label>
            <select
              id="moveModel"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setFromBranchId('');
              }}
              className={SELECT_CLASSES}
            >
              <option value="">Elegir modelo...</option>
              {models.map((product) => (
                <option key={product.id} value={product.id}>
                  {formatApprovalProduct(product)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="moveFrom">Desde</Label>
              <select
                id="moveFrom"
                value={fromBranchId}
                onChange={(e) => setFromBranchId(e.target.value)}
                disabled={!productId}
                className={SELECT_CLASSES}
              >
                <option value="">Sucursal...</option>
                {sources.map((line) => (
                  <option key={line.branch.id} value={line.branch.id}>
                    {line.branch.name} ({line.remainingQuantity})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="moveTo">Hacia</Label>
              <select
                id="moveTo"
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                disabled={!fromBranchId}
                className={SELECT_CLASSES}
              >
                <option value="">Sucursal...</option>
                {(branches || [])
                  .filter((branch) => String(branch.id) !== fromBranchId)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="moveQuantity">Cantidad</Label>
            <Input
              id="moveQuantity"
              type="number"
              min={1}
              max={max || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-28 tabular-nums"
            />
            {source && (
              <p className="text-xs text-gray-500">
                Hasta {max}: las que {source.branch.name} todavía no recibió.
              </p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!canMove} onClick={handleMove}>
            {isMovingApprovalBikes ? 'Moviendo...' : 'Mover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
