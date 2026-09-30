import type { ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  padding?: CardPadding;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  padding = 'md',
  children,
  className = '',
  labelledBy,
}: CardProps) {
  return (
    <article
      aria-labelledby={labelledBy}
      className={`rounded-2xl bg-slate-900/60 border border-slate-800 ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </article>
  );
}
