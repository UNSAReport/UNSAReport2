import type { ReactNode } from 'react';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroCenteredSubtitleProps {
  pretitle?: string;
  title: string;
  subtitle: string;
  author?: string;
  children?: ReactNode;
}

/**
 * Portada con énfasis equilibrado entre título y un subtítulo explicativo amplio.
 */
export function HeroCenteredSubtitle({
  pretitle,
  title,
  subtitle,
  author,
  children,
}: HeroCenteredSubtitleProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto my-auto px-6">
        {pretitle && (
          <span className="text-sm font-mono tracking-widest uppercase text-[var(--slide-accent-secondary,#D4AF37)] mb-4">
            {pretitle}
          </span>
        )}
        <h1
          className="text-5xl md:text-6xl font-extrabold text-[var(--slide-text,#f1f5f9)] mb-6 leading-tight"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-[var(--slide-text-muted,#94a3b8)] leading-relaxed max-w-3xl mb-8">
          {subtitle}
        </p>
        {author && (
          <div className="text-sm font-semibold text-[var(--slide-accent,#800020)] tracking-wide uppercase">
            {author}
          </div>
        )}
        {children}
      </div>
    </SlideSection>
  );
}
