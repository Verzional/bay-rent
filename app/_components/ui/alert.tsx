import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const bayAlertStyles = cva(
  'relative w-full rounded-xl border px-4 py-3 text-sm flex items-start gap-3',
  {
    variants: {
      variant: {
        neutral: 'border-stone-200 bg-stone-50 text-stone-800',
        amber: 'border-amber-300 bg-amber-50 text-amber-950',
        emerald: 'border-emerald-300 bg-emerald-50 text-emerald-950',
        rose: 'border-rose-300 bg-rose-50 text-rose-950',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bayAlertStyles> {}

/**
 * Inline notification banner for status updates and validation feedback.
 */
export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(bayAlertStyles({ variant }), className)} {...props} />
  );
}
