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
      <div className="flex w-full flex-1 min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        {/* 4 Cards Grid on Top */}
        <SlideGrid cols={4} gap="1rem" className="h-auto min-h-0 flex-1">
          {gridCards.slice(0, 4).map((c, idx) => (
            <SlideCard
              key={`fg-${c.title || idx}`}
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

        {/* Footer Banner Card Below */}
        <SlideCard
          variant="glow"
          className="min-w-0 shrink-0 overflow-hidden p-6"
        >
          <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
            <h3 className="min-w-0 truncate text-xl font-bold">
              {footerTitle}
            </h3>
            {footerBadge && (
              <SlideBadge variant="accent" className="shrink-0">
                {footerBadge}
              </SlideBadge>
            )}
          </div>
          <div className="break-words text-sm opacity-85 line-clamp-3">
            {footerContent}
          </div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}
