'use client';

import { useState, useRef, useEffect } from 'react';
import { useToken } from '@/stores/auth/auth.store';
import { formatCurrencyBolivares } from '@/lib/utils';
import Link from 'next/link';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useRoles } from '@/stores/auth/auth.store';

export function ExchangeRate() {
  const token = useToken();
  const roles = useRoles();
  const {
    rate,
    usdtRate,
    lastUpdated,
    date,
    isLoading,
    updateUsdtRate,
    isUpdating,
  } = useExchangeRate(token?.toString() || '');
  const canSeeButton = [
    'admin',
    'administrator',
    'manager',
    'parts_admin',
  ].some((role) => roles.includes(role));
  const [open, setOpen] = useState(false);
  const [newRate, setNewRate] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (isLoading)
    return <div className="text-sm text-neutral-400">Cargando tasa...</div>;

  const formattedDate = date
    ? date.split('-').reverse().join('/')
    : new Date().toLocaleDateString('es-VE');

  return (
    <div className="flex h-9 items-center gap-1 rounded-full bg-white/10 p-1 pl-1">
      {/* Botón Actualizar USDT */}
      {canSeeButton && (
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            title="Actualizar la tasa USDT"
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-neutral-200 transition-colors hover:bg-secondary hover:text-white"
          >
            USDT
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
              <div className="mb-3 text-center justify-center">
                <p className="text-xs text-gray-700 uppercase font-medium">
                  Tasa Actual USDT
                </p>
                <p className="text-lg font-bold text-secondary">
                  {usdtRate} Bs
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Última actualización
                </p>
                <p className="text-xs text-gray-500">{lastUpdated}</p>
              </div>
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="Coloque la nueva tasa"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateUsdtRate(parseFloat(newRate), {
                      onSuccess: () => {
                        setOpen(false);
                        setNewRate('');
                      },
                    });
                  }}
                  disabled={!newRate || isUpdating}
                  className="flex-1 bg-orange-50 text-orange-600 border border-orange-400 text-xs font-medium py-1.5 rounded-lg hover:bg-secondary hover:text-white hover:border-secondary transition-colors outline-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setNewRate('');
                  }}
                  className="flex-1 border border-gray-300 text-gray-600 text-xs font-medium py-1.5 rounded-lg bg-gray-100 hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tasa BCV */}
      <div className="flex items-center">
        <Link
          href={'https://www.bcv.org.ve/'}
          target="_blank"
          rel="noopener noreferrer"
          title={`Tasa BCV del ${formattedDate}`}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            BCV
          </span>
          {formatCurrencyBolivares(Number(rate))}
        </Link>
      </div>
    </div>
  );
}
