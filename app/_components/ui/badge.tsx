import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const bayBadgeStyles = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral: 'border-stone-200 bg-stone-100 text-stone-700',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        rose: 'border-rose-200 bg-rose-50 text-rose-800',
        amber: 'border-amber-200 bg-amber-50 text-amber-800',
        cyan: 'border-cyan-200 bg-cyan-50 text-cyan-800',
        dark: 'border-stone-800 bg-stone-900 text-stone-100',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof bayBadgeStyles> {}

/**
 * Semantic status or category pill badge.
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(bayBadgeStyles({ variant }), className)} {...props} />;
}
