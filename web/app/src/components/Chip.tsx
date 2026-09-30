import type { ReactNode } from 'react';

export type ChipStatus = 'public' | 'org' | 'private' | 'unlisted';

export interface ChipProps {
  status: ChipStatus;
  children?: ReactNode;
  className?: string;
}

const statusClasses: Record<ChipStatus, string> = {
  public: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  org: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  private: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  unlisted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function Chip({ status, children, className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border uppercase tracking-wider ${statusClasses[status]} ${className}`}
    >
      {children ?? status}
    </span>
  );
}
