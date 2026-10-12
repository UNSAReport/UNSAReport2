import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface Bento1Wide2StackedProps {
  tag?: string;
  title: string;
  subtitle?: string;
  topLeftTitle: string;
  topLeftContent: ReactNode;
  topRightTitle: string;
  topRightContent: ReactNode;
  bottomWideTitle: string;
  bottomWideBadge?: string;
  bottomWideContent: ReactNode;
}

/**
 * Dos tarjetas superiores en columnas simétricas y una tarjeta ancha completa en la base.
 */
export function Bento1Wide2Stacked({
  tag,
  title,
  subtitle,
  topLeftTitle,
  topLeftContent,
  topRightTitle,
  topRightContent,
  bottomWideTitle,
  bottomWideBadge,
  bottomWideContent,
}: Bento1Wide2StackedProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col gap-6">
        {/* Top 2 Cards */}
        <SlideGrid cols={2} gap="1.5rem" className="flex-1 min-h-0 min-w-0">
          <SlideCard
            variant="default"
            className="p-6 min-w-0 min-h-0 h-full overflow-hidden"
          >
            <h4 className="text-lg font-bold mb-2 line-clamp-2 break-words">
              {topLeftTitle}
            </h4>
            <div className="text-xs opacity-80 leading-relaxed line-clamp-6 break-words overflow-hidden">
              {topLeftContent}
            </div>
          </SlideCard>
          <SlideCard
            variant="default"
            className="p-6 min-w-0 min-h-0 h-full overflow-hidden"
          >
            <h4 className="text-lg font-bold mb-2 line-clamp-2 break-words">
              {topRightTitle}
            </h4>
            <div className="text-xs opacity-80 leading-relaxed line-clamp-6 break-words overflow-hidden">
              {topRightContent}
            </div>
          </SlideCard>
        </SlideGrid>

        {/* Bottom Full Wide Card */}
        <SlideCard
          variant="glow"
          className="flex-1 min-h-0 min-w-0 p-6 overflow-hidden"
        >
          <div className="min-w-0 min-h-0 overflow-hidden">
            <div className="flex justify-between items-center gap-4 mb-2">
              <h3 className="text-xl font-bold line-clamp-2 break-words min-w-0">
                {bottomWideTitle}
              </h3>
              {bottomWideBadge && (
                <SlideBadge variant="accent" className="shrink-0">
                  {bottomWideBadge}
                </SlideBadge>
              )}
            </div>
            <div className="text-sm opacity-85 leading-relaxed line-clamp-3 break-words overflow-hidden">
              {bottomWideContent}
            </div>
          </div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}
