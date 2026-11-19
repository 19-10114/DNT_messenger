'use client';
import React, { useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog.component';
import { OrderData } from '@/services/orders/types/Order.type';
import { InteractiveCertificateForm } from '@/components/forms/InteractiveCertificateForm.component';
import { CertificateOriginSchemaType } from '@/schemas/certificateOrigin.schema';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import { X } from 'lucide-react';

interface Props {
  order: OrderData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CertificateOriginModal({
  order,
  open,
  onOpenChange,
}: Props) {
  const defaultValues = useMemo<
    Partial<CertificateOriginSchemaType> | undefined
  >(() => {
    if (!order) return undefined;

    const values = {
      concesionario: 'Moto Candela',
      rif: order.client?.countryId || '',
      cedula: order.client?.countryId || '',
      factura: order.invoiceNumber || String(order.id),
      fechaFactura: order.createdAt ? formatDate(order.createdAt) : '',
      nombreRazonSocial: order.client
        ? `${order.client.firstName} ${order.client.lastName}`
        : '',
      casaApto:
        (order.client?.residenceType || order.residenceType || '') +
        ' ' +
        (order.client?.residence || order.residence || ''),
      urbanizacionBarrio: order.client?.address || '',
      avenidaCalle: order.client?.street || order.street || '',
      distritoParroquia: order.client?.district || order.district || '',
      ciudad: order.client?.city || '',
      codigoPostal: order.client?.postalCode || order.postalCode || '',
      telefonoHabitacion:
        order.client?.localPhoneNumber ||
        order.localPhoneNumber ||
        order.client?.phoneNumber ||
        '',
      dom_reserve: order.domReserve || '',
      dom_number: order.domNumber || '',
      insurance_company: order.insuranceCompany || '',
      insurance_number: order.insuranceNumber || '',
      insurance_expiration: order.insuranceExpiration || '',
      observations: order.observations || '',
      state: order.client?.state || order.state || '',
    };

    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.toUpperCase() : value,
      ])
    ) as Partial<CertificateOriginSchemaType>;
  }, [order]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-full max-h-[95vh] h-[95vh] overflow-hidden flex flex-col p-0">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Certificado de Origen</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <InteractiveCertificateForm defaultValues={defaultValues} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
