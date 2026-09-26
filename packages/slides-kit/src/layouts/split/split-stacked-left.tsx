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
          <div className="h-full flex flex-col gap-6">
            <SlideCard variant="default" className="flex-1 p-6 justify-center">
              <h4 className="text-xl font-bold mb-2">{topCard.title}</h4>
              <p className="text-sm opacity-80 leading-relaxed">
                {topCard.description}
              </p>
            </SlideCard>
            <SlideCard variant="default" className="flex-1 p-6 justify-center">
              <h4 className="text-xl font-bold mb-2">{bottomCard.title}</h4>
              <p className="text-sm opacity-80 leading-relaxed">
                {bottomCard.description}
              </p>
            </SlideCard>
          </div>
        }
        right={
          <SlideCard variant="elevated" className="h-full justify-start p-8">
            <h3 className="text-2xl font-bold mb-4">{rightTitle}</h3>
            <div className="text-base leading-relaxed opacity-90">
              {rightContent}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}
