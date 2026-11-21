import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, Ref } from 'react';
import { cn } from '@/lib/utils';

const bayButtonStyles = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-amber-600 text-white shadow-xs hover:bg-amber-700',
        dark: 'bg-stone-900 text-stone-50 shadow-xs hover:bg-stone-800',
        outline: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100',
        secondary: 'bg-stone-200/80 text-stone-900 hover:bg-stone-200',
        ghost: 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700',
        emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bayButtonStyles> {
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Primary action button component using CVA styling variants.
 */
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps) {
  const Element = asChild ? Slot : 'button';
  return (
    <Element
      ref={ref}
      className={cn(bayButtonStyles({ variant, size }), className)}
      {...props}
    />
  );
}
