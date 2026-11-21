'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 text-stone-600',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-xs hover:text-stone-900',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content className={cn('mt-4 focus:outline-none', className)} {...props} />
  );
}
