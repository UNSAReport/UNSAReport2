import type { ReactNode } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface StackedCardInfo {
  title: string;
  description: string;
}

export interface SplitStackedLeftProps {
  tag?: string;
  title: string;
  subtitle?: string;
  topCard: StackedCardInfo;
  bottomCard: StackedCardInfo;
  rightTitle: string;
  rightContent: ReactNode;
}

/**
 * Dos tarjetas apiladas verticalmente a la izquierda con un bloque principal continuo a la derecha.
 */
export function SplitStackedLeft({
  tag,
  title,
  subtitle,
  topCard,
  bottomCard,
  rightTitle,
  rightContent,
}: SplitStackedLeftProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <div className="h-full min-h-0 min-w-0 flex flex-col justify-between gap-6 overflow-hidden">
            <SlideCard
              variant="default"
              className="flex-1 min-h-0 min-w-0 p-6 justify-center overflow-hidden"
            >
              <h4 className="text-xl font-bold mb-2 truncate">
                {topCard.title}
              </h4>
              <p className="text-sm opacity-80 leading-relaxed line-clamp-3 break-words">
                {topCard.description}
              </p>
            </SlideCard>
            <SlideCard
              variant="default"
              className="flex-1 min-h-0 min-w-0 p-6 justify-center overflow-hidden"
            >
              <h4 className="text-xl font-bold mb-2 truncate">
                {bottomCard.title}
              </h4>
              <p className="text-sm opacity-80 leading-relaxed line-clamp-3 break-words">
                {bottomCard.description}
              </p>
            </SlideCard>
          </div>
        }
        right={
          <SlideCard
            variant="elevated"
            className="h-full min-h-0 min-w-0 justify-start p-8 overflow-hidden"
          >
            <h3 className="text-2xl font-bold mb-4 truncate shrink-0">
              {rightTitle}
            </h3>
            <div className="text-base leading-relaxed opacity-90 min-h-0 flex-1 overflow-hidden line-clamp-6 break-words">
              {rightContent}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}
