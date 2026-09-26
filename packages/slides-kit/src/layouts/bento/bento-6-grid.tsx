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
      <SlideGrid cols={3} gap="1.25rem" className="my-auto h-full">
        {cards.slice(0, 6).map((c, idx) => (
          <SlideCard
            key={`bento-6-${c.title || idx}`}
            variant="default"
            className="p-5 justify-between h-full"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-bold">{c.title}</h4>
                {c.badge && (
                  <SlideBadge variant="secondary" className="text-[10px]">
                    {c.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-xs opacity-80 leading-relaxed">
                {c.content}
              </div>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}
