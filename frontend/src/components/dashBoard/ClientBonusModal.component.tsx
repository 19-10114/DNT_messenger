'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { usdFormatCurrency } from '@/lib/utils';
import { ClientBonusResult } from '@/services/transactions/types/ClientBonus.type';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import { useOrders } from '@/hooks/useOrders';
import { useToken } from '@/stores/auth/auth.store';
import { cn } from '@/lib/utils';

interface ClientBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ClientBonusResult[];
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  title: string;
}

export function ClientBonusModal({
  isOpen,
  onClose,
  data,
  total,
  currentPage,
  totalPages,
  onPageChange,
  title,
}: ClientBonusModalProps) {
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const token = useToken();

  // Fetch order details only when an order is selected
  const { orderById, isLoadingOrderById } = useOrders(
    token,
    false,
    undefined,
    undefined,
    selectedOrderId ?? undefined,
    !!selectedOrderId
  );

  const toggleClient = (clientId: number) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  const handleOrderClick = (id: number, type: string) => {
    if (type === 'order') {
      setSelectedOrderId(id.toString());
      setIsOrderModalOpen(true);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent width="90%" maxHeight="90vh">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {title} - {usdFormatCurrency(total)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {data && data.length > 0 ? (
              data.map((result) => (
                <div
                  key={result.client.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleClient(result.client.id)}
                    className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-semibold">
                        {result.client.firstName} {result.client.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        ID: {result.client.countryId} | Tel:{' '}
                        {result.client.phoneNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {usdFormatCurrency(result.total)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.items.length} item(s)
                        </p>
                      </div>
                      {expandedClientId === result.client.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </button>

                  {expandedClientId === result.client.id && (
                    <div className="bg-gray-50 p-4 border-t max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {result.items.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              'p-3 rounded border flex justify-between items-center',
                              item.adds
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            )}
                          >
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {item.type === 'order'
                                  ? 'Metodo de pago'
                                  : 'Abono'}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrderClick(item.id, item.type);
                                  }}
                                  className={cn(
                                    'font-bold hover:underline',
                                    item.type === 'order'
                                      ? 'cursor-pointer text-blue-600'
                                      : 'cursor-default'
                                  )}
                                  disabled={item.type !== 'order'}
                                >
                                  #{item.id}
                                </button>
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(item.date).toLocaleDateString(
                                  'es-ES',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            </div>
                            <p
                              className={cn(
                                'font-bold',
                                item.adds ? 'text-green-700' : 'text-red-700'
                              )}
                            >
                              {usdFormatCurrency(item.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hay datos disponibles
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
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
