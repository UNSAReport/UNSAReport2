import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface Bento2Wide1TallProps {
  tag?: string;
  title: string;
  subtitle?: string;
  topWideTitle: string;
  topWideContent: ReactNode;
  bottomWideTitle: string;
  bottomWideContent: ReactNode;
  tallTitle: string;
  tallBadge?: string;
  tallContent: ReactNode;
}

/**
 * Dos tarjetas anchas apiladas a la izquierda y una tarjeta vertical dominante a la derecha.
 */
export function Bento2Wide1Tall({
  tag,
  title,
  subtitle,
  topWideTitle,
  topWideContent,
  bottomWideTitle,
  bottomWideContent,
  tallTitle,
  tallBadge,
  tallContent,
}: Bento2Wide1TallProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="60-40"
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
        left={
          <div className="min-h-0 min-w-0 h-full overflow-hidden flex flex-col gap-6">
            <SlideCard
              variant="default"
              className="flex-1 min-h-0 min-w-0 p-6 overflow-hidden"
            >
              <h4 className="text-lg font-bold mb-2 line-clamp-2 break-words">
                {topWideTitle}
              </h4>
              <div className="text-xs opacity-80 leading-relaxed line-clamp-4 break-words overflow-hidden">
                {topWideContent}
              </div>
            </SlideCard>
            <SlideCard
              variant="default"
              className="flex-1 min-h-0 min-w-0 p-6 overflow-hidden"
            >
              <h4 className="text-lg font-bold mb-2 line-clamp-2 break-words">
                {bottomWideTitle}
              </h4>
              <div className="text-xs opacity-80 leading-relaxed line-clamp-4 break-words overflow-hidden">
                {bottomWideContent}
              </div>
            </SlideCard>
          </div>
        }
        right={
          <SlideCard
            variant="glow"
            className="min-h-0 min-w-0 h-full p-8 overflow-hidden"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <div className="flex justify-between items-center gap-4 mb-4">
                <h3 className="text-2xl font-bold line-clamp-2 break-words min-w-0">
                  {tallTitle}
                </h3>
                {tallBadge && (
                  <SlideBadge variant="accent" className="shrink-0">
                    {tallBadge}
                  </SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85 leading-relaxed line-clamp-[12] break-words overflow-hidden">
                {tallContent}
              </div>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}
