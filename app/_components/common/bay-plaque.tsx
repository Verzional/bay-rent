import type { GarageType } from '@/types';
import { cn } from '@/lib/utils';

interface BayPlaqueProps {
  code: string;
  type?: GarageType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TYPE_ACCENT: Record<GarageType, string> = {
  BICYCLE: 'border-stone-300 bg-stone-100 text-stone-900',
  CAR: 'border-amber-300 bg-amber-50 text-amber-950',
  EV: 'border-cyan-300 bg-cyan-50 text-cyan-950',
};

const TYPE_DOT: Record<GarageType, string> = {
  BICYCLE: 'bg-stone-500',
  CAR: 'bg-amber-600',
  EV: 'bg-cyan-600',
};

/**
 * Architectural monospace bay plaque displaying a bay code (`S001`, `C010`, `E004`).
 */
export function BayPlaque({ code, type, size = 'md', className }: BayPlaqueProps) {
  const inferredType: GarageType =
    type ?? (code.startsWith('E') ? 'EV' : code.startsWith('C') ? 'CAR' : 'BICYCLE');

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
        ? 'px-3.5 py-1.5 text-lg'
        : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-mono font-semibold tracking-wider',
        TYPE_ACCENT[inferredType],
        sizeClass,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', TYPE_DOT[inferredType])} />
      {code}
    </span>
  );
}
