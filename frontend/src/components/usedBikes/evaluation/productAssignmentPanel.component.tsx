'use client';

import React, { useState } from 'react';

import { OrderOthersList } from '@/components/forms/orderForm/OrderOthersList.component';
import { OrderPartsList } from '@/components/forms/orderForm/OrderPartsList.component';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { AssignedProduct } from '@/stores/usedBikeEvaluation/usedBikeEvaluation.store';

interface ProductAssignmentPanelProps {
  onAssign: (product: AssignedProduct) => void;
  /** Deja asignar repuestos sin stock: la evaluación no descuenta inventario */
  allowUnavailable?: boolean;
}

type PanelTab = 'repuestos' | 'otros';

/**
 * Buscador de repuestos y servicios para asignar a un hallazgo.
 * Reutiliza los listados del formulario de órdenes.
 */
export function ProductAssignmentPanel({
  onAssign,
  allowUnavailable = false,
}: ProductAssignmentPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('repuestos');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="rounded-md border bg-muted/20 p-3 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 border-b">
        <Button
          type="button"
          variant={activeTab === 'repuestos' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('repuestos')}
          className="rounded-b-none flex-1 sm:flex-none"
        >
          Repuestos
        </Button>
        <Button
          type="button"
          variant={activeTab === 'otros' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('otros')}
          className="rounded-b-none flex-1 sm:flex-none"
        >
          Otros
        </Button>
      </div>

      <Input
        placeholder="Buscar por SKU, nombre o modelo..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <div className="max-h-80 overflow-y-auto">
        {activeTab === 'repuestos' ? (
          <OrderPartsList
            searchTerm={searchTerm}
            allowUnavailable={allowUnavailable}
            onAddPart={(part) =>
              onAssign({
                id: `part-${part.id}`,
                productId: Number(part.id),
                sku: part.sku,
                name: part.name,
                // El precio final lo ajusta el hallazgo según su letra
                price: part.price,
                quantity: 1,
                listPrice: part.price,
                source: 'part',
              })
            }
          />
        ) : (
          <OrderOthersList
            searchTerm={searchTerm}
            onAddOther={(other) =>
              onAssign({
                id: `other-${other.id}`,
                productId: Number(other.id),
                sku: other.sku,
                name: other.name,
                price: other.price,
                quantity: 1,
                listPrice: other.price,
                source: 'other',
              })
            }
          />
        )}
      </div>
    </div>
  );
}
