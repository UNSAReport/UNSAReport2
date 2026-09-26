import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroGradientAccentProps {
  tag?: string;
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  children?: ReactNode;
}

/**
 * Portada moderna con énfasis visual y metadatos de autor.
 */
export function HeroGradientAccent({
  tag = 'Conferencia Especial',
  title,
  subtitle,
  author,
  date,
  children,
}: HeroGradientAccentProps) {
  return (
    <SlideSection withGradientBar={false} className="relative overflow-hidden">
      <div className="relative z-10 flex flex-col justify-center items-center text-center h-full max-w-4xl mx-auto px-6">
        {tag && (
          <div className="mb-6">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h1
          className="text-6xl font-black tracking-tight mb-6 leading-tight"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-2xl opacity-80 mb-10 leading-relaxed max-w-2xl font-light">
            {subtitle}
          </p>
        )}

        {(author || date) && (
          <div className="flex items-center gap-4 text-sm font-semibold opacity-85 px-6 py-3 rounded-full border border-current/20">
            {author && <span>{author}</span>}
            {author && date && <span className="opacity-40">•</span>}
            {date && <span className="opacity-70">{date}</span>}
          </div>
        )}

        {children}
      </div>
    </SlideSection>
  );
}
