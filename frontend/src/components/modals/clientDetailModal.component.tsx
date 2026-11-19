'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.component';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.component';
import { Button } from '@/components/ui/button.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { formatDate, usdFormatCurrency } from '@/lib/utils';
import { useToken } from '@/stores/auth/auth.store';
import {
  useClientOrders,
  useClientPreOrders,
  useClientProducts,
  useClientProductDetail,
} from '@/hooks/useClients';
import { useOrderForBikeSale } from '@/hooks/useBikeService';
import { ClientData } from '@/services/clients/types/Client.type';
import {
  ClientOrderListItem,
  ClientProductSummary,
} from '@/services/clients/types/ClientHistory.type';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import { ActivityTimeline } from '@/components/activity/activityTimeline.component';

interface ClientDetailModalProps {
  client: ClientData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  sale: 'Venta',
  purchase: 'Compra',
  payment: 'Pago',
  wholesale: 'Mayorista',
};

function ClientOrderRow({ order }: { order: ClientOrderListItem }) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const { data: orderDetail, isLoading: isLoadingOrder } = useOrderForBikeSale(
    order.id
  );

  return (
    <>
      <TableRow>
        <TableCell className="text-center">
          {formatDate(order.createdAt)}
        </TableCell>
        <TableCell className="text-center">
          {ORDER_TYPE_LABELS[order.type] ?? order.type}
        </TableCell>
        <TableCell className="text-center">
          {usdFormatCurrency(order.computedTotal)}
        </TableCell>
        <TableCell className="text-center">
          <Button
            size="sm"
            variant="outline"
            disabled={isLoadingOrder}
            onClick={() => setShowOrderModal(true)}
          >
            #{order.id}
          </Button>
        </TableCell>
      </TableRow>
      {orderDetail && (
        <OrderDetailsModal
          order={orderDetail}
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
        />
      )}
    </>
  );
}

