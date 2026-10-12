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
      className={`rounded-none bg-transparent border border-[#C7C7C7] ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </article>
  );
}
