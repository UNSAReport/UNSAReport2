import type { ReactNode } from 'react';

export type ChipStatus = 'public' | 'org' | 'private' | 'unlisted';

export interface ChipProps {
  status: ChipStatus;
  children?: ReactNode;
  className?: string;
}

const statusClasses: Record<ChipStatus, string> = {
  public: 'bg-[#1351AA] text-[#E3E2DE] border-[#1351AA]',
  org: 'bg-transparent text-[#1351AA] border-[#1351AA]',
  private: 'bg-[#141414] text-[#E3E2DE] border-[#141414]',
  unlisted: 'bg-transparent text-[#444343] border-[#7A7A7A]',
};

export function Chip({ status, children, className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-none text-[11px] font-bold border uppercase tracking-[0.2em] ${statusClasses[status]} ${className}`}
    >
      {children ?? status}
    </span>
  );
}
