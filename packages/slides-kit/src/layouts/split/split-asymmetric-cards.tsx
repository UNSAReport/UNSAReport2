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
 * Dos tarjetas asimétricas para romper la monotonía visual con dinamismo arquitectónico.
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
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 items-stretch"
        left={
          <SlideCard
            variant="default"
            className="h-full min-h-0 min-w-0 overflow-hidden p-8 justify-between"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <div className="flex justify-between items-center gap-3 mb-4 min-w-0">
                <h3 className="text-2xl font-bold line-clamp-2 break-words min-w-0">
                  {leftTitle}
                </h3>
                {leftBadge && (
                  <SlideBadge variant="secondary">{leftBadge}</SlideBadge>
                )}
              </div>
              <div className="text-base leading-relaxed opacity-85 break-words line-clamp-[10] overflow-hidden min-w-0">
                {leftContent}
              </div>
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="elevated"
            className="h-full min-h-0 min-w-0 overflow-hidden p-8 justify-between"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <div className="flex justify-between items-center gap-3 mb-4 min-w-0">
                <h3 className="text-2xl font-bold line-clamp-2 break-words min-w-0">
                  {rightTitle}
                </h3>
                {rightBadge && (
                  <SlideBadge variant="accent">{rightBadge}</SlideBadge>
                )}
              </div>
              <div className="text-base leading-relaxed opacity-85 break-words line-clamp-[10] overflow-hidden min-w-0">
                {rightContent}
              </div>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}
