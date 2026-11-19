import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const progressTrackVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-gray-100',
  {
    variants: {
      size: {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const progressIndicatorVariants = cva(
  'h-full rounded-full transition-[width] duration-300',
  {
    variants: {
      tone: {
        default: 'bg-primary',
        amber: 'bg-amber-500',
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        gray: 'bg-gray-400',
      },
    },
    defaultVariants: { tone: 'default' },
  }
);

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof progressTrackVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  /** Valor actual; se recorta a `0..max`. */
  value: number;
  /** Default `100`. */
  max?: number;
  indicatorClassName?: string;
}

/**
 * Barra de progreso accesible (`role="progressbar"` con sus `aria-value*`).
 * Es un `div` con Tailwind, sin dependencia de Radix. El texto ("8 / 10") lo
 * pone quien la usa; pasá `aria-label` o `aria-valuetext` para describirla.
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    { value, max = 100, size, tone, className, indicatorClassName, ...props },
    ref
  ) => {
    const safeMax = max > 0 ? max : 1;
    const clamped = Math.min(Math.max(Number(value) || 0, 0), safeMax);
    const percentage = (clamped / safeMax) * 100;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
        className={cn(progressTrackVariants({ size }), className)}
        {...props}
      >
        <div
          className={cn(
            progressIndicatorVariants({ tone }),
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
