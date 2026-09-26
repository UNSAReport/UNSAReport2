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
        left={
          <div className="h-full flex flex-col gap-4">
            <SlideCard variant="default" className="flex-1 p-6 justify-between">
              <h4 className="text-lg font-bold mb-2">{topWideTitle}</h4>
              <div className="text-xs opacity-80 leading-relaxed">
                {topWideContent}
              </div>
            </SlideCard>
            <SlideCard variant="default" className="flex-1 p-6 justify-between">
              <h4 className="text-lg font-bold mb-2">{bottomWideTitle}</h4>
              <div className="text-xs opacity-80 leading-relaxed">
                {bottomWideContent}
              </div>
            </SlideCard>
          </div>
        }
        right={
          <SlideCard variant="glow" className="h-full justify-between p-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{tallTitle}</h3>
                {tallBadge && (
                  <SlideBadge variant="accent">{tallBadge}</SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85 leading-relaxed">
                {tallContent}
              </div>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}
