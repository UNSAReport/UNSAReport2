import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface Bento6Item {
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface Bento6GridProps {
  tag?: string;
  title: string;
  subtitle?: string;
  cards: Bento6Item[];
}

/**
 * Cuadrícula Bento estándar de 6 tarjetas ordenadas en matriz 3x2.
 */
export function Bento6Grid({
  tag,
  title,
  subtitle,
  cards = [],
}: Bento6GridProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid
        cols={3}
        gap="1.25rem"
        className="flex-1 min-h-0 items-stretch"
      >
        {cards.slice(0, 6).map((c, idx) => (
          <SlideCard
            key={`bento-6-${c.title || idx}`}
            variant="default"
            className="p-5 justify-between min-h-0 min-w-0 h-full overflow-hidden"
          >
            <div className="min-w-0 overflow-hidden">
              <div className="flex justify-between items-center gap-2 mb-2">
                <h4 className="text-base font-bold line-clamp-2 break-words min-w-0">
                  {c.title}
                </h4>
                {c.badge && (
                  <SlideBadge
                    variant="secondary"
                    className="text-[10px] shrink-0"
                  >
                    {c.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80 leading-relaxed line-clamp-4 break-words overflow-hidden">
                {c.content}
              </div>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}
