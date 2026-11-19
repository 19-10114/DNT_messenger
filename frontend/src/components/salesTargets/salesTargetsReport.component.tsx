'use client';

import { useState } from 'react';
import { FileDown, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  MonthSelect,
  currentMonthInCaracas,
} from '@/components/ui/monthSelect.component';
import { useToast } from '@/components/ui/use-toast';
import { useAllBranches } from '@/hooks/useAllBranches';
import {
  useSalesTargetOverview,
  useSalesTargetReport,
} from '@/hooks/salesTargets';
import { useRoles } from '@/stores/auth/auth.store';
import {
  useBranchActions,
  useBranches,
  useCurrentBranchId,
} from '@/stores/branch/branch.store';
import { TargetDetail } from './targetDetail.component';
import { TargetsConfigModal } from './targetsConfigModal.component';
import { TargetsOverview } from './targetsOverview.component';

/** `0` es el modo "Super admin" de la barra: la vista general. */
const ALL_BRANCHES = 0;

function LoadingTiles() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
        />
      ))}
    </div>
  );
}

function ErrorBox() {
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      No se pudo cargar el reporte. Prueba con &quot;Actualizar&quot;.
    </p>
  );
}

function NotInReport({ name }: { name: string }) {
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {name} no participa en las metas de ventas. Elige una sede de venta en la
      barra izquierda, o &quot;Super admin&quot; para ver todas.
    </p>
  );
}

/**
 * Metas de ventas. La sucursal es la de la barra izquierda: en modo "Super
 * admin" (`0`) se ve la vista general de todas; con una sucursal elegida, su
 * detalle día a día como el PDF "Meta de ventas", que se puede descargar.
 */
export function SalesTargetsReport() {
  const { toast } = useToast();
  const roles = useRoles();
  const currentBranchId = useCurrentBranchId();
  const sidebarBranches = useBranches();
  const { setCurrentBranch } = useBranchActions();
  const { data: reportBranches } = useAllBranches();

  /** Solo el rol `admin` escribe metas, igual que en el backend. */
  const canEdit = roles.includes('admin');

  const [month, setMonth] = useState(currentMonthInCaracas);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const branchId = currentBranchId ?? ALL_BRANCHES;
  const branchName =
    branchId === ALL_BRANCHES
      ? 'Todas las sucursales'
      : (sidebarBranches.find((branch) => branch.id === branchId)?.name ??
        reportBranches?.find((branch) => branch.id === branchId)?.name ??
        `Sucursal #${branchId}`);
  // Cuentas de venta, proveedor, Arranca…: el backend respondería 400.
  const isOutOfReport =
    branchId !== ALL_BRANCHES &&
    !!reportBranches &&
    !reportBranches.some((branch) => branch.id === branchId);

  /** Abrir una sede desde la vista general la elige también en la barra. */
  const openBranch = (id: number) => {
    const branch = sidebarBranches.find((item) => item.id === id);
    if (branch) setCurrentBranch(branch.id, branch.type);
  };

  const isOverview = branchId === ALL_BRANCHES;
  const {
    salesTargetOverview: overview,
    isLoadingSalesTargetOverview,
    isErrorSalesTargetOverview,
  } = useSalesTargetOverview(month, undefined, {
    enabled: isOverview,
  });
  const {
    salesTargetReport: report,
    isLoadingSalesTargetReport,
    isErrorSalesTargetReport,
  } = useSalesTargetReport(
    { branchId, month },
    { enabled: !isOverview && !isOutOfReport && !!reportBranches }
  );

  const detailReady = !isOverview && report && report.branch?.id === branchId;

  const downloadPdf = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      const { exportSalesTargetPdf } = await import('./exportSalesTargetPdf');
      await exportSalesTargetPdf(report);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo generar el PDF',
        description: (error as Error)?.message || 'Intenta de nuevo.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <label className="grid gap-1 text-xs font-medium text-gray-500">
          Mes
          <MonthSelect
            value={month}
            onValueChange={setMonth}
            className="lg:w-48"
          />
        </label>

        <div className="flex flex-wrap gap-2 lg:ml-auto">
          {canEdit && (
            <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar metas
            </Button>
          )}
          {!isOverview && !isOutOfReport && (
            <Button
              onClick={downloadPdf}
              disabled={!detailReady || isExporting}
              title="Descarga el corte de esta sucursal con los filtros actuales"
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExporting ? 'Generando…' : 'Descargar PDF'}
            </Button>
          )}
        </div>
      </div>

      {isOverview ? (
        isErrorSalesTargetOverview && !overview ? (
          <ErrorBox />
        ) : isLoadingSalesTargetOverview || !overview ? (
          <LoadingTiles />
        ) : (
          <TargetsOverview overview={overview} onSelectBranch={openBranch} />
        )
      ) : isOutOfReport ? (
        <NotInReport name={branchName} />
      ) : isErrorSalesTargetReport && !report ? (
        <ErrorBox />
      ) : isLoadingSalesTargetReport || !detailReady ? (
        <LoadingTiles />
      ) : (
        <TargetDetail
          report={report}
          isAdmin={canEdit}
          onConfigure={() => setIsConfigOpen(true)}
        />
      )}

      {canEdit && (
        <TargetsConfigModal
          open={isConfigOpen}
          onOpenChange={setIsConfigOpen}
          initialMonth={month}
        />
      )}
    </div>
  );
}
