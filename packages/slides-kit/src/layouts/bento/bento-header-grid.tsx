import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeaderGridItem {
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface BentoHeaderGridProps {
  tag?: string;
  title: string;
  subtitle?: string;
  headerTitle: string;
  headerBadge?: string;
  headerContent: ReactNode;
  gridCards: HeaderGridItem[];
}

/**
 * Tarjeta horizontal completa superior con fila inferior de 4 tarjetas en cuadrícula.
 */
export function BentoHeaderGrid({
  tag,
  title,
  subtitle,
  headerTitle,
  headerBadge,
  headerContent,
  gridCards = [],
}: BentoHeaderGridProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full gap-4 my-auto">
        {/* Header Banner Card */}
        <SlideCard variant="glow" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold">{headerTitle}</h3>
            {headerBadge && (
              <SlideBadge variant="accent">{headerBadge}</SlideBadge>
            )}
          </div>
          <div className="text-sm opacity-85">{headerContent}</div>
        </SlideCard>

        {/* 4 Cards Grid Below */}
        <SlideGrid cols={4} gap="1rem" className="flex-1">
          {gridCards.slice(0, 4).map((c, idx) => (
            <SlideCard
              key={`hg-${c.title || idx}`}
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
      </div>
    </SlideSection>
  );
}
