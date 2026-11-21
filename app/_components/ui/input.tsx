import type { InputHTMLAttributes, Ref } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

/**
 * Architectural form input with crisp stone border and amber focus ring.
 */
export function Input({ className, type, ref, ...props }: InputProps) {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/30 focus-visible:border-amber-600 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
