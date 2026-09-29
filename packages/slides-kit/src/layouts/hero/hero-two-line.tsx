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
      <div className="flex flex-col justify-center w-full h-full min-h-0 min-w-0 overflow-hidden max-w-5xl">
        <div className="flex-1 min-h-0 flex flex-col justify-center min-w-0 overflow-hidden">
          {tag && (
            <div className="mb-4 shrink-0">
              <SlideBadge variant="secondary">{tag}</SlideBadge>
            </div>
          )}

          <div
            className="mb-6 min-w-0 shrink-0"
            style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
          >
            <div className="text-4xl font-light opacity-70 tracking-tight truncate">
              {line1}
            </div>
            <div className="text-7xl font-black tracking-tight leading-none mt-2 line-clamp-2 break-words">
              {line2}
            </div>
          </div>

          {subtitle && (
            <p className="text-xl opacity-80 max-w-2xl mb-8 leading-relaxed line-clamp-3 break-words">
              {subtitle}
            </p>
          )}

          {(author || date) && (
            <div className="flex items-center gap-4 text-sm font-mono opacity-70 pt-4 border-t border-current/10 shrink-0 min-w-0 overflow-hidden">
              {author && (
                <span className="font-bold opacity-100 truncate">{author}</span>
              )}
              {author && date && <span className="shrink-0">/</span>}
              {date && <span className="truncate">{date}</span>}
            </div>
          )}
        </div>

        {children}
      </div>
    </SlideSection>
  );
}
