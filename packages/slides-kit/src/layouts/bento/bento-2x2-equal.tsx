import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideDivider } from '@/primitives/SlideDivider';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface Bento2x2Item {
  title: string;
  badge?: string;
  content: ReactNode;
  footer?: string;
}

export interface Bento2x2EqualProps {
  tag?: string;
  title: string;
  subtitle?: string;
  cards: Bento2x2Item[];
}

/**
 * Cuadrícula Bento simétrica de 4 tarjetas 2x2 de igual tamaño.
 */
export function Bento2x2Equal({
  tag,
  title,
  subtitle,
  cards = [],
}: Bento2x2EqualProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid
        cols={2}
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
      >
        {cards.slice(0, 4).map((c, idx) => (
          <SlideCard
            key={`bento-2x2-${c.title || idx}`}
            variant="default"
            className="p-6 min-w-0 min-h-0 h-full overflow-hidden"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <div className="flex justify-between items-center gap-4 mb-3">
                <h4 className="text-xl font-bold line-clamp-2 break-words min-w-0">
                  {c.title}
                </h4>
                {c.badge && (
                  <SlideBadge variant="secondary" className="text-xs shrink-0">
                    {c.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85 leading-relaxed line-clamp-4 break-words overflow-hidden">
                {c.content}
              </div>
            </div>
            {c.footer && (
              <div className="min-w-0">
                <SlideDivider thickness="1px" opacity={0.12} />
                <div className="pt-3 text-xs opacity-60 font-mono truncate">
                  {c.footer}
                </div>
              </div>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}
