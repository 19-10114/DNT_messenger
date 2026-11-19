'use client';

import React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { cn } from '@/lib/utils';
import { EvaluationIssue } from '@/stores/usedBikeEvaluation/usedBikeEvaluation.store';
import { optionStyle } from './evaluationOptions';

/** Alto de cada fila y cuántas se ven sin hacer scroll */
const ISSUE_ROW_HEIGHT = '4.5rem';
const DEFAULT_VISIBLE_ROWS = 3;

interface IssueRowProps {
  issue: EvaluationIssue;
  /** Sin handler la fila no es interactiva: solo muestra lo asignado */
  onOpen?: () => void;
}

/** Un hallazgo en una sola línea: letra, pregunta, asignados y total */
function IssueRow({ issue, onOpen }: IssueRowProps) {
  const style = optionStyle(issue.optionLabel);
  const total = issue.products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen) return;
        if (event.key === 'Enter' || event.key === ' ') onOpen();
      }}
      className={cn(
        // Alto fijo: así entran exactamente tres filas en la sección
        'grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-3',
        'h-[var(--issue-row-height)] px-6 border-b border-gray-200 last:border-b-0',
        onOpen && 'cursor-pointer hover:bg-muted/40 transition-colors'
      )}
    >
      <span
        className={cn(
          'h-6 min-w-[1.5rem] rounded border px-1.5 flex items-center justify-center text-xs font-semibold',
          style.badge
        )}
      >
        {issue.optionLabel}
      </span>

      <div className="min-w-0">
        <p className="text-xs truncate">
          {issue.questionText}
          <span className="ml-2 text-gray-400">
            {issue.score}/{issue.maxScore}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {issue.section}
        </p>
      </div>

      {/* Si hay muchos repuestos, scrollean dentro de la fila */}
      <div className="min-w-0 min-h-0 max-h-full overflow-y-auto flex flex-col gap-0.5 py-1">
        {issue.products.length === 0 ? (
          <span className="text-[11px] text-muted-foreground italic">
            Sin repuestos asignados
          </span>
        ) : (
          issue.products.map((product) => (
            <span key={product.id} className="text-[11px] truncate">
              {product.name}
              {product.quantity > 1 ? ` x${product.quantity}` : ''} - $
              {(product.price * product.quantity).toFixed(2)}
            </span>
          ))
        )}
      </div>

      <span className="text-xs font-semibold whitespace-nowrap text-right">
        ${total.toFixed(2)}
      </span>
    </div>
  );
}

interface RequiredPartsCardProps {
  /** Hallazgos R y M, con lo que ya tengan asignado */
  issues: EvaluationIssue[];
  /**
   * Abre el hallazgo para asignarle repuestos. Sin este handler la tabla es de
   * solo lectura: así se comparte entre la evaluación y la ficha de la unidad.
   */
  onOpenIssue?: (questionId: number) => void;
  /** Filas visibles antes de que la lista haga scroll */
  visibleRows?: number;
}

/** Repuestos necesarios para los hallazgos de la evaluación, con su costo */
export function RequiredPartsCard({
  issues,
  onOpenIssue,
  visibleRows = DEFAULT_VISIBLE_ROWS,
}: RequiredPartsCardProps) {
  const totalCost = issues.reduce(
    (sum, issue) =>
      sum +
      issue.products.reduce(
        (acc, product) => acc + product.price * product.quantity,
        0
      ),
    0
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Repuestos necesarios</CardTitle>
          <span className="text-sm whitespace-nowrap">
            <span className="text-muted-foreground">Costo total: </span>
            <span className="font-semibold">${totalCost.toFixed(2)}</span>
          </span>
        </div>
      </CardHeader>

      {/*
        Alto fijo: el resto se ve con scroll. El espacio vertical de la vista
        es para los resultados de la valuación.
      */}
      <CardContent
        className="p-0 overflow-y-auto"
        style={{
          ['--issue-row-height' as string]: ISSUE_ROW_HEIGHT,
          height: `calc(${ISSUE_ROW_HEIGHT} * ${visibleRows})`,
        }}
      >
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 px-6 text-center">
            No se marcaron hallazgos: la unidad quedó en buen estado.
          </p>
        ) : (
          issues.map((issue) => (
            <IssueRow
              key={issue.questionId}
              issue={issue}
              onOpen={
                onOpenIssue ? () => onOpenIssue(issue.questionId) : undefined
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
