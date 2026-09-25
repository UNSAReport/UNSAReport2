import type { ReactNode } from 'react';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroMinimalProps {
  title: string;
  subtitle?: string;
  category?: string;
  date?: string;
  children?: ReactNode;
}

/**
 * Portada ultraminimalista con abundante espacio en blanco (o negro) y tipografía cuidada.
 */
export function HeroMinimal({
  title,
  subtitle,
  category,
  date,
  children,
}: HeroMinimalProps) {
  return (
    <SlideSection withGradientBar={false}>
      <div className="flex flex-col justify-end h-full p-8 max-w-4xl">
        {category && (
          <span className="text-xs uppercase font-mono tracking-widest text-[var(--slide-accent-secondary,#D4AF37)] mb-4">
            {category}
          </span>
        )}
        <h1
          className="text-6xl font-light tracking-tight text-[var(--slide-text,#f1f5f9)] mb-6 leading-tight"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-2xl text-[var(--slide-text-muted,#94a3b8)] font-light max-w-2xl mb-8">
            {subtitle}
          </p>
        )}
        {date && (
          <div className="text-sm font-mono text-[var(--slide-text-muted,#94a3b8)]">
            {date}
          </div>
        )}
        {children}
      </div>
    </SlideSection>
  );
}
