import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn('w-full caption-bottom text-sm text-left', className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-stone-50 border-b border-stone-200 text-stone-500', className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-stone-200', className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors hover:bg-stone-50/70', className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-xs font-semibold uppercase tracking-wider text-stone-500 align-middle whitespace-nowrap',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 align-middle text-stone-800', className)}
      {...props}
    />
  );
}
