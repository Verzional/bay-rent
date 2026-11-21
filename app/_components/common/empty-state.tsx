import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Centered empty-state panel for lists and tables with zero records.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/70 px-6 py-12 text-center">
      {icon ? (
        <div className="mb-3 rounded-xl border border-stone-200 bg-white p-3 text-stone-500">
          {icon}
        </div>
      ) : null}
      <h4 className="text-sm font-semibold text-stone-900">{title}</h4>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
