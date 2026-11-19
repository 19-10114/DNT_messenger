import React from 'react';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import {
  SalesTargetDay,
  SalesTargetReport,
} from '@/services/salesTargets/types';
import {
  STATUS_COLORS,
  TARGET_COLORS,
  dailyRangeLabel,
  dayOfMonth,
  formatDecimal,
  formatInt,
  formatLongDay,
  formatPace,
  formatPct,
  formatShortDate,
  projectionSummary,
  COMPLIANCE_CAPTION,
  statusGapLabel,
} from '../salesTargets.utils';
import { TargetChartSvg } from './targetChartSvg';

const PAGE_PADDING = 28;
const CONTENT_WIDTH = 595.28 - PAGE_PADDING * 2;
const WEEKDAYS = [
  'LUNES',
  'MARTES',
  'MIÉRCOLES',
  'JUEVES',
  'VIERNES',
  'SÁBADO',
  'DOMINGO',
];

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: TARGET_COLORS.ink,
    paddingBottom: 18,
  },
  header: {
    backgroundColor: '#000000',
    paddingHorizontal: PAGE_PADDING,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { width: 110, height: 43 },
  headerRight: { alignItems: 'flex-end' },
  kicker: {
    color: TARGET_COLORS.brand,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  title: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 24,
    marginTop: 4,
  },
  stripe: { height: 4, backgroundColor: TARGET_COLORS.brand },
  body: { paddingHorizontal: PAGE_PADDING, paddingTop: 12 },
  row: { flexDirection: 'row' },
  bigCard: { flex: 1 },
  bigCardHead: {
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center',
    paddingVertical: 5,
  },
  bigCardBody: { alignItems: 'center', paddingVertical: 8 },
  bigNumber: { fontFamily: 'Helvetica-Bold', fontSize: 44 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  muted: { color: TARGET_COLORS.text },
  kpi: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 2.5,
    borderBottomColor: TARGET_COLORS.brand,
    alignItems: 'center',
    paddingVertical: 6,
  },
  kpiLabel: { fontFamily: 'Helvetica-Bold', fontSize: 6.5 },
  kpiValue: { fontFamily: 'Helvetica-Bold', fontSize: 17, marginVertical: 2 },
  kpiNote: { fontSize: 6.5, color: TARGET_COLORS.text },
  weekHead: {
    flex: 1,
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    textAlign: 'center',
    paddingVertical: 3,
    marginRight: 1,
  },
  cell: {
    flex: 1,
    height: 30,
    marginRight: 1,
    marginTop: 1,
    padding: 3,
    justifyContent: 'space-between',
  },
  cellTop: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: {
    marginTop: 8,
    borderTopWidth: 0.6,
    borderTopColor: TARGET_COLORS.grid,
    paddingTop: 5,
  },
});

/** Corta un texto largo con puntos suspensivos para que quepa en la casilla. */
const shorten = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

function cellBackground(
  day: SalesTargetDay,
  cutoff: string,
  hasTarget: boolean
) {
  if (!day.working) return '#f7f7f7';
  if (day.date > cutoff) return '#efefef';
  if (!hasTarget) return '#efefef';
  return (day.sold ?? 0) >= (day.dailyTarget ?? 0)
    ? STATUS_COLORS.green.bg
    : STATUS_COLORS.red.bg;
}

function Calendar({ report }: { report: SalesTargetReport }) {
  const hasTarget = report.target !== null;
  const cells: (SalesTargetDay | null)[] = [
    ...Array.from({ length: report.days[0].weekday - 1 }, () => null),
    ...report.days,
  ];
  while (cells.length % 7) cells.push(null);
  const weeks: (SalesTargetDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View>
      <View style={s.row}>
        {WEEKDAYS.map((name) => (
          <Text key={name} style={s.weekHead}>
            {name}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={s.row}>
          {week.map((day, d) =>
            day === null ? (
              <View key={d} style={[s.cell, { backgroundColor: '#ffffff' }]} />
            ) : (
              <View
                key={d}
                style={[
                  s.cell,
                  {
                    backgroundColor: cellBackground(
                      day,
                      report.cutoff,
                      hasTarget
                    ),
                  },
                ]}
              >
                <View style={s.cellTop}>
                  <Text
                    style={{
                      fontFamily: 'Helvetica-Bold',
                      fontSize: 9,
                      color: day.working ? TARGET_COLORS.ink : '#c4c4c4',
                    }}
                  >
                    {String(dayOfMonth(day.date))}
                  </Text>
                  {day.working && hasTarget ? (
                    <Text
                      style={{
                        fontFamily: 'Helvetica-Bold',
                        fontSize: 7,
                        color: TARGET_COLORS.brand,
                      }}
                    >
                      {`Meta ${day.dailyTarget}`}
                    </Text>
                  ) : !day.working && day.weekday !== 7 ? (
                    <Text style={{ fontSize: 6, color: TARGET_COLORS.text }}>
                      {shorten(day.reason || 'No hábil', 15)}
                    </Text>
                  ) : null}
                </View>
                <View style={s.cellTop}>
                  <Text style={{ fontSize: 6, color: TARGET_COLORS.text }}>
                    {day.working && hasTarget
                      ? `Acum. ${formatInt(day.cumulativeTarget)}`
                      : ''}
                  </Text>
                  {day.date <= report.cutoff &&
                  (day.working || (day.sold ?? 0) > 0) ? (
                    <Text
                      style={{
                        fontFamily: 'Helvetica-Bold',
                        fontSize: 6.5,
                        color:
                          hasTarget &&
                          day.working &&
                          (day.sold ?? 0) < (day.dailyTarget ?? 0)
                            ? STATUS_COLORS.red.fg
                            : TARGET_COLORS.ink,
                      }}
                    >
                      {`Vendido ${day.sold ?? 0}`}
                    </Text>
                  ) : null}
                </View>
              </View>
            )
          )}
        </View>
      ))}
    </View>
  );
}

