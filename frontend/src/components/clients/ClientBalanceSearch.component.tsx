'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { SearchInput } from '@/components/ui/searchInput.component';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import { useOrders } from '@/hooks/useOrders';
import { useClientBalanceSearch } from '@/hooks/useTransactions';
import { useToken } from '@/stores/auth/auth.store';
import { cn, usdFormatCurrency } from '@/lib/utils';
import { ClientBonusLedger } from './ClientBonusLedger.component';

/**
 * Búsqueda de saldo por cliente (nombre, apellido o cédula) -- el saldo sale
 * de sus abonos: lo que depositó como "Abono Cliente" menos lo que ya gastó
 * pagando órdenes con ese método. No está acotado a una sucursal: el saldo
 * de un cliente es suyo, no de una sucursal en particular. Mismo endpoint y
 * forma de datos que ClientBonusModal (dashboard/sucursales), pero ahí es
 * una lista completa de todos los clientes y solo la ve Super Admin; acá es
 * una búsqueda puntual, abierta a cualquier rol con acceso al menú.
 */
export function ClientBalanceSearch() {
  const token = useToken();
  const [search, setSearch] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useClientBalanceSearch(
    token,
    search
  );

  // React Query v4: un query con `enabled: false` que nunca llegó a correr
  // reporta `isLoading: true` por defecto (el status arranca en 'loading',
  // no en 'idle') -- sin este guard, "Buscando..." queda pegado desde el
  // montaje aunque el buscador esté vacío. Solo es una búsqueda real cuando
  // el query está habilitado (mismo umbral que `enabled` en el hook).
  const isSearchEnabled = search.trim().length >= 3;
  const isSearching = isLoading && isSearchEnabled;

  // El backend responde 404 cuando el cliente existe pero no tiene ningún
  // movimiento de abono -- no es una falla, es "saldo 0 / sin historial".
  const isNotFound =
    isError &&
    (error as { response?: { status?: number } })?.response?.status === 404;

  const results = data?.results ?? [];

  const { orderById } = useOrders(
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

  // Ambos tipos de movimiento apuntan a una orden real: la de depósito
  // ('transaction') es la orden con el producto "Abono Cliente", la de uso
  // ('order') es la que se pagó con ese saldo -- las dos son navegables.
  const handleItemClick = (id: number) => {
    setSelectedOrderId(id.toString());
    setIsOrderModalOpen(true);
  };

  return (
    <>
      <div className="space-y-4 max-w-2xl">
        <SearchInput
          placeholder="Buscar por nombre, apellido o cédula..."
          onSearch={setSearch}
          debounceMs={400}
        />

        {search.trim().length > 0 && search.trim().length < 3 && (
          <p className="text-sm text-muted-foreground">
            Escribí al menos 3 caracteres para buscar.
          </p>
        )}

        {isSearching && (
          <p className="text-sm text-muted-foreground">Buscando...</p>
        )}

        {isError && !isNotFound && (
          <p className="text-sm text-destructive">
            No se pudo buscar el cliente. Intentá de nuevo.
          </p>
        )}

        {isNotFound && (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No hay movimientos de abono para ese cliente.</p>
            <p className="text-sm">Su saldo es $0.00.</p>
          </div>
        )}

        {!isSearching && !isError && isSearchEnabled && (
          <div className="space-y-2">
            {results.map((result) => (
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
                      Cédula: {result.client.countryId}
                      {result.client.phoneNumber &&
                        ` | Tel: ${result.client.phoneNumber}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={cn(
                          'font-bold',
                          result.total >= 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {usdFormatCurrency(result.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {result.items.length} movimiento(s)
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
                    <ClientBonusLedger
                      items={result.items}
                      onItemClick={handleItemClick}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <OrderDetailsModal
        open={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
        order={orderById as any}
      />
    </>
  );
}
