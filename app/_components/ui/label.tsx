'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Accessible form label component wrapping Radix Label.
 */
export function Label({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'block text-xs font-semibold uppercase tracking-wide text-stone-600',
        className,
      )}
      {...props}
    />
  );
}
