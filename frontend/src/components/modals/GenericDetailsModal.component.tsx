import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button.component';
import '@/components/componentStyle.css';
import { exportToXLSX } from '@/components/excelExporter/exportXSLX';
import { PrinterIcon } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import PrintInvoice from '../prinInvoice/printInvoice.component';
import { formatCurrencyBolivares, usdFormatCurrency } from '@/lib/utils';
import { ProductsService } from '@/services/products/products.service';

const productService = new ProductsService();
interface DayInfo {
  [key: string]: any;
  id?: number;
  statusPago?: string;
}

interface Data {
  dayInfo: DayInfo[];
  sumPending?: number;
  sumPaid?: number;
  sumTotal?: number;
}

interface LocationDetailsModalProps<T> {
  onClose: () => void;
  fetchDetails: () => Promise<Data | T[]>;
  columns: { key: keyof T; label: string }[];
  payload: Record<string, any>;
  enableGenerateInvoice?: boolean;
  onGenerateInvoice?: (item: T) => void;
  fileName?: string;
}

export default function ModalForLocationDetails<T extends DayInfo>({
  onClose,
  fetchDetails,
  columns,
  payload,
  enableGenerateInvoice,
  onGenerateInvoice,
  fileName,
}: LocationDetailsModalProps<T>) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<T[] | null>(null);
  const [summaryData, setSummaryData] = useState<{
    sumPending?: number;
    sumPaid?: number;
    sumTotal?: number;
  } | null>(null);
  const [invoiceData, setInvoiceData] = useState<T | null>(null);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<{
    [key: number]: string;
  }>({});
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Factura',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchDetails();
        if ('dayInfo' in data) {
          setDetails(data.dayInfo as T[]);
          // Solo establecemos summaryData si al menos uno de los valores es un número válido
          if (
            typeof data.sumPending === 'number' ||
            typeof data.sumPaid === 'number' ||
            typeof data.sumTotal === 'number'
          ) {
            setSummaryData({
              sumPending: data.sumPending,
              sumPaid: data.sumPaid,
              sumTotal: data.sumTotal,
            });
          } else {
            setSummaryData(null);
          }
        } else if (Array.isArray(data)) {
          setDetails(data);
          setSummaryData(null);
        } else {
          setDetails([]);
          setSummaryData(null);
        }
      } catch (error) {
        console.error('Error fetching details:', error);
        setSummaryData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchDetails]);

  useEffect(() => {
    if (invoiceData) {
      handlePrint();
    }
  }, [handlePrint, invoiceData]);

  const generateInvoice = (item: T) => {
    setInvoiceData(item);
    onGenerateInvoice?.(item);
  };

  const getName = (data: T) => {
    if (data.name) return data.name;
    if (data.Nombre && data.Apellido) return `${data.Nombre} ${data.Apellido}`;
    return '';
  };

  const getAmount = (data: T) => {
    if (data.amount && data.currency) return `${data.amount} ${data.currency}`;
    if (data.monto) return `${data.monto}`;
    return '';
  };

  // Helper para verificar si un número es válido
  const isValidNumber = (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value);
  };

  // Determinar si hay algún pago móvil en la lista
  const hasPagoMovil = details?.some(
    (item) => item['tipo de pago'] === 'Pago Movil'
  );

  // Función para formatear moneda según el tipo de pago
  const formatCurrencyValue = (value: number) => {
    if (hasPagoMovil) {
      return formatCurrencyBolivares(value);
    } else {
      return usdFormatCurrency(value);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-50"></div>
      <div className="modal-container bg-white w-11/12 mx-auto rounded shadow-lg z-50">
        <div className="modal-content py-5 text-left px-10 overflow-y-auto">
          <div className="flex justify-between items-center pb-3">
            <h2 className="text-2xl font-bold green-text">
              Detalles de entrega
            </h2>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div>
              {details && details.length > 0 ? (
                <div className="overflow-y-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {columns.map((column, index) => (
                          <th
                            key={index}
                            className="font-bold py-1 text-center"
                          >
                            {column.label}
                          </th>
                        ))}
                        {enableGenerateInvoice && (
                          <th className="font-bold py-1 text-center">
                            Imprimir pago
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((item, index) => (
                        <tr
                          key={index}
                          className={item.isStaff ? '' : 'text-red-700'}
                        >
                          {columns.map((column, colIndex) => (
                            <td key={colIndex} className="text-center">
                              {column.key === 'statusPago' ? (
                                <select
                                  title="Estado del pago"
                                  className="py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 text-center text-xs"
                                  value={
                                    item.id !== undefined
                                      ? selectedPaymentStatuses[item.id] ||
                                        item[column.key]
                                      : item[column.key]
                                  }
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="PAID">PAID</option>
                                  <option value="CANCELED">CANCELED</option>
                                </select>
                              ) : (
                                String(item[column.key])
                              )}
                            </td>
                          ))}
                          {enableGenerateInvoice && (
                            <td className="text-center">
                              <Button onClick={() => generateInvoice(item)}>
                                <PrinterIcon />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="font-bold py-1 mb-4">
                  No hay detalles disponibles.
                </p>
              )}

              {summaryData &&
                (isValidNumber(summaryData.sumTotal) ||
                  isValidNumber(summaryData.sumPaid) ||
                  isValidNumber(summaryData.sumPending)) && (
                  <div className="mt-6 mb-4 p-4 border rounded">
                    <h3 className="text-lg font-bold mb-2">Resumen</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {isValidNumber(summaryData.sumTotal) && (
                        <div>
                          <p className="font-semibold">Total</p>
                          <p>
                            {formatCurrencyValue(Number(summaryData.sumTotal))}
                          </p>
                        </div>
                      )}
                      {isValidNumber(summaryData.sumPaid) && (
                        <div>
                          <p className="font-semibold">Pagado</p>
                          <p>
                            {formatCurrencyValue(Number(summaryData.sumPaid))}
                          </p>
                        </div>
                      )}
                      {isValidNumber(summaryData.sumPending) && (
                        <div>
                          <p className="font-semibold">Pendiente</p>
                          <p className="text-red-500">
                            {formatCurrencyValue(
                              Number(summaryData.sumPending)
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              <div className="flex justify-between mt-4">
                <Button
                  onClick={() =>
                    details && exportToXLSX(details, fileName || '')
                  }
                >
                  Descargar XLSX
                </Button>
                <Button onClick={onClose}>Cerrar</Button>
              </div>
            </div>
          )}
        </div>
        {invoiceData && (
          <div style={{ display: 'none' }}>
            <PrintInvoice
              ref={printRef}
              clientDetails={{
                name: getName(invoiceData),
                extraField: invoiceData.cedula
                  ? `Cédula: ${invoiceData.cedula}`
                  : '',
                id: invoiceData.id ? invoiceData.id.toString() : '',
              }}
              orderDetails={{
                items: [
                  {
                    label: 'Fecha del pago',
                    value: invoiceData.date || payload.selectedDate || '',
                  },
                  {
                    label: 'Sede',
                    value: invoiceData.sede || payload.selectedLocation || '',
                  },
                  {
                    label: 'Monto',
                    value: getAmount(invoiceData),
                  },
                  {
                    label: 'Tipo de Pago',
                    value:
                      invoiceData.paymentType ||
                      invoiceData['tipo de pago'] ||
                      '',
                  },
                ],
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