interface SalesTargetDocumentProps {
  report: SalesTargetReport;
  /** URL absoluta del logo (PNG); react-pdf no acepta SVG como imagen. */
  logoSrc: string;
}

/**
 * El corte de la meta de una sucursal en una página A4, con la misma maqueta
 * que el PDF "Meta de ventas" que se hacía a mano.
 */
export function SalesTargetDocument({
  report,
  logoSrc,
}: SalesTargetDocumentProps) {
  const status = report.status ? STATUS_COLORS[report.status] : null;
  const projection = projectionSummary(report);
  const hasTarget = report.target !== null;
  const target = report.target?.units ?? 0;
  const soldPct = target ? Math.min(report.sold.units / target, 1) : 0;
  const markerPct = target
    ? Math.min((report.targetToDate?.units ?? 0) / target, 1)
    : 0;
  const barWidth = CONTENT_WIDTH;
  const scopeName = report.branch?.name ?? 'Todas las sucursales';
  const cutoffDayNumber = Number(report.cutoff.slice(8, 10));

  return (
    <Document
      title={`Meta de ventas ${report.monthLabel} - ${scopeName}`}
      author="Moto Candela"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoSrc} style={s.logo} />
          <View style={s.headerRight}>
            <Text style={s.kicker}>
              {`META DE VENTAS · ${report.monthLabel.toUpperCase()}`}
            </Text>
            <Text style={s.title}>{scopeName}</Text>
          </View>
        </View>
        <View style={s.stripe} />

        <View style={s.body}>
          <View style={s.row}>
            <View
              style={[
                s.bigCard,
                { backgroundColor: '#f2f2f2', marginRight: 14 },
              ]}
            >
              <Text style={s.bigCardHead}>META DEL MES</Text>
              <View style={s.bigCardBody}>
                <Text style={[s.bigNumber, { color: TARGET_COLORS.brand }]}>
                  {hasTarget ? formatInt(target) : '—'}
                </Text>
                <Text style={{ fontSize: 11 }}>motos</Text>
                <Text style={[s.muted, { marginTop: 3 }]}>
                  {`${report.workingDays.total} días hábiles${hasTarget ? ` · ${dailyRangeLabel(report)}` : ''}`}
                </Text>
              </View>
            </View>
            <View
              style={[s.bigCard, { backgroundColor: status?.bg ?? '#f2f2f2' }]}
            >
              <Text style={s.bigCardHead}>
                {`CUMPLIMIENTO AL ${formatLongDay(report.cutoff).toUpperCase()}`}
              </Text>
              <View style={s.bigCardBody}>
                <Text
                  style={[
                    s.bigNumber,
                    { color: status?.fg ?? TARGET_COLORS.text },
                  ]}
                >
                  {formatPct(report.compliancePct)}
                </Text>
                {hasTarget && (
                  <Text style={[s.muted, { fontSize: 7, marginBottom: 2 }]}>
                    {COMPLIANCE_CAPTION}
                  </Text>
                )}
                <Text
                  style={{
                    fontFamily: 'Helvetica-Bold',
                    fontSize: 10,
                    color: status?.fg ?? TARGET_COLORS.text,
                  }}
                >
                  {statusGapLabel(
                    report.sold.units,
                    report.targetToDate?.units,
                    report.workingDays.elapsed
                  )}
                </Text>
                <Text style={{ marginTop: 3 }}>
                  {`${formatInt(report.sold.units)} vendidas${report.targetToDate ? ` · la meta a esa fecha era ${formatInt(report.targetToDate.units)}` : ''}`}
                </Text>
              </View>
            </View>
          </View>

          {hasTarget && (
            <View style={{ marginTop: 12 }}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <Text style={s.sectionTitle}>Avance sobre la meta del mes</Text>
                <Text style={s.muted}>
                  {`${formatPct(report.progressPct)} de la meta · día hábil ${report.workingDays.elapsed} de ${report.workingDays.total}`}
                </Text>
              </View>
              <View style={{ height: 14, position: 'relative' }}>
                {report.workingDays.elapsed > 0 && (
                  <Text
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: Math.min(
                        Math.max(barWidth * markerPct - 38, 0),
                        barWidth - 80
                      ),
                      fontFamily: 'Helvetica-Bold',
                      fontSize: 7,
                    }}
                  >
                    {`Meta al día ${cutoffDayNumber}: ${formatInt(report.targetToDate?.units)}`}
                  </Text>
                )}
              </View>
              <View
                style={{
                  position: 'relative',
                  height: 18,
                  backgroundColor: '#dddddd',
                }}
              >
                <View
                  style={{
                    width: barWidth * soldPct,
                    height: 18,
                    backgroundColor: TARGET_COLORS.brand,
                  }}
                />
                {report.workingDays.elapsed > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      left: barWidth * markerPct,
                      top: 0,
                      width: 1.2,
                      height: 22,
                      backgroundColor: TARGET_COLORS.ink,
                    }}
                  />
                )}
              </View>
              <View
                style={[
                  s.row,
                  { justifyContent: 'space-between', marginTop: 4 },
                ]}
              >
                <Text
                  style={{
                    fontFamily: 'Helvetica-Bold',
                    color: TARGET_COLORS.brand,
                  }}
                >
                  {`Vendido: ${formatInt(report.sold.units)}`}
                </Text>
                <Text>{`Meta del mes: ${formatInt(target)}`}</Text>
              </View>
            </View>
          )}

          <View style={[s.row, { marginTop: 10 }]}>
            {[
              {
                label: 'FALTAN PARA LA META',
                value: formatInt(report.remainingUnits),
                note: 'motos',
              },
              {
                label: 'RITMO NECESARIO',
                value: formatPace(report.requiredPace),
                note: `motos por día · quedan ${report.workingDays.remaining} días`,
                color: TARGET_COLORS.brand,
              },
              {
                label: 'RITMO ACTUAL',
                value: formatPace(report.currentPace),
                note: 'motos por día',
              },
              {
                label: 'CIERRE PROYECTADO',
                value: formatInt(projection.units),
                note:
                  projection.pct !== null
                    ? `motos · ${formatPct(projection.pct)} · ${projection.label}`
                    : `motos · ${projection.label}`,
                color:
                  projection.pct !== null && projection.pct < 100
                    ? STATUS_COLORS.red.fg
                    : TARGET_COLORS.ink,
              },
            ].map((kpi, index) => (
              <View
                key={kpi.label}
                style={[s.kpi, index < 3 ? { marginRight: 8 } : {}]}
              >
                <Text style={s.kpiLabel}>{kpi.label}</Text>
                <Text
                  style={[
                    s.kpiValue,
                    { color: kpi.color ?? TARGET_COLORS.ink },
                  ]}
                >
                  {kpi.value}
                </Text>
                <Text style={s.kpiNote}>{kpi.note}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={s.sectionTitle}>
              Venta acumulada vs. meta acumulada
            </Text>
            <Text style={[s.muted, { fontSize: 6.5, marginTop: 2 }]}>
              {`Discontinua: meta acumulada · punteada: proyección ${projection.label} · continua: venta acumulada`}
            </Text>
            <TargetChartSvg
              report={report}
              width={CONTENT_WIDTH}
              height={150}
            />
          </View>

          <View style={{ marginTop: 6 }}>
            <View
              style={[
                s.row,
                { justifyContent: 'space-between', marginBottom: 3 },
              ]}
            >
              <Text style={s.sectionTitle}>Meta día a día</Text>
              <Text style={[s.muted, { fontSize: 6.5 }]}>
                Cada casilla: meta del día · meta acumulada · lo vendido
              </Text>
            </View>
            <Calendar report={report} />
          </View>

          <View style={s.footer}>
            <Text style={{ fontSize: 7.5 }}>
              {report.target?.usd
                ? `Referencia en USD:  meta del mes ${formatInt(report.target.usd)}  ·  vendido ${formatInt(report.sold.usd)}  ·  ${formatPct(report.usdCompliancePct)} de la meta en USD a la fecha de corte`
                : `Vendido en USD: ${formatInt(report.sold.usd)}`}
            </Text>
            {projection.other && (
              <Text style={[s.muted, { fontSize: 6.5, marginTop: 2 }]}>
                {`Proyección ${projection.other.label}: ${formatInt(projection.other.units)} motos.`}
              </Text>
            )}
            <Text style={[s.muted, { fontSize: 6.5, marginTop: 2 }]}>
              Cumplimiento = motos vendidas ÷ meta acumulada a la fecha de
              corte. Verde: 100 % o más · amarillo: 85 a 99 % · rojo: menos de
              85 %.
            </Text>
            <Text style={[s.muted, { fontSize: 6.5, marginTop: 2 }]}>
              {`Corte: ${formatShortDate(report.cutoff)}. Días hábiles de lunes a sábado. Proyección de cierre ${projection.label}, con ${report.workingDays.elapsed} días hábiles transcurridos.`}
            </Text>
            <Text
              style={{
                fontFamily: 'Helvetica-Bold',
                fontSize: 6.5,
                textAlign: 'center',
                marginTop: 4,
                color: TARGET_COLORS.text,
              }}
            >
              Moto Candela · Concesionario oficial Empire Keeway
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
