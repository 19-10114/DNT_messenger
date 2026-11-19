'use client';

import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Card } from '@/components/ui/card.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { AmountInput } from './AmountInput.component';
import { BranchSalePart } from './branchSale.model';

interface BranchSalePartsCardProps {
  parts: BranchSalePart[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onPriceChange: (productId: string, price: number) => void;
  onRemove: (productId: string) => void;
}

export function BranchSalePartsCard({
  parts,
  onQuantityChange,
  onPriceChange,
  onRemove,
}: BranchSalePartsCardProps) {
  /**
   * La cantidad también se escribe a mano. Vaciar el campo la deja en 1: en el
   * modelo es un número, no admite el vacío intermedio.
   */
  const handleQuantityType = (productId: string, raw: string) => {
    if (!/^\d*$/.test(raw)) return;
    onQuantityChange(productId, raw === '' ? 1 : parseInt(raw, 10));
  };

  return (
    <div className="space-y-2">
      {parts.map((part) => (
        <Card key={part.productId} className="p-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{part.name}</h4>
              <p className="text-xs text-gray-600">SKU: {part.sku}</p>

              {/* Cantidad y monto en una sola línea, sin etiquetas */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() =>
                      onQuantityChange(part.productId, part.quantity - 1)
                    }
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={part.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={part.quantity}
                    onChange={(e) =>
                      handleQuantityType(part.productId, e.target.value)
                    }
                    className="w-12 h-6 text-xs text-center"
                  />
                  <Button
                    onClick={() =>
                      onQuantityChange(part.productId, part.quantity + 1)
                    }
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={part.quantity >= part.availableQuantity}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs">$</Label>
                  <AmountInput
                    className="w-20"
                    value={part.price.toString()}
                    onChange={(next) =>
                      onPriceChange(part.productId, parseFloat(next) || 0)
                    }
                  />
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                Subtotal: ${(part.price * part.quantity).toFixed(2)}
              </p>
            </div>
            <Button
              onClick={() => onRemove(part.productId)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 self-start sm:self-auto text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
