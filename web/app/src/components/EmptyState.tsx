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
      className="p-12 text-center rounded-none border border-dashed border-[#C7C7C7] bg-transparent"
    >
      {icon ? (
        <div className="inline-flex p-3 rounded-none bg-[#141414] text-[#E3E2DE] mb-4">
          {icon}
        </div>
      ) : null}
      <h2 id={titleId} className="text-lg font-bold text-[#141414]">
        {title}
      </h2>
      {body ? (
        <div className="text-sm text-[#444343] max-w-md mx-auto mt-2 mb-6">
          {body}
        </div>
      ) : null}
      {action ? <div className="flex justify-center">{action}</div> : null}
    </section>
  );
}
