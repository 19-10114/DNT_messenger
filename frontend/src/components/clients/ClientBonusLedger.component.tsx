import { ClientBonusItem } from '@/services/transactions/types/ClientBonus.type';
import { cn, usdFormatCurrency } from '@/lib/utils';

/**
 * Lista de movimientos de abono de un cliente: depósitos ("Abono", suman) y
 * órdenes pagadas con abono ("Orden", restan). Ambos tipos apuntan a una
 * orden real y son clickeables -- la de depósito es la orden donde se
 * compró el producto "Abono Cliente", la de uso es la orden que se pagó con
 * ese saldo -- mismo criterio que ya usa el modal de Historial de Clientes
 * (se puede entrar tanto a la orden con método de pago abono como a la
 * orden cuyo producto es abono). Compartido entre ClientBalanceSearch
 * (resultado expandible) y ClientBalanceDetailModal (click en una fila de
 * la tabla de saldos) para no duplicar el render.
 */
export function ClientBonusLedger({
  items,
  onItemClick,
}: {
  items: ClientBonusItem[];
  onItemClick: (orderId: number) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={`${item.type}-${item.id}-${item.date}`}
          onClick={() => onItemClick(item.id)}
          className={cn(
            'p-3 rounded border flex justify-between items-center cursor-pointer transition-colors hover:brightness-95',
            item.adds
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          )}
        >
          <div>
            <p className="font-medium flex items-center gap-2">
              {item.type === 'order' ? 'Orden' : 'Abono'}
              <span className="font-bold text-blue-600">#{item.id}</span>
            </p>
            <p className="text-sm text-gray-600">
              {new Date(item.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <p
            className={cn(
              'font-bold',
              item.adds ? 'text-green-700' : 'text-red-700'
            )}
          >
            {item.adds ? '+' : '-'}
            {usdFormatCurrency(item.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}
