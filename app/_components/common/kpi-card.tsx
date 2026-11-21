import type { ReactNode } from 'react';
import { Card, CardContent } from '@/app/_components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: 'default' | 'amber' | 'emerald' | 'cyan' | 'rose';
}

const ACCENT_TOP: Record<NonNullable<KpiCardProps['accent']>, string> = {
  default: 'border-t-stone-800',
  amber: 'border-t-amber-600',
  emerald: 'border-t-emerald-600',
  cyan: 'border-t-cyan-600',
  rose: 'border-t-rose-600',
};

/**
 * Architectural metric card with top accent bar and tabular numeric emphasis.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = 'default',
}: KpiCardProps) {
  return (
    <Card className={cn('border-t-2', ACCENT_TOP[accent])}>
      <CardContent className="p-5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {label}
            </p>
            <div className="text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
              {value}
            </div>
            {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
          </div>
          {icon ? (
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-600">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