function ClientOrdersSection({ clientId }: { clientId: number }) {
  const token = useToken();
  const [page, setPage] = useState(1);
  const { orders, totalSpent, currentPage, totalPages, isLoadingOrders } =
    useClientOrders(token, clientId, { page: String(page) });

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Órdenes Completadas</h3>
        <div className="text-sm">
          <span className="text-muted-foreground">Total Gastado: </span>
          <span className="font-semibold text-green-700">
            {usdFormatCurrency(totalSpent)}
          </span>
        </div>
      </div>
      {isLoadingOrders ? (
        <div className="py-2 text-sm text-muted-foreground">
          Cargando órdenes...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-2 text-sm text-muted-foreground">
          Este cliente no tiene órdenes completadas.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Fecha</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Orden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <ClientOrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="py-2">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ClientPreOrdersSection({ clientId }: { clientId: number }) {
  const token = useToken();
  const [page, setPage] = useState(1);
  const {
    preOrders,
    activeCount,
    totalPending,
    currentPage,
    totalPages,
    isLoadingPreOrders,
  } = useClientPreOrders(token, clientId, { page: String(page) });

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Pre Órdenes</h3>
        <div className="text-sm">
          <span className="text-muted-foreground">
            Pre Órdenes Activas: {activeCount}
          </span>
          <span className="text-muted-foreground ml-4">Pendiente: </span>
          <span className="font-semibold text-amber-700">
            {usdFormatCurrency(totalPending)}
          </span>
        </div>
      </div>
      {isLoadingPreOrders ? (
        <div className="py-2 text-sm text-muted-foreground">
          Cargando pre órdenes...
        </div>
      ) : preOrders.length === 0 ? (
        <div className="py-2 text-sm text-muted-foreground">
          Este cliente no tiene pre órdenes pendientes.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Fecha</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Orden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preOrders.map((order) => (
                <ClientOrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="py-2">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ClientProductDetailModal({
  clientId,
  product,
  onClose,
}: {
  clientId: number;
  product: ClientProductSummary;
  onClose: () => void;
}) {
  const token = useToken();
  const [page, setPage] = useState(1);
  const { transactions, currentPage, totalPages, isLoadingTransactions } =
    useClientProductDetail(token, clientId, product.productId, {
      page: String(page),
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent width="90%" maxHeight="80vh" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product.productName}</DialogTitle>
          <DialogDescription>
            Transacciones de este producto para este cliente
          </DialogDescription>
        </DialogHeader>
        {isLoadingTransactions ? (
          <div className="py-4 text-sm text-muted-foreground">
            Cargando transacciones...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-4 text-sm text-muted-foreground">
            No hay transacciones registradas.
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Fecha</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-center">Monto</TableHead>
                  <TableHead className="text-center">Orden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <ClientProductTransactionRow key={tx.id} transaction={tx} />
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="py-2">
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClientProductTransactionRow({
  transaction,
}: {
  transaction: {
    id: number;
    quantity: number;
    amount: number;
    lineValue: number;
    receptionDate: string;
    orderNumberId: number;
  };
}) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const { data: orderDetail, isLoading: isLoadingOrder } = useOrderForBikeSale(
    transaction.orderNumberId
  );

  return (
    <>
      <TableRow>
        <TableCell className="text-center">
          {formatDate(transaction.receptionDate)}
        </TableCell>
        <TableCell className="text-center">{transaction.quantity}</TableCell>
        <TableCell className="text-center">
          {usdFormatCurrency(transaction.lineValue)}
        </TableCell>
        <TableCell className="text-center">
          <Button
            size="sm"
            variant="outline"
            disabled={isLoadingOrder}
            onClick={() => setShowOrderModal(true)}
          >
            #{transaction.orderNumberId}
          </Button>
        </TableCell>
      </TableRow>
      {orderDetail && (
        <OrderDetailsModal
          order={orderDetail}
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
        />
      )}
    </>
  );
}

function ClientProductsSection({ clientId }: { clientId: number }) {
  const token = useToken();
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] =
    useState<ClientProductSummary | null>(null);
  const { products, currentPage, totalPages, isLoadingProducts } =
    useClientProducts(token, clientId, { page: String(page) });

  return (
    <section>
      <h3 className="text-lg font-semibold mb-2">Productos Comprados</h3>
      {isLoadingProducts ? (
        <div className="py-2 text-sm text-muted-foreground">
          Cargando productos...
        </div>
      ) : products.length === 0 ? (
        <div className="py-2 text-sm text-muted-foreground">
          Este cliente no ha comprado productos.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Producto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell className="text-center">
                    <button
                      className="text-primary underline hover:no-underline"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.productName}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="py-2">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {selectedProduct && (
        <ClientProductDetailModal
          clientId={clientId}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}

export function ClientDetailModal({
  client,
  open,
  onOpenChange,
}: ClientDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        width="90%"
        maxHeight="85vh"
        className="max-w-3xl overflow-x-hidden"
      >
        <DialogHeader className="min-w-0">
          <DialogTitle className="break-words">
            {client?.firstName} {client?.lastName} — {client?.countryId}
          </DialogTitle>
        </DialogHeader>

        {!client ? (
          <div className="py-4">No hay datos del cliente.</div>
        ) : (
          <div className="space-y-6 min-w-0">
            <section>
              <h3 className="text-lg font-semibold mb-2">Detalles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm break-words">
                <div>
                  <span className="font-medium">Teléfono:</span>{' '}
                  {client.phoneNumber || '-'}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  {client.email || '-'}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>{' '}
                  {client.type === 'aliado' ? 'Aliado' : 'Regular'}
                </div>
                <div>
                  <span className="font-medium">Cliente desde:</span>{' '}
                  {client.createdAt ? formatDate(client.createdAt) : '-'}
                </div>
                <div>
                  <span className="font-medium">Dirección:</span>{' '}
                  {client.address || '-'}
                </div>
                <div>
                  <span className="font-medium">Ciudad:</span>{' '}
                  {client.city || '-'}
                </div>
                {client.residenceType && (
                  <div>
                    <span className="font-medium">Tipo de Residencia:</span>{' '}
                    {client.residenceType}
                  </div>
                )}
                {client.street && (
                  <div>
                    <span className="font-medium">Calle:</span> {client.street}
                  </div>
                )}
                {client.residence && (
                  <div>
                    <span className="font-medium">Residencia:</span>{' '}
                    {client.residence}
                  </div>
                )}
                {client.district && (
                  <div>
                    <span className="font-medium">Parroquia:</span>{' '}
                    {client.district}
                  </div>
                )}
                {client.state && (
                  <div>
                    <span className="font-medium">Estado:</span> {client.state}
                  </div>
                )}
                {client.postalCode && (
                  <div>
                    <span className="font-medium">Código Postal:</span>{' '}
                    {client.postalCode}
                  </div>
                )}
                {client.localPhoneNumber && (
                  <div>
                    <span className="font-medium">Teléfono Local:</span>{' '}
                    {client.localPhoneNumber}
                  </div>
                )}
              </div>
            </section>

            <ClientOrdersSection clientId={client.id} />
            <ClientPreOrdersSection clientId={client.id} />
            <ClientProductsSection clientId={client.id} />
            <ActivityTimeline
              targetModel="client"
              targetId={client.id}
              variant="collapsible"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
