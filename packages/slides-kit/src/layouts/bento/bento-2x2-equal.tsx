import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
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
      <SlideGrid cols={2} gap="1.5rem" className="my-auto h-full">
        {cards.slice(0, 4).map((c, idx) => (
          <SlideCard
            key={`bento-2x2-${c.title || idx}`}
            variant="default"
            className="p-6 justify-between h-full"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xl font-bold">{c.title}</h4>
                {c.badge && (
                  <SlideBadge variant="secondary" className="text-xs">
                    {c.badge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85 leading-relaxed">
                {c.content}
              </div>
            </div>
            {c.footer && (
              <div className="mt-4 pt-3 border-t border-current/10 text-xs opacity-60 font-mono">
                {c.footer}
              </div>
            )}
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}
