import { formatIdr } from '@/utils/format';
import { cn } from '@/lib/utils';

/**
 * Displays an IDR currency amount in tabular-nums monospace alignment.
 */
export function CurrencyText({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {formatIdr(amount)}
    </span>
  );
}
