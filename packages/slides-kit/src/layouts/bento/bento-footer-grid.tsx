import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface FooterGridItem {
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface BentoFooterGridProps {
  tag?: string;
  title: string;
  subtitle?: string;
  gridCards: FooterGridItem[];
  footerTitle: string;
  footerBadge?: string;
  footerContent: ReactNode;
}

/**
 * Cuadrícula de 4 tarjetas superiores con una tarjeta horizontal de síntesis anclada en el pie.
 */
export function BentoFooterGrid({
  tag,
  title,
  subtitle,
  gridCards = [],
  footerTitle,
  footerBadge,
  footerContent,
}: BentoFooterGridProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full gap-4 my-auto">
        {/* 4 Cards Grid on Top */}
        <SlideGrid cols={4} gap="1rem" className="flex-1">
          {gridCards.slice(0, 4).map((c, idx) => (
            <SlideCard
              key={`fg-${c.title || idx}`}
              variant="default"
              className="p-4 justify-between h-full"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-bold">{c.title}</h4>
                  {c.badge && (
                    <SlideBadge variant="secondary" className="text-[10px]">
                      {c.badge}
                    </SlideBadge>
                  )}
                </div>
                <div className="text-xs opacity-75">{c.content}</div>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>

        {/* Footer Banner Card Below */}
        <SlideCard variant="glow" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold">{footerTitle}</h3>
            {footerBadge && (
              <SlideBadge variant="accent">{footerBadge}</SlideBadge>
            )}
          </div>
          <div className="text-sm opacity-85">{footerContent}</div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}
