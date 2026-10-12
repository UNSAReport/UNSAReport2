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
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        {/* Header Banner Card */}
        <SlideCard
          variant="glow"
          className="min-w-0 shrink-0 overflow-hidden p-6"
        >
          <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
            <h3 className="min-w-0 truncate text-xl font-bold">
              {headerTitle}
            </h3>
            {headerBadge && (
              <SlideBadge variant="accent" className="shrink-0">
                {headerBadge}
              </SlideBadge>
            )}
          </div>
          <div className="break-words text-sm opacity-85 line-clamp-3">
            {headerContent}
          </div>
        </SlideCard>

        {/* 4 Cards Grid Below */}
        <SlideGrid cols={4} gap="1rem" className="h-auto min-h-0 flex-1">
          {gridCards.slice(0, 4).map((c, idx) => (
            <SlideCard
              key={`hg-${c.title || idx}`}
              variant="default"
              className="min-h-0 min-w-0 justify-between overflow-hidden p-4"
            >
              <div className="min-h-0 min-w-0 overflow-hidden">
                <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                  <h4 className="min-w-0 truncate text-sm font-bold">
                    {c.title}
                  </h4>
                  {c.badge && (
                    <SlideBadge
                      variant="secondary"
                      className="shrink-0 text-[10px]"
                    >
                      {c.badge}
                    </SlideBadge>
                  )}
                </div>
                <div className="break-words text-xs opacity-75 line-clamp-6">
                  {c.content}
                </div>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}
