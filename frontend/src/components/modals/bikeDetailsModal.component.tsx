'use client';

import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { Button } from '@/components/ui/button.component';
import { formatDate, usdFormatCurrency, getParsedAmount } from '@/lib/utils';
import {
  BranchesResults,
  TransactionDataResult,
  Type,
} from '@/services/transactions/types/GetAllTransactions';
import { useRoles, useUser } from '@/stores/auth/auth.store';
import {
  BikeServiceKind,
  useBikeServiceHistory,
  useBikeServiceProduct,
  useCreateBikeService,
  useMechanics,
  useOrderForBikeSale,
} from '@/hooks/useBikeService';
import { GpsImeiSelect } from '@/components/gps/gpsImeiSelect.component';
import { NO_IMEI_PLACEHOLDER } from '@/services/bikeServices/bikeServices.service';
import { GpsUnit } from '@/services/gps/types';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import TransactionDetailsDialog from '@/components/modals/TransactionDetailsDialog.component';
import { USED_BIKE_DETAIL } from '@/constants/routes';
import { saveUsedBikeReturn } from '@/utils/usedBikeReturn.utils';
import { useRouter, usePathname } from 'next/navigation';

interface BikeDetailsModalProps {
  bike: BranchesResults | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SERVICE_LABELS: Record<BikeServiceKind, string> = {
  activation: 'Activada',
  gps: 'GPS',
};

// Branches a bike is sent TO to count as an end-customer sale: 24 "Ventas"
// and 36 "Dale Play" (mirrors SALE_BRANCHES in MotoCandelaBE/constants.py).
// A branch-to-branch transfer is ALSO recorded with type='sale' (there's no
// separate "transfer" type), but its targetBranch is a real branch, not one
// of these — so checking type alone would wrongly block activation for a
// bike that was just moved, not actually sold.
const SALE_BRANCHES = [24, 36];

/**
 * El IMEI de la instalación se guarda dentro de las notas de la transacción
 * (`... - IMEI 861234567890123`), que es el único campo libre que tiene.
 */
function getImeiFromNotes(notes?: string): string | null {
  const match = notes?.match(/IMEI\s+([\w-]+)/i);
  return match ? match[1] : null;
}

function BikeServiceAction({
  kind,
  bike,
}: {
  kind: BikeServiceKind;
  bike: BranchesResults;
}) {
  const user = useUser();
  const roles = useRoles();
  const { data: product, isLoading: isLoadingProduct } =
    useBikeServiceProduct(kind);
  const { data: history } = useBikeServiceHistory(bike.plate);
  const { data: mechanics, isLoading: isLoadingMechanics } = useMechanics();
  const createBikeService = useCreateBikeService(bike.plate);
  const [selectedMechanic, setSelectedMechanic] = useState<string>('');
  // La unidad GPS elegida en el desplegable. Es el objeto entero y no un IMEI
  // tecleado a mano: sin unidad elegida la instalación no puede marcarse.
  const [selectedGps, setSelectedGps] = useState<GpsUnit | null>(null);
  const isGps = kind === 'gps';

  if (!bike.plate) {
    return (
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">
          {SERVICE_LABELS[kind]}
        </div>
        Esta moto no tiene placa registrada — no se puede registrar el servicio.
      </div>
    );
  }

  const existingEntry = (history?.results || [])
    .filter((t) => t.product?.id === product?.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  if (existingEntry) {
    const mechanicName = existingEntry.mechanic
      ? `${existingEntry.mechanic.firstName ?? ''} ${existingEntry.mechanic.lastName ?? ''}`.trim() ||
        existingEntry.mechanic.username
      : 'N/A';
    return (
      <div className="rounded-md border p-3 text-sm">
        <div className="font-medium text-green-700">
          {SERVICE_LABELS[kind]} ✓
        </div>
        <div className="text-muted-foreground">
          {formatDate(existingEntry.createdAt)} — {mechanicName}
        </div>
        <div className="text-muted-foreground">
          Costo: {usdFormatCurrency(existingEntry.product?.cost ?? 0)} · Precio
          al cliente: {usdFormatCurrency(existingEntry.product?.price ?? 0)}
        </div>
        {getImeiFromNotes(existingEntry.notes) && (
          <div className="text-muted-foreground">
            IMEI: {getImeiFromNotes(existingEntry.notes)}
          </div>
        )}
      </div>
    );
  }

  const bikeTransactions = (history?.results || [])
    .filter((t) => t.product?.category === 1)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  const lastBikeTransaction = bikeTransactions[0];
  const isSold =
    lastBikeTransaction?.type === Type.Sale &&
    SALE_BRANCHES.includes(lastBikeTransaction?.targetBranch?.id ?? -1);

  // A sold bike normally can't take a new service — except admin, who can
  // still correct/register one after the fact. Everyone else (including
  // manager, who otherwise can manage services) is blocked here.
  if (isSold && !roles.includes('admin')) {
    return (
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">
          {SERVICE_LABELS[kind]}
        </div>
        Esta moto ya fue vendida — no se puede registrar el servicio.
      </div>
    );
  }

  const canManageService = ['admin', 'manager'].some((role) =>
    roles.includes(role)
  );

  if (!canManageService) {
    return (
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">
          {SERVICE_LABELS[kind]}
        </div>
        Solo un administrador puede registrar este servicio.
      </div>
    );
  }

  const branchId = bike.targetBranch?.id;

  const handleSubmit = () => {
    if (!product || !selectedMechanic || !branchId || !user?.id) return;
    // Sin unidad elegida no hay instalación que registrar.
    if (isGps && !selectedGps) return;

    createBikeService.mutate({
      // El IMEI va en la URL, no en el cuerpo: nombra la unidad que el backend
      // pasa a `installed` en la misma transacción que este servicio. Para todo
      // lo que no sea una instalación de GPS el segmento es el placeholder.
      imei: selectedGps?.imei ?? NO_IMEI_PLACEHOLDER,
      payload: {
        order_id: '',
        plate: bike.plate,
        color: bike.color,
        serial_number: bike.serialNumber,
        motor_serial: bike.serialNumber,
        year: bike.year,
        invoice_number: '',
        reception_date: new Date().toISOString(),
        amount: String(product.price ?? 0),
        tax: '0',
        quantity: '1',
        type: Type.Sale,
        product: String(product.id),
        origin_branch: String(branchId),
        target_branch: String(branchId),
        user: String(user.id),
        responsible: String(user.id),
        mechanic: selectedMechanic,
        // El IMEI también queda en las notas: es lo que deja rastro, en el
        // historial de la moto, de qué unidad concreta se le montó.
        notes: selectedGps
          ? `${SERVICE_LABELS[kind]} - moto ${bike.plate} - IMEI ${selectedGps.imei}`
          : `${SERVICE_LABELS[kind]} - moto ${bike.plate}`,
      },
    });
  };

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="font-medium text-sm">
        {SERVICE_LABELS[kind]}
        {product && (
          <span className="text-xs text-muted-foreground ml-2">
            (costo {usdFormatCurrency(product.cost ?? 0)} · cliente{' '}
            {usdFormatCurrency(product.price ?? 0)})
          </span>
        )}
      </div>
      {isGps && (
        <div className="space-y-1">
          <label
            htmlFor={`gps-imei-${bike.plate}`}
            className="text-xs font-medium text-gray-600"
          >
            Unidad GPS (IMEI)
          </label>
          <GpsImeiSelect
            id={`gps-imei-${bike.plate}`}
            value={selectedGps}
            onChange={setSelectedGps}
            disabled={createBikeService.isLoading}
          />
        </div>
      )}
      <div className="flex gap-2">
        <Select value={selectedMechanic} onValueChange={setSelectedMechanic}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Seleccione un mecánico" />
          </SelectTrigger>
          <SelectContent>
            {(mechanics || []).map((mechanic) => (
              <SelectItem key={mechanic.id} value={String(mechanic.id)}>
                {mechanic.firstName} {mechanic.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={
            !selectedMechanic ||
            (isGps && !selectedGps) ||
            isLoadingProduct ||
            isLoadingMechanics ||
            createBikeService.isLoading
          }
          onClick={handleSubmit}
        >
          {createBikeService.isLoading ? 'Registrando...' : 'Marcar'}
        </Button>
      </div>
      {createBikeService.isError && (
        <div className="text-xs text-destructive">
          {isGps
            ? 'No se pudo registrar la instalación. La unidad sigue disponible.'
            : 'Error al registrar el servicio.'}
        </div>
      )}
    </div>
  );
}

function BikeServiceHistoryTable({ plate }: { plate: string }) {
  const { data: history, isLoading, isError } = useBikeServiceHistory(plate);
  const results = (history?.results || []).filter(
    (entry) => entry.product?.category === 5
  );

  if (!plate) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Esta moto no tiene placa registrada — no se puede consultar su
        historial.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Cargando historial de servicios...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 text-sm text-destructive">
        Error al cargar el historial de servicios.
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Esta moto no tiene servicios registrados.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Fecha</TableHead>
            <TableHead className="text-center">Servicio</TableHead>
            <TableHead className="text-center">Mecánico</TableHead>
            <TableHead className="text-center">Costo</TableHead>
            <TableHead className="text-center">Precio Cliente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{formatDate(entry.createdAt)}</TableCell>
              <TableCell>{entry.product?.name || '-'}</TableCell>
              <TableCell>{entry.mechanic?.username || '-'}</TableCell>
              <TableCell>
                {usdFormatCurrency(entry.product?.cost ?? 0)}
              </TableCell>
              <TableCell>
                {usdFormatCurrency(entry.product?.price ?? 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra',
  sale: 'Venta',
  payment: 'Pago',
  wholesale: 'Mayorista',
};

function BikeTransactionRow({ entry }: { entry: TransactionDataResult }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const { data: order, isLoading: isLoadingOrder } = useOrderForBikeSale(
    entry.orderNumber ?? null
  );

  return (
    <>
      <TableRow>
        <TableCell>{formatDate(entry.createdAt)}</TableCell>
        <TableCell>
          {TRANSACTION_TYPE_LABELS[entry.type] ?? entry.type}
        </TableCell>
        <TableCell>{entry.originBranch?.name || '-'}</TableCell>
        <TableCell>{entry.targetBranch?.name || '-'}</TableCell>
        <TableCell>
          {usdFormatCurrency(getParsedAmount(entry.amount))}
        </TableCell>
        <TableCell>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDetails(true)}
            >
              Ver transacción
            </Button>
            {entry.orderNumber && (
              <Button
                size="sm"
                variant="outline"
                disabled={isLoadingOrder}
                onClick={() => setShowOrderModal(true)}
              >
                Ver orden #{entry.orderNumber}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      <TransactionDetailsDialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        transaction={entry}
      />
      {order && (
        <OrderDetailsModal
          order={order}
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
        />
      )}
    </>
  );
}

function BikeSaleSection({ plate }: { plate: string }) {
  const { data: history, isLoading, isError } = useBikeServiceHistory(plate);

  if (!plate) {
    return (
      <div className="py-2 text-sm text-muted-foreground">
        Esta moto no tiene placa registrada — no se puede consultar su historial
        de compra/venta.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-2 text-sm text-muted-foreground">
        Cargando historial de compra/venta...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-2 text-sm text-destructive">
        Error al cargar el historial de compra/venta.
      </div>
    );
  }

  const results = (history?.results || []).filter(
    (entry) => entry.product?.category === 1
  );

  if (!results.length) {
    return (
      <div className="py-2 text-sm text-muted-foreground">
        Esta moto no tiene transacciones de compra/venta registradas.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Fecha</TableHead>
            <TableHead className="text-center">Tipo</TableHead>
            <TableHead className="text-center">Origen</TableHead>
            <TableHead className="text-center">Destino</TableHead>
            <TableHead className="text-center">Monto</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((entry) => (
            <BikeTransactionRow key={entry.id} entry={entry} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Estilo compartido por la etiqueta, sea clickeable o no */
const USED_BADGE_CLASS =
  'ml-2 align-middle inline-block rounded border border-blue-600 px-2 py-0.5 text-xs font-medium text-blue-600';

export default function BikeDetailsModal({
  bike,
  open,
  onOpenChange,
}: BikeDetailsModalProps) {
  const roles = useRoles();
  const router = useRouter();
  const pathname = usePathname();

  // Solo admin entra a la ficha; sin `usedBikeId` no hay a dónde ir (motos
  // cargadas antes de que existiera el módulo)
  const canOpenUsedBike = roles.includes('admin') && !!bike?.usedBikeId;

  /** Deja anotado el regreso para que la tabla reabra este modal al volver */
  const openUsedBike = () => {
    if (!bike?.usedBikeId) return;

    saveUsedBikeReturn({ returnPath: pathname, bike });
    router.push(USED_BIKE_DETAIL(bike.usedBikeId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        width="90%"
        maxHeight="80vh"
        className="max-w-3xl overflow-x-hidden"
      >
        <DialogHeader className="min-w-0">
          <DialogTitle className="break-words">
            {bike?.product?.name}
            {bike?.used ? (
              canOpenUsedBike ? (
                <button
                  type="button"
                  onClick={openUsedBike}
                  className={`${USED_BADGE_CLASS} transition-colors hover:bg-blue-600 hover:text-white`}
                  title="Ver la evaluación de esta moto usada"
                >
                  Usada
                </button>
              ) : (
                <span className={USED_BADGE_CLASS}>Usada</span>
              )
            ) : null}
          </DialogTitle>
          <DialogDescription>{bike?.product.brand}</DialogDescription>
        </DialogHeader>

        {!bike ? (
          <div className="py-4">No hay datos de la moto.</div>
        ) : (
          <div className="space-y-6 min-w-0">
            <section>
              <h3 className="text-lg font-semibold mb-2">Detalles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm break-words">
                <div>
                  <span className="font-medium">Placa:</span> {bike.plate}
                </div>
                <div>
                  <span className="font-medium">Serial del Motor:</span>{' '}
                  {bike.serialNumber}
                </div>
                <div>
                  <span className="font-medium">Fecha de Recepción:</span>{' '}
                  {bike?.receptionDate ? formatDate(bike.receptionDate) : ''}
                </div>
                <div>
                  <span className="font-medium">Costo:</span>{' '}
                  {usdFormatCurrency(bike.amount)}
                </div>
                <div>
                  <span className="font-medium">Precio:</span>{' '}
                  {usdFormatCurrency(bike.prices?.price ?? 0)}
                </div>
                <div>
                  <span className="font-medium">Color:</span> {bike.color}
                </div>

                <div>
                  <span className="font-medium">Año:</span> {bike.year}
                </div>
                {bike.targetBranch && (
                  <div>
                    <span className="font-medium">Sucursal:</span>{' '}
                    {bike.targetBranch.name}
                  </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Servicios</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BikeServiceAction kind="activation" bike={bike} />
                <BikeServiceAction kind="gps" bike={bike} />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">
                Historial de Servicios
              </h3>
              <BikeServiceHistoryTable plate={bike.plate} />
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Compra/Venta</h3>
              <BikeSaleSection plate={bike.plate} />
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
