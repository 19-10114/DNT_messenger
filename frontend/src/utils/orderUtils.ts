import { OrderDetails, PaymentMethod } from '@/stores/order/order.store';
import {
  TransactionDataPayload,
  Type,
} from '@/services/transactions/types/GetAllTransactions';
import {
  OrderPayload,
  TransactionData,
} from '@/services/orders/orders.service';

export function buildTransactionPayloads(
  orderDetails: OrderDetails,
  paymentMethods: PaymentMethod[],
  selectedMotorcycles: any[],
  selectedSpareParts: any[],
  userId: string
): TransactionDataPayload[] {
  // Construir las transacciones para motocicletas
  const motorcycleTransactions: TransactionDataPayload[] =
    selectedMotorcycles.map((moto, index) => ({
      order_id: orderDetails.invoice_number,
      plate: moto.plate || '',
      color: moto.color || '',
      serial_number: moto.serialNumber || moto.serial_number || '',
      motor_serial: moto.motorSerial || moto.motor_serial || '',
      in_number: moto.inNumber || moto.in_number || '',
      out_number: moto.outNumber || moto.out_number || '',
      year: moto.year || new Date().getFullYear().toString(),
      invoice_number: orderDetails.invoice_number,
      reception_date: new Date().toISOString().split('T')[0],
      amount: (moto.price || 0).toString(),
      tax: '0',
      quantity: '1',
      type: orderDetails.type === 'sale' ? Type.Sale : Type.Purchase,
      product: moto.id || moto.sku || `moto-${index}`,
      productName: moto.name || moto.model || 'Motocicleta',
      origin_branch: orderDetails.origin_branch.toString(),
      target_branch: orderDetails.target_branch.toString(),
      user: userId,
      responsible: userId,
      notes: orderDetails.notes || '',
    }));

  // Construir las transacciones para repuestos
  const sparePartTransactions: TransactionDataPayload[] =
    selectedSpareParts.map((part, index) => ({
      order_id: orderDetails.invoice_number,
      plate: '', // Required field for spare parts
      color: '', // Required field for spare parts
      serial_number: '', // Required field for spare parts
      year: new Date().getFullYear().toString(), // Required field for spare parts
      invoice_number: orderDetails.invoice_number,
      reception_date: new Date().toISOString().split('T')[0],
      amount: ((part.price || 0) * (part.quantity || 1)).toString(),
      tax: '0',
      quantity: (part.quantity || 1).toString(),
      type: orderDetails.type === 'sale' ? Type.Sale : Type.Purchase,
      product: part.id || part.sku || `part-${index}`,
      productName: part.name || 'Repuesto',
      origin_branch: orderDetails.origin_branch.toString(),
      target_branch: orderDetails.target_branch.toString(),
      user: userId,
      responsible: userId,
      notes: orderDetails.notes || '',
    }));

  // Combinar todas las transacciones
  return [...motorcycleTransactions, ...sparePartTransactions];
}

// Nueva función para construir el payload completo de la orden usando OrderService
export function buildOrderPayload(
  orderDetails: OrderDetails,
  paymentMethods: PaymentMethod[],
  selectedMotorcycles: any[],
  selectedSpareParts: any[],
  selectedOthers: any[],
  userId: string,
  clientId: string,
  totalInvoiceUsd: number,
  billed: boolean = true,
  deliveryNoteNumber?: string,
  seller?: string
): OrderPayload {
  // Construir las transacciones para motocicletas
  const motorcycleTransactions: TransactionData[] = selectedMotorcycles.map(
    (moto, index) => ({
      order_id: orderDetails.invoice_number,
      plate: moto.plate || '',
      color: moto.color || '',
      serial_number: moto.serialNumber || moto.serial_number || '',
      motor_serial: moto.motorSerial || moto.motor_serial || '',
      in_number: moto.inNumber || moto.in_number || '',
      out_number: moto.outNumber || moto.out_number || '',
      year: moto.year || new Date().getFullYear().toString(),
      invoice_number: orderDetails.invoice_number,
      reception_date: new Date().toISOString().split('T')[0],
      amount: (moto.price || 0).toString(),
      tax: '0',
      quantity: '1',
      type: orderDetails.type as 'sale' | 'purchase',
      product: moto.id || moto.sku || `moto-${index}`,
      productName: moto.name || moto.model || 'Motocicleta',
      origin_branch: orderDetails.origin_branch.toString(),
      target_branch: orderDetails.target_branch.toString(),
      user: userId,
      responsible: userId,
      notes: orderDetails.notes || '',
    })
  );

  // Construir las transacciones para repuestos
  const sparePartTransactions: TransactionData[] = selectedSpareParts.map(
    (part, index) => ({
      order_id: orderDetails.invoice_number,
      invoice_number: orderDetails.invoice_number,
      reception_date: new Date().toISOString().split('T')[0],
      amount: (part.price || 0).toString(),
      tax: '0',
      quantity: (part.quantity || 1).toString(),
      type: orderDetails.type as 'sale' | 'purchase',
      product: part.id || part.sku || `part-${index}`,
      productName: part.name || 'Repuesto',
      origin_branch: orderDetails.origin_branch.toString(),
      target_branch: orderDetails.target_branch.toString(),
      user: userId,
      responsible: userId,
      notes: orderDetails.notes || '',
    })
  );

  // Construir las transacciones para otros productos
  const otherTransactions: TransactionData[] = selectedOthers.map(
    (other, index) => ({
      order_id: orderDetails.invoice_number,
      invoice_number: orderDetails.invoice_number,
      reception_date: new Date().toISOString().split('T')[0],
      amount: (other.price || 0).toString(),
      tax: '0',
      quantity: (other.quantity || 1).toString(),
      type: orderDetails.type as 'sale' | 'purchase',
      product: other.id || other.sku || `other-${index}`,
      productName: other.name || 'Otro',
      origin_branch: orderDetails.origin_branch.toString(),
      target_branch: orderDetails.target_branch.toString(),
      user: userId,
      responsible: userId,
      notes: orderDetails.notes || '',
    })
  );

  // Combinar todas las transacciones
  const allTransactions = [
    ...motorcycleTransactions,
    ...sparePartTransactions,
    ...otherTransactions,
  ];

  // Construir el payload final
  const payload: OrderPayload = {
    order: {
      invoice_number: orderDetails.invoice_number,
      type: orderDetails.type as 'sale' | 'purchase',
      notes: orderDetails.notes || '',
      payment_methods: paymentMethods,
      origin_branch: orderDetails.origin_branch,
      target_branch: orderDetails.target_branch,
      total_invoice_bs: orderDetails.total_invoice_bs,
      client: clientId,
      total_invoice_usd: totalInvoiceUsd,
      total_billed_usd: orderDetails.total_billed_usd,
      rate: orderDetails.rate,
      dom_reserve: orderDetails.dom_reserve,
      dom_number: orderDetails.dom_number,
      insurance_company: orderDetails.insurance_company,
      insurance_number: orderDetails.insurance_number,
      insurance_expiration: orderDetails.insurance_expiration,
      observations: orderDetails.observations,
      billed,
      status: orderDetails.status || (billed ? 'completed' : 'incomplete'),
      ...(seller && { seller }),
      ...(deliveryNoteNumber && { delivery_note_number: deliveryNoteNumber }),
    },
    transactions: allTransactions,
  };

  return payload;
}
