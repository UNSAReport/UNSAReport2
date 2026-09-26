import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroTwoLineProps {
  tag?: string;
  line1: string;
  line2: string;
  subtitle?: string;
  author?: string;
  date?: string;
  children?: ReactNode;
}

/**
 * Portada con título en dos líneas jerárquicas y tipografía estructural.
 */
export function HeroTwoLine({
  tag,
  line1,
  line2,
  subtitle,
  author,
  date,
  children,
}: HeroTwoLineProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col justify-center h-full p-8 max-w-5xl">
        {tag && (
          <div className="mb-4">
            <SlideBadge variant="secondary">{tag}</SlideBadge>
          </div>
        )}

        <div
          className="mb-6"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          <div className="text-4xl font-light opacity-70 tracking-tight">
            {line1}
          </div>
          <div className="text-7xl font-black tracking-tight leading-none mt-2">
            {line2}
          </div>
        </div>

        {subtitle && (
          <p className="text-xl opacity-80 max-w-2xl mb-8 leading-relaxed">
            {subtitle}
          </p>
        )}

        {(author || date) && (
          <div className="flex items-center gap-4 text-sm font-mono opacity-70 pt-4 border-t border-current/10">
            {author && <span className="font-bold opacity-100">{author}</span>}
            {author && date && <span>/</span>}
            {date && <span>{date}</span>}
          </div>
        )}

        {children}
      </div>
    </SlideSection>
  );
}
