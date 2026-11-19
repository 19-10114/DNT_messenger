'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import { useOrders } from '@/hooks/useOrders';
import { useClientBonusDetail } from '@/hooks/useTransactions';
import { useToken } from '@/stores/auth/auth.store';
import { usdFormatCurrency } from '@/lib/utils';
import { ClientBonusLedger } from './ClientBonusLedger.component';

/**
 * Detalle de un cliente al hacer click en su fila de la tabla de saldos:
 * en qué órdenes depositó ("Abono") y en cuáles pagó usando ese saldo
 * ("Orden"). Mismo endpoint y ledger que ClientBalanceSearch, filtrado por
 * `client` en vez de por texto.
 */
export function ClientBalanceDetailModal({
  clientId,
  onClose,
}: {
  clientId: number | null;
  onClose: () => void;
}) {
  const token = useToken();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const { data, isLoading } = useClientBonusDetail(token, clientId);
  const result = data?.results?.[0];

  const { orderById } = useOrders(
    token,
    false,
    undefined,
    undefined,
    selectedOrderId ?? undefined,
    !!selectedOrderId
  );

  // Ambos tipos de movimiento apuntan a una orden real: la de depósito
  // ('transaction') es la orden con el producto "Abono Cliente", la de uso
  // ('order') es la que se pagó con ese saldo -- las dos son navegables.
  const handleItemClick = (id: number) => {
    setSelectedOrderId(id.toString());
    setIsOrderModalOpen(true);
  };

  return (
    <>
      <Dialog
        open={clientId != null}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent width="600px" maxHeight="80vh">
          <DialogHeader>
            <DialogTitle>
              {result
                ? `${result.client.firstName} ${result.client.lastName}`
                : 'Movimientos de abono'}
            </DialogTitle>
          </DialogHeader>

          {isLoading && (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          )}

          {!isLoading && result && (
            <>
              <div className="flex items-center justify-between px-1 pb-2 border-b">
                <span className="text-sm text-gray-600">Saldo actual</span>
                <span
                  className={
                    result.total >= 0
                      ? 'text-green-600 font-bold'
                      : 'text-red-600 font-bold'
                  }
                >
                  {usdFormatCurrency(result.total)}
                </span>
              </div>
              <div className="overflow-y-auto max-h-[50vh] pt-2">
                <ClientBonusLedger
                  items={result.items}
                  onItemClick={handleItemClick}
                />
              </div>
            </>
          )}

          {!isLoading && !result && (
            <p className="text-sm text-muted-foreground">
              No hay movimientos de abono para este cliente.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <OrderDetailsModal
        open={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
        order={orderById as any}
      />
    </>
  );
}
