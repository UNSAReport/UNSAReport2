import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  titleId?: string;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  titleId = 'empty-state-heading',
}: EmptyStateProps) {
  return (
    <section
      aria-labelledby={titleId}
      className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30"
    >
      {icon ? (
        <div className="inline-flex p-3 rounded-full bg-slate-800 text-slate-400 mb-4">
          {icon}
        </div>
      ) : null}
      <h2 id={titleId} className="text-lg font-bold text-slate-200">
        {title}
      </h2>
      {body ? (
        <div className="text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6">
          {body}
        </div>
      ) : null}
      {action ? <div className="flex justify-center">{action}</div> : null}
    </section>
  );
}
