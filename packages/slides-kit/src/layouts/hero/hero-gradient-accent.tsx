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
      <div className="relative z-10 flex flex-1 min-h-0 min-w-0 w-full flex-col justify-center items-center text-center max-w-4xl mx-auto px-6 overflow-hidden">
        {tag && (
          <div className="mb-6 shrink-0">
            <SlideBadge variant="accent">{tag}</SlideBadge>
          </div>
        )}

        <h1
          className="text-6xl font-black tracking-tight mb-6 leading-tight line-clamp-2 break-words min-w-0"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-2xl opacity-80 mb-10 leading-relaxed max-w-2xl font-light line-clamp-3 break-words min-w-0">
            {subtitle}
          </p>
        )}

        {(author || date) && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-semibold opacity-85 px-6 py-3 rounded-full border border-current/20 max-w-full overflow-hidden shrink-0">
            {author && <span className="truncate max-w-full">{author}</span>}
            {author && date && <span className="opacity-40 shrink-0">•</span>}
            {date && (
              <span className="opacity-70 truncate max-w-full">{date}</span>
            )}
          </div>
        )}

        {children}
      </div>
    </SlideSection>
  );
}
