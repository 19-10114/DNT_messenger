'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon, MinusIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean;
}

function Checkbox({
  className,
  indeterminate = false,
  checked,
  ...props
}: CheckboxProps) {
  const displayChecked = indeterminate ? true : checked;

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={displayChecked}
      data-indeterminate={indeterminate}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-[4px] border-2 border-gray-300 bg-white dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        {indeterminate ? (
          <MinusIcon className="h-3.5 w-3.5 text-white" />
        ) : (
          <CheckIcon className="h-3.5 w-3.5" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
