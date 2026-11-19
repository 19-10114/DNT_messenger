import React from 'react';
import { Circle, Line, Polyline, Rect, Svg, Text } from '@react-pdf/renderer';

import { SalesTargetReport } from '@/services/salesTargets/types';
import {
  STATUS_COLORS,
  TARGET_COLORS,
  chartDays,
  cutoffDay,
  dayOfMonth,
  formatInt,
} from '../salesTargets.utils';

interface TargetChartSvgProps {
  report: SalesTargetReport;
  width: number;
  height: number;
}

const PAD = { left: 30, right: 34, top: 14, bottom: 18 };

/** Redondea hacia arriba al siguiente múltiplo "bonito" para el eje Y. */
const niceMax = (value: number) => {
  if (value <= 10) return 10;
  const step = value <= 100 ? 10 : value <= 500 ? 50 : 100;
  return Math.ceil(value / step) * step;
};

/**
 * "Venta acumulada vs. meta acumulada" dibujado con primitivas de react-pdf:
 * vectorial y sin depender de que el gráfico de pantalla exista. Muestra la
 * meta, lo vendido hasta el corte y la proyección principal.
 */
export function TargetChartSvg({ report, width, height }: TargetChartSvgProps) {
  const days = chartDays(report);
  if (!days.length) return null;

  const pivot = cutoffDay(report);
  const pivotIndex = pivot ? days.indexOf(pivot) : -1;
  const soldAtPivot = pivot?.cumulativeSold ?? 0;
  const key =
    report.projection.primary === 'historical'
      ? 'projectedHistorical'
      : 'projectedPace';
  const projectedEnd = days[days.length - 1][key];

  const maxValue = Math.max(
    report.target?.units ?? 0,
    projectedEnd ?? 0,
    soldAtPivot,
    1
  );
  const yMax = niceMax(maxValue);
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left + (days.length === 1 ? 0 : (index / (days.length - 1)) * plotW);
  const y = (value: number) => PAD.top + plotH - (value / yMax) * plotH;
  const points = (values: (number | null)[]) =>
    values
      .map((value, index) =>
        value === null ? null : `${x(index).toFixed(1)},${y(value).toFixed(1)}`
      )
      .filter(Boolean)
      .join(' ');

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));
  const targetValues = days.map((day) => day.cumulativeTarget);
  const soldValues = days.map((day, index) =>
    index <= pivotIndex ? day.cumulativeSold : null
  );
  const projectionValues = days.map((day, index) => {
    if (pivotIndex < 0 || index < pivotIndex) return null;
    return index === pivotIndex ? soldAtPivot : day[key];
  });
  const lastIndex = days.length - 1;
  const labelStyle = { fontSize: 7, fontFamily: 'Helvetica' };
  const boldStyle = { fontSize: 8, fontFamily: 'Helvetica-Bold' };

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {ticks.map((tick) => (
        <React.Fragment key={tick}>
          <Line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke={TARGET_COLORS.grid}
            strokeWidth={0.6}
          />
          <Text
            x={PAD.left - 4}
            y={y(tick) + 2.5}
            fill={TARGET_COLORS.text}
            textAnchor="end"
            style={labelStyle}
          >
            {String(tick)}
          </Text>
        </React.Fragment>
      ))}
      {days.map((day, index) => (
        <Text
          key={day.date}
          x={x(index)}
          y={height - 5}
          fill={TARGET_COLORS.text}
          textAnchor="middle"
          style={{ ...labelStyle, fontSize: 6 }}
        >
          {String(dayOfMonth(day.date)).padStart(2, '0')}
        </Text>
      ))}

      {report.target && (
        <Polyline
          points={points(targetValues)}
          fill="none"
          stroke={TARGET_COLORS.target}
          strokeWidth={1.4}
          strokeDasharray="5,3"
        />
      )}
      {pivotIndex >= 0 && projectedEnd !== null && (
        <Polyline
          points={points(projectionValues)}
          fill="none"
          stroke={TARGET_COLORS.brandLight}
          strokeWidth={1.4}
          strokeDasharray="2,2"
        />
      )}
      {pivotIndex >= 0 && (
        <Polyline
          points={points(soldValues)}
          fill="none"
          stroke={TARGET_COLORS.brand}
          strokeWidth={2.6}
        />
      )}
      {soldValues.map((value, index) =>
        value === null ? null : (
          <Circle
            key={index}
            cx={x(index)}
            cy={y(value)}
            r={2}
            fill={TARGET_COLORS.brand}
          />
        )
      )}

      {pivotIndex >= 0 && report.targetToDate && (
        <>
          <Rect
            x={x(pivotIndex) - 3}
            y={y(report.targetToDate.units) - 3}
            width={6}
            height={6}
            fill={TARGET_COLORS.ink}
          />
          <Text
            x={x(pivotIndex)}
            y={y(report.targetToDate.units) - 7}
            fill={TARGET_COLORS.ink}
            textAnchor="middle"
            style={boldStyle}
          >
            {`Meta ${formatInt(report.targetToDate.units)}`}
          </Text>
        </>
      )}
      {pivotIndex >= 0 && (
        <Text
          x={x(pivotIndex) + 6}
          y={y(soldAtPivot) + 10}
          fill={TARGET_COLORS.brand}
          style={boldStyle}
        >
          {`Vendido ${formatInt(report.sold.units)}`}
        </Text>
      )}
      {report.target && (
        <Text
          x={x(lastIndex) + 4}
          y={y(report.target.units) + 3}
          fill={TARGET_COLORS.ink}
          style={boldStyle}
        >
          {formatInt(report.target.units)}
        </Text>
      )}
      {pivotIndex >= 0 && projectedEnd !== null && (
        <Text
          x={x(lastIndex) + 4}
          y={y(projectedEnd) + 3}
          fill={
            report.status === 'red' ? STATUS_COLORS.red.fg : TARGET_COLORS.brand
          }
          style={boldStyle}
        >
          {formatInt(projectedEnd)}
        </Text>
      )}
    </Svg>
  );
}
