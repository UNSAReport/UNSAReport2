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
      <div className="flex flex-col h-full gap-4 my-auto">
        {/* Top 2 Cards */}
        <SlideGrid cols={2} gap="1.5rem" className="flex-1">
          <SlideCard variant="default" className="p-6 justify-between h-full">
            <h4 className="text-lg font-bold mb-2">{topLeftTitle}</h4>
            <div className="text-xs opacity-80 leading-relaxed">
              {topLeftContent}
            </div>
          </SlideCard>
          <SlideCard variant="default" className="p-6 justify-between h-full">
            <h4 className="text-lg font-bold mb-2">{topRightTitle}</h4>
            <div className="text-xs opacity-80 leading-relaxed">
              {topRightContent}
            </div>
          </SlideCard>
        </SlideGrid>

        {/* Bottom Full Wide Card */}
        <SlideCard variant="glow" className="flex-1 p-6 justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold">{bottomWideTitle}</h3>
              {bottomWideBadge && (
                <SlideBadge variant="accent">{bottomWideBadge}</SlideBadge>
              )}
            </div>
            <div className="text-sm opacity-85 leading-relaxed">
              {bottomWideContent}
            </div>
          </div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}
