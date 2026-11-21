import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  href?: string;
  inverted?: boolean;
  subtitle?: string;
}

/**
 * Geometric Bay-Rent architectural garage-bay emblem and wordmark.
 */
export function BrandMark({ href = '/', inverted = false, subtitle }: BrandMarkProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
          inverted
            ? 'border-amber-500/40 bg-amber-600 text-white'
            : 'border-stone-800 bg-stone-900 text-amber-400 group-hover:bg-stone-800',
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path
            d="M3.5 9.5L12 4L20.5 9.5V19.5H17.5V11H6.5V19.5H3.5V9.5Z"
            fill="currentColor"
          />
          <rect
            x="8.5"
            y="14"
            width="7"
            height="2.2"
            rx="1"
            fill={inverted ? '#1C1917' : '#FFFFFF'}
          />
          <rect
            x="8.5"
            y="17.5"
            width="7"
            height="2"
            rx="1"
            fill={inverted ? '#1C1917' : '#FFFFFF'}
            fillOpacity="0.65"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            'text-sm font-bold tracking-tight uppercase',
            inverted ? 'text-white' : 'text-stone-900',
          )}
        >
          Bay-Rent
        </span>
        {subtitle ? (
          <span
            className={cn(
              'mt-0.5 text-[11px] font-medium',
              inverted ? 'text-stone-400' : 'text-stone-500',
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
