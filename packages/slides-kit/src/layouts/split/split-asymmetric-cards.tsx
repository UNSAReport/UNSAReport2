import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SplitAsymmetricCardsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  leftTitle: string;
  leftBadge?: string;
  leftContent: ReactNode;
  rightTitle: string;
  rightBadge?: string;
  rightContent: ReactNode;
}

/**
 * Dos tarjetas asimétricas desfasadas para romper la monotonía visual con dinamismo arquitectónico.
 */
export function SplitAsymmetricCards({
  tag,
  title,
  subtitle,
  leftTitle,
  leftBadge,
  leftContent,
  rightTitle,
  rightBadge,
  rightContent,
}: SplitAsymmetricCardsProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2.5rem"
        left={
          <div className="h-full flex flex-col justify-start pt-4">
            <SlideCard variant="default" className="p-8 justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">{leftTitle}</h3>
                  {leftBadge && (
                    <SlideBadge variant="secondary">{leftBadge}</SlideBadge>
                  )}
                </div>
                <div className="text-base leading-relaxed opacity-85">
                  {leftContent}
                </div>
              </div>
            </SlideCard>
          </div>
        }
        right={
          <div className="h-full flex flex-col justify-end pb-4">
            <SlideCard variant="elevated" className="p-8 justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">{rightTitle}</h3>
                  {rightBadge && (
                    <SlideBadge variant="accent">{rightBadge}</SlideBadge>
                  )}
                </div>
                <div className="text-base leading-relaxed opacity-85">
                  {rightContent}
                </div>
              </div>
            </SlideCard>
          </div>
        }
      />
    </SlideSection>
  );
}
