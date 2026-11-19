import {
  ARRANCA_BALANCE_DIRECTION_LABELS,
  ARRANCA_BALANCE_KIND_LABELS,
  ARRANCA_BALANCE_ORIGIN_LABELS,
  ARRANCA_BALANCE_STATUS_LABELS,
  getArrancaBalanceResponsibleName,
} from '@/components/arrancaBalance/arrancaBalance.utils';
import { GPS_STATUS_LABELS } from '@/components/gps/gps.utils';
import {
  ArrancaMcFeedRow,
  ArrancaMcSummary,
} from '@/services/arrancaMcReport/types';
import { formatDateTime } from './arrancaMcReport.utils';

type Cell = string | number;

const branchLabel = (branch: number | null, branchName: string) =>
  branchName || (branch === null ? 'Sin sucursal' : `Sucursal #${branch}`);

/**
 * El reporte en un libro de Excel: el resumen, los movimientos con los filtros
 * de la página y los GPS sin instalar. Los montos van como números con signo
 * —positivo a favor de Moto Candela— para que se puedan sumar en la hoja.
 *
 * `xlsx` se carga bajo demanda: sólo quien exporta lo descarga.
 */
export async function exportArrancaMcReport(
  summary: ArrancaMcSummary,
  feed: ArrancaMcFeedRow[],
  scopeName: string
) {
  const XLSX = await import('xlsx');
  const { balance, cashCloses, bikes, gps } = summary;

  const resumen: Cell[][] = [
    ['Reporte Arranca - MC'],
    ['Perspectiva', 'Moto Candela (positivo = a favor de Moto Candela)'],
    ['Sucursal', scopeName],
    ['Desde', summary.startDate],
    ['Hasta', summary.endDate],
    ['Generado', formatDateTime(summary.generatedAt)],
    [],
    ['Balance', 'Monto'],
    ['Balance neto aprobado al cierre', balance.net],
    ['Balance al inicio del período', balance.opening],
    ['Aprobado a favor de Moto Candela en el período', balance.sent],
    ['Aprobado a favor de Arranca en el período', balance.received],
    ['Neto del período', balance.periodNet],
    ['Pendiente por aprobar (neto)', balance.pending.net],
    ['Balance proyectado con pendientes', balance.projectedNet],
    ['Pendientes que decide Moto Candela', balance.pending.awaitingUs.count],
    ['Pendientes que decide Arranca', balance.pending.awaitingPartner.count],
    ['Rechazados en el período', balance.declined.count],
    ['Tiempo medio de aprobación (h)', balance.decisions.averageHours ?? ''],
    [],
    [
      'Por tipo',
      'Aprobados',
      'A favor de MC',
      'A favor de Arranca',
      'Neto',
      'Pendientes',
      'Pendiente neto',
    ],
    ...summary.byKind.map((row) => [
      ARRANCA_BALANCE_KIND_LABELS[row.kind] ?? row.kind,
      row.count,
      row.sent,
      row.received,
      row.net,
      row.pendingCount,
      row.pendingNet,
    ]),
    [],
    [
      'Por sucursal',
      'Balance',
      'Neto del período',
      'Pendientes',
      'Pendiente neto',
    ],
    ...summary.byBranch.map((row) => [
      branchLabel(row.branch, row.branchName),
      row.net,
      row.periodNet,
      row.pendingCount,
      row.pendingNet,
    ]),
    [],
    [
      'Cierres de caja',
      'Cantidad',
      'Total',
      'Promedio',
      'Aprobado',
      'Pendiente',
    ],
    [
      'Período',
      cashCloses.count,
      cashCloses.total,
      cashCloses.average,
      cashCloses.approvedTotal,
      cashCloses.pendingTotal,
    ],
    ...cashCloses.byBranch.map((row) => [
      branchLabel(row.branch, row.branchName),
      row.count,
      row.total,
      '',
      '',
      '',
    ]),
    [],
    ['Motos', 'Cantidad', 'Aprobado', 'Pendiente'],
    [
      'Entregadas a Arranca',
      bikes.sales.count,
      bikes.sales.approvedAmount,
      bikes.sales.pendingAmount,
    ],
    [
      'Devueltas',
      bikes.returns.count,
      bikes.returns.approvedAmount,
      bikes.returns.pendingAmount,
    ],
    ['Entregadas (total histórico)', bikes.units.total],
    ['Entregadas en el período', bikes.units.inRange],
    ['Con GPS', bikes.units.withGps],
    [],
    ['GPS', 'Cantidad'],
    ['Total del parque', gps.total],
    ['Recibidos de Arranca, en Moto Candela', gps.withPartner.total],
    [`Sin instalar hace ${gps.stale.days}+ días`, gps.stale.count],
  ];

  const movimientos: Cell[][] = [
    [
      'Fecha',
      'Tipo',
      'Concepto',
      'Referencia',
      'Sucursal',
      'Sentido',
      'Monto',
      'Monto con signo',
      'Estado',
      'Saldo acumulado',
      'Creado en',
      'Responsable',
      'Decidido',
      'Observaciones',
      'Sync ID',
    ],
    ...feed.map((row) => [
      formatDateTime(row.createdAt),
      ARRANCA_BALANCE_KIND_LABELS[row.kind] ?? row.kind,
      row.concept,
      // Una moto va como "placa - modelo"; el chasis solo si no se encontró.
      row.bikeLabel ?? row.reference,
      row.branch?.name ?? 'Sin sucursal',
      ARRANCA_BALANCE_DIRECTION_LABELS[row.direction] ?? row.direction,
      row.amount,
      row.signedAmount,
      ARRANCA_BALANCE_STATUS_LABELS[row.status] ?? row.status,
      row.runningBalance ?? '',
      ARRANCA_BALANCE_ORIGIN_LABELS[row.origin] ?? row.origin,
      getArrancaBalanceResponsibleName(row),
      row.decidedAt ? formatDateTime(row.decidedAt) : '',
      row.observations,
      row.syncId,
    ]),
  ];

  const gpsSheet: Cell[][] = [
    ['IMEI', 'Número', 'Estado', 'Sucursal', 'Recibido', 'Días'],
    ...gps.aging.map((unit) => [
      unit.imei,
      unit.number,
      GPS_STATUS_LABELS[unit.status] ?? unit.status,
      branchLabel(unit.branch, unit.branchName),
      unit.sentAt ? formatDateTime(unit.sentAt) : '',
      unit.days,
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(resumen),
    'Resumen'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(movimientos),
    'Movimientos'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(gpsSheet),
    'GPS sin instalar'
  );
  XLSX.writeFile(
    workbook,
    `arranca-mc_${summary.startDate}_${summary.endDate}.xlsx`
  );
}
