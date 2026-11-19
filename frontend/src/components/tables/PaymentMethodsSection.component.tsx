'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, usdFormatCurrency } from '@/lib/utils';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import { PaymentMethodTotal } from '@/services/transactions/types/PartsReport.type';

const DEFAULT_STORAGE_KEY = 'partsReportPaymentMethodsExpanded';

const PAYMENT_LABELS: Record<string, string> = {
  pago_movil: 'Pago Móvil',
  punto_de_venta: 'Punto de Venta',
  efectivo_bs: 'Efectivo Bs',
  transferencia: 'Transferencia',
  efectivo_usd: 'Efectivo USD',
  zelle: 'Zelle',
  binance: 'Binance',
  abono: 'Abono',
};
const USD_PAYMENT_TYPES = ['efectivo_usd', 'zelle', 'binance'];
// El abono se registra siempre en USD (currency: 'USD', amount_bs: 0 en el
// 100% de los casos verificados en producción), pero se muestra aparte —
// ni en el grupo/total de USD ni en el de Bs.
const ABONO_TYPE = 'abono';

const formatBs = (amount: number) =>
  `${amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Bs`;

/**
 * Desglose de métodos de pago del reporte de repuestos: colapsado por
 * defecto (para no competir con los 4 KPIs principales) y persistido en
 * localStorage para que el usuario no tenga que reabrirlo cada vez.
 */
export function PaymentMethodsSection({
  paymentKpis,
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  paymentKpis: PaymentMethodTotal[];
  /** Dónde se recuerda si está abierto; cada pantalla puede tener el suyo. */
  storageKey?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  // Se lee en un efecto (no en el useState inicial) para no desincronizar el
  // render de servidor/cliente: localStorage no existe durante el SSR.
  useEffect(() => {
    try {
      setExpanded(localStorage.getItem(storageKey) === 'true');
    } catch {
      // Modo privado / storage deshabilitado: se queda colapsado.
    }
  }, [storageKey]);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // Nada que persistir si el storage no está disponible.
      }
      return next;
    });
  };

  // La moneda de la fila manda cuando viene; si no, la deduce el tipo.
  const isUsd = (pm: PaymentMethodTotal) =>
    pm.currency ? pm.currency === 'USD' : USD_PAYMENT_TYPES.includes(pm.type);
  const usdEntries = paymentKpis
    .filter((pm) => isUsd(pm) && pm.type !== ABONO_TYPE)
    .sort((a, b) => b.total - a.total);
  const bsEntries = paymentKpis
    .filter((pm) => !isUsd(pm) && pm.type !== ABONO_TYPE)
    .sort((a, b) => b.total - a.total);
  const abonoEntry = paymentKpis.find((pm) => pm.type === ABONO_TYPE);
  const usdTotal = usdEntries.reduce((sum, pm) => sum + pm.total, 0);
  const bsTotal = bsEntries.reduce((sum, pm) => sum + pm.total, 0);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={
          expanded
            ? 'Ocultar desglose de métodos de pago'
            : 'Mostrar desglose de métodos de pago'
        }
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 hover:text-gray-700"
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            expanded ? 'rotate-0' : '-rotate-90'
          )}
        />
        Desglose de Métodos de Pago
      </button>

      <div
        className={cn(
          'transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden',
          expanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {/* Mismo tamaño que los 4 KPIs principales de arriba */}
        <div className="grid gap-3 mb-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <KpiCardMain
            label="USD Total"
            value={usdFormatCurrency(usdTotal)}
            tone="green"
          />
          <KpiCardMain
            label="Bs Total"
            value={formatBs(bsTotal)}
            tone="brown"
          />
        </div>

        {/* Separados por moneda: nunca mezclar montos USD y Bs en una misma
            lista, ya que su escala numérica no es comparable. */}
        {usdEntries.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Métodos en USD
            </h4>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {usdEntries.map((pm) => (
                <KpiCardMain
                  key={`${pm.type}-${pm.currency ?? ''}`}
                  label={PAYMENT_LABELS[pm.type] ?? pm.type}
                  value={usdFormatCurrency(pm.total)}
                  subtitle={`${usdTotal > 0 ? ((pm.total / usdTotal) * 100).toFixed(1) : '0.0'}% del total`}
                  tone="green"
                />
              ))}
            </div>
          </div>
        )}

        {bsEntries.length > 0 && (
          <div className={abonoEntry ? 'mb-3' : undefined}>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Métodos en Bs
            </h4>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {bsEntries.map((pm) => (
                <KpiCardMain
                  key={`${pm.type}-${pm.currency ?? ''}`}
                  label={PAYMENT_LABELS[pm.type] ?? pm.type}
                  value={formatBs(pm.total)}
                  subtitle={`${bsTotal > 0 ? ((pm.total / bsTotal) * 100).toFixed(1) : '0.0'}% del total`}
                  tone="brown"
                />
              ))}
            </div>
          </div>
        )}

        {/* Aparte: aunque se registra en USD, no es un "método de pago" más
            (es un cobro diferido/a crédito) — no suma al total ni al grupo de USD ni de Bs. */}
        {abonoEntry && (
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Abono
            </h4>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <KpiCardMain
                label={PAYMENT_LABELS[abonoEntry.type] ?? abonoEntry.type}
                value={usdFormatCurrency(abonoEntry.total)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
