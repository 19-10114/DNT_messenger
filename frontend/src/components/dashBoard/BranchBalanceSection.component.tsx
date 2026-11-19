import React, { useState } from 'react';
import Link from 'next/link';
import { usdFormatCurrency } from '@/lib/utils';
import { BRANCH_DEBT, BRANCH_CASH } from '@/constants/routes';
import { ClientBonusData } from '@/services/transactions/types/ClientBonus.type';
import { InventoryValueChart } from '../modals/InventoryValueChart.component';
import { useInventoryValue } from '@/hooks/useTransactions';
import { useToken } from '@/stores/auth/auth.store';

interface BranchBalanceSectionProps {
  branchBalance: any;
  branchId: number | undefined;
  branchCash: any;
  branchTotalDebt: any;
  isLoadingBalance: boolean;
  isLoadingCash: boolean;
  isLoadingTotalDebt: boolean;
  isErrorBalance: boolean;
  isErrorCash: boolean;
  isErrorTotalDebt: boolean;
  getTotalDebtData: () => any[];
  regularClientBonus: any;
  isLoadingRegularBonus: boolean;
  isErrorRegularBonus: boolean;
  onRegularBonusClick: () => void;
  allyClientBonus: ClientBonusData | undefined;
  isLoadingAllyBonus: boolean;
  isErrorAllyBonus: boolean;
  onAllyBonusClick: () => void;
  isSuperuser?: boolean;
}

export function BranchBalanceSection({
  branchBalance,
  branchId,
  branchCash,
  branchTotalDebt,
  isLoadingBalance,
  isLoadingCash,
  isLoadingTotalDebt,
  isErrorBalance,
  isErrorCash,
  isErrorTotalDebt,
  regularClientBonus,
  isLoadingRegularBonus,
  isErrorRegularBonus,
  onRegularBonusClick,
  allyClientBonus,
  isLoadingAllyBonus,
  isErrorAllyBonus,
  onAllyBonusClick,
  isSuperuser,
  // getTotalDebtData,
}: BranchBalanceSectionProps): JSX.Element {
  const [showInventoryChart, setShowInventoryChart] = useState(false);
  const token = useToken();
  const { data: inventoryValues, isLoading: isLoadingInventory } =
    useInventoryValue(token);

  // Mostrar loading si cualquiera de los datos está cargando
  if (isLoadingBalance || isLoadingCash || isLoadingTotalDebt) {
    return <div>Cargando datos de balance...</div>;
  }

  // Mostrar error si cualquiera de los datos tiene error
  if (isErrorBalance || isErrorCash || isErrorTotalDebt) {
    return (
      <div className="text-red-500">Error al cargar los datos de balance</div>
    );
  }

  // Si no hay datos de balance, no mostrar nada
  if (!branchBalance) {
    return <div>No hay datos de balance disponibles</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Monto Comprado</h3>
          <p className="text-2xl font-bold text-primary">
            {usdFormatCurrency(branchBalance.boughtAmount)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Monto Vendido</h3>
          <p className="text-2xl font-bold text-primary">
            {usdFormatCurrency(branchBalance.soldAmount)}
          </p>
        </div>
        <div
          onClick={() => {
            if (branchId === 0) {
              setShowInventoryChart(true);
            }
          }}
          className={`bg-white p-4 rounded-lg shadow ${branchId === 0 ? 'cursor-pointer hover:shadow-md transition' : ''}`}
        >
          <h3 className="text-lg font-medium mb-2">
            Monto en Inventario (Motos)
          </h3>
          <p className="text-2xl font-bold text-primary">
            {usdFormatCurrency(branchBalance.bikeInventoryAmount)}
          </p>
        </div>

        <div
          onClick={() => {
            if (branchId === 0) {
              setShowInventoryChart(true);
            }
          }}
          className={`bg-white p-4 rounded-lg shadow ${branchId === 0 ? 'cursor-pointer hover:shadow-md transition' : ''}`}
        >
          <h3 className="text-lg font-medium mb-2">
            Monto en Inventario (Repuestos)
          </h3>
          <p className="text-2xl font-bold text-primary">
            {usdFormatCurrency(branchBalance.partInventoryAmount)}
          </p>
        </div>
        <Link
          href={BRANCH_CASH}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
        >
          <h3 className="text-lg font-medium mb-2">Efectivo en Sucursal</h3>
          <p className="text-2xl font-bold text-primary">
            {branchCash ? usdFormatCurrency(branchCash.cash) : 'Cargando...'}
          </p>
        </Link>
        <Link
          href={BRANCH_DEBT}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
        >
          <h3 className="text-lg font-medium mb-2">Deuda Total</h3>
          <p className="text-2xl font-bold text-primary">
            {branchTotalDebt
              ? usdFormatCurrency(branchTotalDebt.total)
              : 'Cargando...'}
          </p>
        </Link>
        {isSuperuser && (
          <>
            <div
              onClick={onRegularBonusClick}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
            >
              <h3 className="text-lg font-medium mb-2">Abono Regular</h3>
              <p className="text-2xl font-bold text-primary">
                {isLoadingRegularBonus
                  ? 'Cargando...'
                  : isErrorRegularBonus
                    ? 'Error'
                    : regularClientBonus
                      ? usdFormatCurrency(
                          regularClientBonus.staticData?.total || 0
                        )
                      : '$0.00'}
              </p>
            </div>
            <div
              onClick={onAllyBonusClick}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
            >
              <h3 className="text-lg font-medium mb-2">Abono Aliado</h3>
              <p className="text-2xl font-bold text-primary">
                {isLoadingAllyBonus
                  ? 'Cargando...'
                  : isErrorAllyBonus
                    ? 'Error'
                    : allyClientBonus
                      ? usdFormatCurrency(
                          allyClientBonus.staticData?.total || 0
                        )
                      : '$0.00'}
              </p>
            </div>
          </>
        )}
      </div>
      {
        //THIS WAS COMMENTED OUT BECAUSE THERE IS A NEW TABLE IN DEBT PAGE
        /* {branchTotalDebt && (
        <TotalDebtTable
          debtData={getTotalDebtData()}
          totalDebt={branchTotalDebt.total}
        />
      )} */
      }
      <InventoryValueChart
        isOpen={showInventoryChart}
        onClose={() => setShowInventoryChart(false)}
        data={inventoryValues}
        isLoading={isLoadingInventory}
      />
    </>
  );
}
